import { db } from "./db";
import { predictHours } from "./predict";

export const dueSoonDays = 8;
const overdueDays = 7;
const newMaterialDays = 7;
const dueSoonLimit = 6;
const newMaterialLimit = 5;
const dayMs = 24 * 60 * 60 * 1000;
const shift = (from: Date, days: number) => new Date(from.getTime() + days * dayMs);

type CourseRef = { code: string; color: number };

function predictAssignment(a: { submissionType: string; points: number | null; rubric: unknown; description: string | null }) {
  return predictHours({
    submissionType: a.submissionType,
    points: a.points,
    rubricSections: Array.isArray(a.rubric) ? a.rubric.length : 0,
    descriptionLength: a.description?.length ?? 0,
  });
}

// Everything the dashboard shows, from the courses the student has not hidden.
export async function loadDashboard(userId: string, now = new Date()) {
  const courses = await db.course.findMany({
    where: { userId, hidden: false },
    orderBy: { canvasId: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      term: true,
      color: true,
      assignments: {
        orderBy: { dueAt: "asc" },
        select: {
          id: true,
          title: true,
          dueAt: true,
          points: true,
          submissionType: true,
          description: true,
          rubric: true,
          isGroup: true,
          submittedAt: true,
          htmlUrl: true,
        },
      },
    },
  });
  const courseById = new Map<string, CourseRef>(courses.map((c) => [c.id, { code: c.code, color: c.color }]));

  const open = courses.flatMap((course) =>
    course.assignments
      .filter((a) => a.dueAt && !a.submittedAt && a.dueAt > shift(now, -overdueDays) && a.dueAt < shift(now, dueSoonDays))
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueAt: a.dueAt as Date,
        points: a.points,
        submissionType: a.submissionType,
        isGroup: a.isGroup,
        htmlUrl: a.htmlUrl,
        courseCode: course.code,
        color: course.color,
        prediction: predictAssignment(a),
      })),
  );
  open.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  const materials = await db.material.findMany({
    where: { course: { userId, hidden: false }, firstSeenAt: { gte: shift(now, -newMaterialDays) } },
    orderBy: [{ postedAt: "desc" }, { firstSeenAt: "desc" }],
    take: newMaterialLimit,
    select: { id: true, courseId: true, type: true, title: true, postedAt: true, firstSeenAt: true, url: true },
  });

  return {
    term: courses.find((c) => c.term)?.term ?? null,
    counts: {
      deadlines: open.length,
      hours: open.reduce((total, a) => total + a.prediction.hours, 0),
      materials: materials.length,
    },
    dueSoon: open.slice(0, dueSoonLimit),
    materials: materials.map((m) => ({ ...m, courseCode: courseById.get(m.courseId)?.code ?? "", color: courseById.get(m.courseId)?.color ?? 1 })),
    courses: courses.map((course) => {
      const done = course.assignments.filter((a) => a.submittedAt).length;
      const next = course.assignments.find((a) => a.dueAt && !a.submittedAt && a.dueAt >= now);
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        color: course.color,
        done,
        total: course.assignments.length,
        next: next ? { title: next.title, dueAt: next.dueAt as Date } : null,
      };
    }),
  };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
