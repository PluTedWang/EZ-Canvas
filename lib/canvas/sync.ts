import { Prisma } from "@/generated/prisma/client";
import { decrypt } from "../crypto";
import { db } from "../db";
import { materialChanged } from "../materials/notes";
import { canvas } from "./index";
import { CanvasError } from "./client";
import {
  courseIdFromContext,
  mapAnnouncement,
  mapAssignment,
  mapCourse,
  mapEvent,
  mapFile,
  mapLinks,
  mapPage,
  moduleContext,
} from "./map";
import type { CanvasCourse } from "./types";

type Api = ReturnType<typeof canvas>;
const courseColors = 4;
const day = 24 * 60 * 60 * 1000;
// The windows Canvas is asked about. Older or later items are left alone.
const announcementDays = 30;
const lecturePastDays = 28;
const lectureFutureDays = 84;
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * day).toISOString();

// Canvas answers 401 or 403 for course tabs the instructor hid; treat those as empty.
async function orEmpty<T>(request: Promise<T[]>) {
  return request.catch((error) => {
    if (error instanceof CanvasError && (error.status === 401 || error.status === 403)) return [];
    throw error;
  });
}

// A new version of a file, page or announcement drops its notes and lets it be read again.
const clearedNotes = { notes: Prisma.DbNull, notesAt: null, unsupported: null };

type MaterialData = { type: string; canvasId: string; title: string; url: string; postedAt?: Date | null; body?: string | null };

async function upsertMaterials<T extends MaterialData>(courseId: string, materials: T[]) {
  const stored = await db.material.findMany({ where: { courseId }, select: { type: true, canvasId: true, postedAt: true, body: true } });
  const byKey = new Map<string, { postedAt: Date | null; body: string | null }>(stored.map((m) => [`${m.type}:${m.canvasId}`, m]));
  for (const data of materials) {
    const before = byKey.get(`${data.type}:${data.canvasId}`);
    await db.material.upsert({
      where: { courseId_type_canvasId: { courseId, type: data.type, canvasId: data.canvasId } },
      update: before && materialChanged(before, data) ? { ...data, ...clearedNotes } : data,
      create: { ...data, courseId },
    });
  }
}

async function upsertCourse(userId: string, raw: CanvasCourse) {
  const data = mapCourse(raw);
  const where = { userId_canvasId: { userId, canvasId: raw.id } };
  const existing = await db.course.findUnique({ where, select: { id: true } });
  if (existing) return db.course.update({ where, data });
  const color = ((await db.course.count({ where: { userId } })) % courseColors) + 1;
  return db.course.create({ data: { ...data, userId, canvasId: raw.id, color } });
}

async function syncCourseContent(api: Api, courseId: string, canvasCourseId: number) {
  const [assignments, modules, files, pages] = await Promise.all([
    api.assignments(canvasCourseId),
    orEmpty(api.modules(canvasCourseId)),
    orEmpty(api.files(canvasCourseId)),
    orEmpty(api.pages(canvasCourseId)),
  ]);
  for (const raw of assignments) {
    const data = mapAssignment(raw);
    await db.assignment.upsert({
      where: { courseId_canvasId: { courseId, canvasId: raw.id } },
      update: data,
      create: { ...data, courseId, canvasId: raw.id },
    });
  }
  const context = moduleContext(modules);
  const materials = [...files.map((f) => mapFile(f, context)), ...pages.map((p) => mapPage(p, context)), ...mapLinks(modules)];
  await upsertMaterials(courseId, materials);

  // Whatever Canvas no longer lists was deleted or unpublished there; drop it here too.
  await db.assignment.deleteMany({ where: { courseId, canvasId: { notIn: assignments.map((a) => a.id) } } });
  for (const type of ["file", "page", "link"]) {
    const kept = materials.filter((m) => m.type === type).map((m) => m.canvasId);
    await db.material.deleteMany({ where: { courseId, type, canvasId: { notIn: kept } } });
  }
  return { assignments: assignments.length, materials: materials.length };
}

// Announcements are fetched for a window only, so only the window is pruned.
async function syncAnnouncements(api: Api, courseIds: Map<number, string>) {
  const since = isoDaysFromNow(-announcementDays);
  // Canvas rejects these endpoints without a course to ask about.
  if (courseIds.size === 0) return 0;
  const announcements = await api.announcements([...courseIds.keys()], since);
  for (const [canvasCourseId, courseId] of courseIds) {
    const mine = announcements.filter((raw) => courseIdFromContext(raw.context_code) === canvasCourseId).map(mapAnnouncement);
    await upsertMaterials(courseId, mine);
    await db.material.deleteMany({
      where: { courseId, type: "announcement", postedAt: { gte: new Date(since) }, canvasId: { notIn: mine.map((m) => m.canvasId) } },
    });
  }
  return announcements.length;
}

async function syncLectures(api: Api, userId: string, courseIds: Map<number, string>) {
  const from = isoDaysFromNow(-lecturePastDays);
  const to = isoDaysFromNow(lectureFutureDays);
  const fetched = courseIds.size > 0 ? await api.calendarEvents([...courseIds.keys()], "event", from, to) : [];
  const events = fetched.filter((raw) => raw.start_at);
  for (const raw of events) {
    const data = { ...mapEvent(raw), courseId: courseIds.get(courseIdFromContext(raw.context_code)) ?? null };
    await db.calendarItem.upsert({
      where: { userId_source_canvasId: { userId, source: "lecture", canvasId: raw.id } },
      update: data,
      create: { ...data, userId, canvasId: raw.id },
    });
  }
  await db.calendarItem.deleteMany({
    where: { userId, source: "lecture", startAt: { gte: new Date(from), lte: new Date(to) }, canvasId: { notIn: events.map((e) => e.id) } },
  });
  return events.length;
}

async function syncGroups(api: Api, userId: string, courseIds: Map<number, string>) {
  const groups = await api.groups();
  for (const raw of groups) {
    const data = { name: raw.name, courseId: raw.course_id ? (courseIds.get(raw.course_id) ?? null) : null };
    const group = await db.group.upsert({
      where: { userId_canvasId: { userId, canvasId: raw.id } },
      update: data,
      create: { ...data, userId, canvasId: raw.id },
    });
    const members = await orEmpty(api.groupUsers(raw.id));
    for (const member of members) {
      await db.groupMember.upsert({
        where: { groupId_canvasUserId: { groupId: group.id, canvasUserId: member.id } },
        update: { name: member.name },
        create: { groupId: group.id, canvasUserId: member.id, name: member.name },
      });
    }
    await db.groupMember.deleteMany({ where: { groupId: group.id, canvasUserId: { notIn: members.map((m) => m.id) } } });
  }
  await db.group.deleteMany({ where: { userId, canvasId: { notIn: groups.map((g) => g.id) } } });
  return groups.length;
}

export async function syncCanvas(connectionId: string) {
  const connection = await db.connection.findUniqueOrThrow({ where: { id: connectionId } });
  const api = canvas(connection.baseUrl, decrypt(connection.token));
  const counts = { courses: 0, assignments: 0, materials: 0, lectures: 0, groups: 0 };
  try {
    const rawCourses = await api.courses();
    const courseIds = new Map<number, string>();
    for (const raw of rawCourses) {
      const course = await upsertCourse(connection.userId, raw);
      courseIds.set(raw.id, course.id);
      const content = await syncCourseContent(api, course.id, raw.id);
      counts.courses += 1;
      counts.assignments += content.assignments;
      counts.materials += content.materials;
    }
    counts.materials += await syncAnnouncements(api, courseIds);
    counts.lectures = await syncLectures(api, connection.userId, courseIds);
    counts.groups = await syncGroups(api, connection.userId, courseIds);

    await db.connection.update({ where: { id: connectionId }, data: { lastSyncAt: new Date(), status: "connected" } });
    return counts;
  } catch (error) {
    await db.connection.update({ where: { id: connectionId }, data: { status: "error" } });
    throw error;
  }
}
