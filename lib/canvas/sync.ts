import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
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
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * day).toISOString();

// Canvas answers 401 or 403 for course tabs the instructor hid; treat those as empty.
async function orEmpty<T>(request: Promise<T[]>) {
  return request.catch((error) => {
    if (error instanceof CanvasError && (error.status === 401 || error.status === 403)) return [];
    throw error;
  });
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
  for (const data of materials) {
    await db.material.upsert({
      where: { courseId_type_canvasId: { courseId, type: data.type, canvasId: data.canvasId } },
      update: data,
      create: { ...data, courseId },
    });
  }
  return { assignments: assignments.length, materials: materials.length };
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
    const canvasCourseIds = [...courseIds.keys()];

    for (const raw of await api.announcements(canvasCourseIds, isoDaysFromNow(-30))) {
      const courseId = courseIds.get(courseIdFromContext(raw.context_code));
      if (!courseId) continue;
      const data = mapAnnouncement(raw);
      await db.material.upsert({
        where: { courseId_type_canvasId: { courseId, type: "announcement", canvasId: data.canvasId } },
        update: data,
        create: { ...data, courseId },
      });
      counts.materials += 1;
    }

    const events = await api.calendarEvents(canvasCourseIds, "event", isoDaysFromNow(-28), isoDaysFromNow(84));
    for (const raw of events) {
      if (!raw.start_at) continue;
      const data = { ...mapEvent(raw), courseId: courseIds.get(courseIdFromContext(raw.context_code)) ?? null };
      await db.calendarItem.upsert({
        where: { userId_source_canvasId: { userId: connection.userId, source: "lecture", canvasId: raw.id } },
        update: data,
        create: { ...data, userId: connection.userId, canvasId: raw.id },
      });
      counts.lectures += 1;
    }

    for (const raw of await api.groups()) {
      const data = { name: raw.name, courseId: raw.course_id ? (courseIds.get(raw.course_id) ?? null) : null };
      const group = await db.group.upsert({
        where: { userId_canvasId: { userId: connection.userId, canvasId: raw.id } },
        update: data,
        create: { ...data, userId: connection.userId, canvasId: raw.id },
      });
      for (const member of await orEmpty(api.groupUsers(raw.id))) {
        await db.groupMember.upsert({
          where: { groupId_canvasUserId: { groupId: group.id, canvasUserId: member.id } },
          update: { name: member.name },
          create: { groupId: group.id, canvasUserId: member.id, name: member.name },
        });
      }
      counts.groups += 1;
    }

    await db.connection.update({ where: { id: connectionId }, data: { lastSyncAt: new Date(), status: "connected" } });
    return counts;
  } catch (error) {
    await db.connection.update({ where: { id: connectionId }, data: { status: "error" } });
    throw error;
  }
}
