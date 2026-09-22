import { db } from "./db";
import { addDays, daysPerWeek } from "./week";
import { hoursLeft, predictHours } from "./predict";
import { planStudyBlocks, type PlannedAssignment } from "./study-blocks";

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

// Calendar items of hidden courses stay out, like their assignments. Study blocks without a course stay in.
const visibleItems = (userId: string) => ({ userId, OR: [{ courseId: null }, { course: { hidden: false } }] });

const endOfWeek = (weekStart: Date, timeZone: string) => new Date(addDays(weekStart, daysPerWeek, timeZone).getTime() - 1);

// Assignments come back only when they are due this week or still open, not every term's history.
export async function loadWeek(userId: string, weekStart: Date, timeZone: string, now = new Date()) {
  const weekEnd = endOfWeek(weekStart, timeZone);
  const [courses, items, assignments] = await Promise.all([
    db.course.findMany({
      where: { userId, hidden: false },
      orderBy: { canvasId: "asc" },
      select: { id: true, code: true, color: true, latePolicy: true },
    }),
    db.calendarItem.findMany({
      where: { ...visibleItems(userId), startAt: { gte: weekStart, lte: weekEnd } },
      orderBy: { startAt: "asc" },
      select: { id: true, courseId: true, assignmentId: true, source: true, title: true, startAt: true, endAt: true, location: true },
    }),
    db.assignment.findMany({
      where: {
        course: { userId, hidden: false },
        OR: [{ dueAt: { gte: weekStart, lte: weekEnd } }, { submittedAt: null, dueAt: { gt: now } }],
      },
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        courseId: true,
        title: true,
        dueAt: true,
        points: true,
        submissionType: true,
        description: true,
        rubric: true,
        submittedAt: true,
        htmlUrl: true,
        calendarItems: { where: { source: "study", accepted: true }, select: { startAt: true, endAt: true } },
      },
    }),
  ]);
  return { courses, items, assignments, weekStart, weekEnd, timeZone };
}

type Loaded = Awaited<ReturnType<typeof loadWeek>>;

type WorkAssignment = {
  id: string;
  courseId: string;
  title: string;
  dueAt: Date | null;
  submittedAt: Date | null;
  points: number | null;
  submissionType: string;
  description: string | null;
  rubric: unknown;
  // Accepted study blocks for this assignment.
  calendarItems: { startAt: Date; endAt: Date | null }[];
};

const blockHours = (blocks: { startAt: Date; endAt: Date | null }[]) =>
  blocks.reduce((total, b) => total + (b.endAt ? (b.endAt.getTime() - b.startAt.getTime()) / hourMs : 0), 0);

// Done is the accepted study time that has already happened; booked is accepted time still ahead.
// Only the rest is unplanned, so accepting a plan never makes the planner propose the same hours again.
export function openWork({ assignments }: { assignments: WorkAssignment[] }, now: Date) {
  return assignments
    .filter((a) => a.dueAt && !a.submittedAt && a.dueAt > now)
    .map((a) => {
      const prediction = predictHours({
        submissionType: a.submissionType,
        points: a.points,
        rubricSections: Array.isArray(a.rubric) ? a.rubric.length : 0,
        descriptionLength: a.description?.length ?? 0,
      });
      const done = blockHours(a.calendarItems.filter((b) => b.endAt && b.endAt <= now));
      const booked = blockHours(a.calendarItems.filter((b) => b.endAt && b.endAt > now));
      return {
        id: a.id,
        courseId: a.courseId,
        title: a.title,
        dueAt: a.dueAt as Date,
        prediction,
        done: Math.round(done * 2) / 2,
        left: hoursLeft(prediction.hours, done),
        unplanned: hoursLeft(prediction.hours, done + booked),
      };
    });
}

// Proposals for the week, computed fresh each time; nothing is stored until the student accepts.
export function proposeBlocks(week: Loaded, now: Date) {
  const busy = week.items
    .filter((item) => item.endAt)
    .map((item) => ({ start: item.startAt, end: item.endAt as Date }));
  const assignments: PlannedAssignment[] = openWork(week, now)
    .filter((a) => a.unplanned > 0)
    .map((a) => ({ id: a.id, title: a.title, courseId: a.courseId, dueAt: a.dueAt, hoursLeft: a.unplanned }));
  return planStudyBlocks({ assignments, busy, from: week.weekStart, to: week.weekEnd, now, timeZone: week.timeZone });
}

const feedPastDays = 28;
const feedFutureDays = 120;

// Everything the .ics feed carries: lectures, accepted study blocks and assignment deadlines.
export async function feedEvents(userId: string, now = new Date()) {
  const from = new Date(now.getTime() - feedPastDays * dayMs);
  const to = new Date(now.getTime() + feedFutureDays * dayMs);
  const [items, assignments] = await Promise.all([
    db.calendarItem.findMany({
      where: { ...visibleItems(userId), startAt: { gte: from, lte: to } },
      orderBy: { startAt: "asc" },
      select: { id: true, title: true, startAt: true, endAt: true, location: true, source: true },
    }),
    db.assignment.findMany({
      where: { course: { userId, hidden: false }, dueAt: { gte: from, lte: to } },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true, dueAt: true, htmlUrl: true, course: { select: { code: true } } },
    }),
  ]);
  return [
    ...items.map((item) => ({
      uid: item.id,
      title: item.title,
      start: item.startAt,
      end: item.endAt,
      allDay: false,
      location: item.location,
      description: null,
    })),
    ...assignments.map((a) => ({
      uid: `due-${a.id}`,
      title: `${a.course.code} · ${a.title}`,
      start: a.dueAt as Date,
      end: a.dueAt as Date,
      allDay: false,
      location: null,
      description: a.htmlUrl,
    })),
  ];
}
