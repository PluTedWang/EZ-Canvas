import { db } from "../db";

// The course screen: modules on the left, the chosen file's notes on the right.
export async function loadCourse(userId: string, courseId: string) {
  return db.course.findFirstOrThrow({
    where: { id: courseId, userId, hidden: false },
    select: {
      id: true,
      code: true,
      name: true,
      term: true,
      color: true,
      instructor: true,
      meetingTimes: true,
      assignments: { select: { id: true, submittedAt: true } },
      materials: {
        orderBy: [{ modulePosition: "asc" }, { title: "asc" }],
        select: {
          id: true,
          type: true,
          title: true,
          moduleName: true,
          modulePosition: true,
          url: true,
          contentType: true,
          notes: true,
          notesAt: true,
          unsupported: true,
          firstSeenAt: true,
        },
      },
    },
  });
}

export type CourseData = Awaited<ReturnType<typeof loadCourse>>;
export type CourseMaterial = CourseData["materials"][number];

// The newest module reads first, the way the mockup shows the current week at the top.
// Files with no module keep their own group at the end.
export function groupByModule<T extends { moduleName: string | null; modulePosition: number | null }>(materials: T[]) {
  const groups = new Map<string, { name: string; position: number | null; items: T[] }>();
  for (const material of materials) {
    const name = material.moduleName ?? "";
    const group = groups.get(name) ?? { name, position: material.modulePosition, items: [] };
    group.items.push(material);
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return b.position - a.position;
  });
}

export const hasNotes = (material: { notes: unknown }) =>
  material.notes !== null && typeof material.notes === "object" && Object.keys(material.notes as object).length > 0;
