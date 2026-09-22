import { Prisma } from "@/generated/prisma/client";
import { nextCourseColor } from "../course-color";
import { decrypt } from "../crypto";
import { db } from "../db";
import { materialChanged } from "../materials/notes";
import { canvas } from "./index";
import { CanvasError } from "./client";
import { assertCanvasHost } from "./host";
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
const day = 24 * 60 * 60 * 1000;
// The windows Canvas is asked about. Older or later items are left alone.
const announcementDays = 30;
const lecturePastDays = 28;
const lectureFutureDays = 84;
// Courses fetched from Canvas at once. Each runs four list requests, and Canvas throttles bursts.
const courseConcurrency = 2;
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * day).toISOString();

// Canvas answers 401 or 403 for course tabs the instructor hid; treat those as empty. A rate
// limited 403 fails the sync instead, or pruning would delete everything the tab lists.
async function orEmpty<T>(request: Promise<T[]>) {
  return request.catch((error) => {
    if (error instanceof CanvasError && !error.rateLimited && (error.status === 401 || error.status === 403)) return [];
    throw error;
  });
}

// A new version of a file, page or announcement drops its notes and lets it be read again.
const clearedNotes = { notes: Prisma.DbNull, notesAt: null, unsupported: null };

// Every column the Canvas mappers write for a file, page, link or announcement. A concrete type
// rather than a generic, because Prisma's upsert cannot check a spread of an open generic.
type MaterialData = {
  type: string;
  canvasId: string;
  title: string;
  url: string;
  postedAt?: Date | null;
  body?: string | null;
  contentType?: string | null;
  size?: number | null;
  moduleName?: string | null;
  modulePosition?: number | null;
};

// Returns the writes instead of running them, so a whole course lands in one transaction.
async function materialWrites(courseId: string, materials: MaterialData[]) {
  const stored = await db.material.findMany({ where: { courseId }, select: { type: true, canvasId: true, postedAt: true, body: true } });
  const byKey = new Map<string, { postedAt: Date | null; body: string | null }>(stored.map((m) => [`${m.type}:${m.canvasId}`, m]));
  return materials.map((data) => {
    const before = byKey.get(`${data.type}:${data.canvasId}`);
    return db.material.upsert({
      where: { courseId_type_canvasId: { courseId, type: data.type, canvasId: data.canvasId } },
      update: before && materialChanged(before, data) ? { ...data, ...clearedNotes } : data,
      create: { ...data, courseId },
    });
  });
}

// Runs work over items with at most `limit` in flight, keeping the results in order.
export async function eachLimited<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function upsertCourse(userId: string, raw: CanvasCourse) {
  const data = mapCourse(raw);
  const where = { userId_canvasId: { userId, canvasId: raw.id } };
  const existing = await db.course.findUnique({ where, select: { id: true } });
  if (existing) return db.course.update({ where, data });
  const color = nextCourseColor(await db.course.count({ where: { userId } }));
  return db.course.create({ data: { ...data, userId, canvasId: raw.id, color } });
}

async function fetchCourseContent(api: Api, canvasCourseId: number) {
  const [assignments, modules, files, pages] = await Promise.all([
    api.assignments(canvasCourseId),
    orEmpty(api.modules(canvasCourseId)),
    orEmpty(api.files(canvasCourseId)),
    orEmpty(api.pages(canvasCourseId)),
  ]);
  const context = moduleContext(modules);
  const materials = [...files.map((f) => mapFile(f, context)), ...pages.map((p) => mapPage(p, context)), ...mapLinks(modules)];
  return { assignments, materials };
}

type CourseContent = Awaited<ReturnType<typeof fetchCourseContent>>;

async function writeCourseContent(courseId: string, { assignments, materials }: CourseContent) {
  await db.$transaction([
    ...assignments.map((raw) => {
      const data = mapAssignment(raw);
      return db.assignment.upsert({
        where: { courseId_canvasId: { courseId, canvasId: raw.id } },
        update: data,
        create: { ...data, courseId, canvasId: raw.id },
      });
    }),
    ...(await materialWrites(courseId, materials)),
    // Whatever Canvas no longer lists was deleted or unpublished there; drop it here too.
    db.assignment.deleteMany({ where: { courseId, canvasId: { notIn: assignments.map((a) => a.id) } } }),
    ...["file", "page", "link"].map((type) =>
      db.material.deleteMany({
        where: { courseId, type, canvasId: { notIn: materials.filter((m) => m.type === type).map((m) => m.canvasId) } },
      }),
    ),
  ]);
}

// Announcements are fetched for a window only, so only the window is pruned.
async function syncAnnouncements(api: Api, courseIds: Map<number, string>) {
  const since = isoDaysFromNow(-announcementDays);
  // Canvas rejects these endpoints without a course to ask about.
  if (courseIds.size === 0) return 0;
  const announcements = await api.announcements([...courseIds.keys()], since);
  for (const [canvasCourseId, courseId] of courseIds) {
    const mine = announcements.filter((raw) => courseIdFromContext(raw.context_code) === canvasCourseId).map(mapAnnouncement);
    await db.$transaction([
      ...(await materialWrites(courseId, mine)),
      db.material.deleteMany({
        where: { courseId, type: "announcement", postedAt: { gte: new Date(since) }, canvasId: { notIn: mine.map((m) => m.canvasId) } },
      }),
    ]);
  }
  return announcements.length;
}

async function syncLectures(api: Api, userId: string, courseIds: Map<number, string>) {
  const from = isoDaysFromNow(-lecturePastDays);
  const to = isoDaysFromNow(lectureFutureDays);
  const fetched = courseIds.size > 0 ? await api.calendarEvents([...courseIds.keys()], "event", from, to) : [];
  const events = fetched.filter((raw) => raw.start_at);
  await db.$transaction([
    ...events.map((raw) => {
      const data = { ...mapEvent(raw), courseId: courseIds.get(courseIdFromContext(raw.context_code)) ?? null };
      return db.calendarItem.upsert({
        where: { userId_source_canvasId: { userId, source: "lecture", canvasId: raw.id } },
        update: data,
        create: { ...data, userId, canvasId: raw.id },
      });
    }),
    db.calendarItem.deleteMany({
      where: { userId, source: "lecture", startAt: { gte: new Date(from), lte: new Date(to) }, canvasId: { notIn: events.map((e) => e.id) } },
    }),
  ]);
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
    await db.$transaction([
      ...members.map((member) =>
        db.groupMember.upsert({
          where: { groupId_canvasUserId: { groupId: group.id, canvasUserId: member.id } },
          update: { name: member.name },
          create: { groupId: group.id, canvasUserId: member.id, name: member.name },
        }),
      ),
      db.groupMember.deleteMany({ where: { groupId: group.id, canvasUserId: { notIn: members.map((m) => m.id) } } }),
    ]);
  }
  await db.group.deleteMany({ where: { userId, canvasId: { notIn: groups.map((g) => g.id) } } });
  return groups.length;
}

// A claim older than this belongs to a run that crashed, and may be taken over.
const staleSyncMs = 30 * 60 * 1000;

// Claims the connection in one conditional update, so two servers or two triggers cannot both win.
async function claimSync(connectionId: string) {
  const claimed = await db.connection.updateMany({
    where: { id: connectionId, OR: [{ syncStartedAt: null }, { syncStartedAt: { lt: new Date(Date.now() - staleSyncMs) } }] },
    data: { syncStartedAt: new Date() },
  });
  return claimed.count > 0;
}

// Returns null when another sync of this connection is already running.
export async function syncCanvas(connectionId: string) {
  if (!(await claimSync(connectionId))) return null;
  const counts = { courses: 0, assignments: 0, materials: 0, lectures: 0, groups: 0 };
  try {
    const connection = await db.connection.findUniqueOrThrow({ where: { id: connectionId } });
    await assertCanvasHost(connection.baseUrl);
    const api = canvas(connection.baseUrl, decrypt(connection.token));
    const rawCourses = await api.courses();
    const courseIds = new Map<number, string>();
    // Courses are created one at a time so each gets the next color.
    for (const raw of rawCourses) courseIds.set(raw.id, (await upsertCourse(connection.userId, raw)).id);
    // Fetching is the slow part and runs a few courses at once; SQLite then writes one course per transaction.
    const contents = await eachLimited(rawCourses, courseConcurrency, (raw) => fetchCourseContent(api, raw.id));
    for (const [index, raw] of rawCourses.entries()) {
      await writeCourseContent(courseIds.get(raw.id) as string, contents[index]);
      counts.courses += 1;
      counts.assignments += contents[index].assignments.length;
      counts.materials += contents[index].materials.length;
    }
    counts.materials += await syncAnnouncements(api, courseIds);
    counts.lectures = await syncLectures(api, connection.userId, courseIds);
    counts.groups = await syncGroups(api, connection.userId, courseIds);

    await db.connection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date(), status: "connected", syncStartedAt: null },
    });
    return counts;
  } catch (error) {
    await db.connection.update({ where: { id: connectionId }, data: { status: "error", syncStartedAt: null } });
    throw error;
  }
}
