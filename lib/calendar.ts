import { db } from "./db";
import { addDays, daysPerWeek } from "./week";
import { hoursLeft, predictHours } from "./predict";
import { planStudyBlocks, type PlannedAssignment } from "./study-blocks";

const hourMs = 60 * 60 * 1000;

const endOfWeek = (weekStart: Date) => new Date(addDays(weekStart, daysPerWeek).getTime() - 1);

export async function loadWeek(userId: string, weekStart: Date) {
  const weekEnd = endOfWeek(weekStart);
  const [courses, items, assignments] = await Promise.all([
    db.course.findMany({
      where: { userId, hidden: false },
      orderBy: { canvasId: "asc" },
      select: { id: true, code: true, color: true, latePolicy: true },
    }),
    db.calendarItem.findMany({
      where: { userId, startAt: { gte: weekStart, lte: weekEnd } },
      orderBy: { startAt: "asc" },
      select: { id: true, courseId: true, assignmentId: true, source: true, title: true, startAt: true, endAt: true, location: true },
    }),
    db.assignment.findMany({
      where: { course: { userId, hidden: false } },
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
  return { courses, items, assignments, weekStart, weekEnd };
}

type Loaded = Awaited<ReturnType<typeof loadWeek>>;

// Hours done are the accepted study blocks that have already finished.
function hoursDone(blocks: { startAt: Date; endAt: Date | null }[], now: Date) {
  return blocks
    .filter((b) => b.endAt && b.endAt <= now)
    .reduce((total, b) => total + ((b.endAt as Date).getTime() - b.startAt.getTime()) / hourMs, 0);
}

export function openWork({ assignments }: Loaded, now: Date) {
  return assignments
    .filter((a) => a.dueAt && !a.submittedAt && a.dueAt > now)
    .map((a) => {
      const prediction = predictHours({
        submissionType: a.submissionType,
        points: a.points,
        rubricSections: Array.isArray(a.rubric) ? a.rubric.length : 0,
        descriptionLength: a.description?.length ?? 0,
      });
      const done = hoursDone(a.calendarItems, now);
      return {
        id: a.id,
        courseId: a.courseId,
        title: a.title,
        dueAt: a.dueAt as Date,
        prediction,
        done: Math.round(done * 2) / 2,
        left: hoursLeft(prediction.hours, done),
      };
    });
}

// Proposals for the week, computed fresh each time; nothing is stored until the student accepts.
export function proposeBlocks(week: Loaded, now: Date) {
  const busy = week.items
    .filter((item) => item.endAt)
    .map((item) => ({ start: item.startAt, end: item.endAt as Date }));
  const assignments: PlannedAssignment[] = openWork(week, now)
    .filter((a) => a.left > 0)
    .map((a) => ({ id: a.id, title: a.title, courseId: a.courseId, dueAt: a.dueAt, hoursLeft: a.left }));
  return planStudyBlocks({ assignments, busy, from: week.weekStart, to: week.weekEnd, now });
}
