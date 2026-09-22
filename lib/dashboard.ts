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

const countByCourse = (rows: { courseId: string; _count: { _all: number } }[]) =>
  new Map(rows.map((row) => [row.courseId, row._count._all]));

// Everything the dashboard shows, from the courses the student has not hidden. Each query asks
// only for the rows it shows, so old terms' assignments and descriptions stay in the database.
export async function loadDashboard(userId: string, now = new Date()) {
  const visible = { course: { userId, hidden: false } };
  const [courses, openRows, nextRows, totals, submitted, materials] = await Promise.all([
    db.course.findMany({
      where: { userId, hidden: false },
      orderBy: { canvasId: "asc" },
      select: { id: true, code: true, name: true, term: true, color: true },
    }),
    db.assignment.findMany({
      where: { ...visible, submittedAt: null, dueAt: { gt: shift(now, -overdueDays), lt: shift(now, dueSoonDays) } },
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
        isGroup: true,
        htmlUrl: true,
      },
    }),
    // The next open deadline of each course.
    db.assignment.findMany({
      where: { ...visible, submittedAt: null, dueAt: { gte: now } },
      orderBy: { dueAt: "asc" },
      distinct: ["courseId"],
      select: { courseId: true, title: true, dueAt: true },
    }),
    db.assignment.groupBy({ by: ["courseId"], where: visible, _count: { _all: true } }),
    db.assignment.groupBy({ by: ["courseId"], where: { ...visible, submittedAt: { not: null } }, _count: { _all: true } }),
    db.material.findMany({
      where: { ...visible, firstSeenAt: { gte: shift(now, -newMaterialDays) } },
      orderBy: [{ postedAt: "desc" }, { firstSeenAt: "desc" }],
      take: newMaterialLimit,
      select: { id: true, courseId: true, type: true, title: true, postedAt: true, firstSeenAt: true, url: true },
    }),
  ]);
  const courseById = new Map<string, CourseRef>(courses.map((c) => [c.id, { code: c.code, color: c.color }]));
  const totalBy = countByCourse(totals);
  const doneBy = countByCourse(submitted);
  const nextBy = new Map<string, { title: string; dueAt: Date | null }>(nextRows.map((row) => [row.courseId, row]));

  const open = openRows.map((a) => ({
    id: a.id,
    title: a.title,
    dueAt: a.dueAt as Date,
    points: a.points,
    submissionType: a.submissionType,
    isGroup: a.isGroup,
    htmlUrl: a.htmlUrl,
    courseCode: courseById.get(a.courseId)?.code ?? "",
    color: courseById.get(a.courseId)?.color ?? 1,
    prediction: predictAssignment(a),
  }));

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
      const next = nextBy.get(course.id);
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        color: course.color,
        done: doneBy.get(course.id) ?? 0,
        total: totalBy.get(course.id) ?? 0,
        next: next ? { title: next.title, dueAt: next.dueAt as Date } : null,
      };
    }),
  };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
