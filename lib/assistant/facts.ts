import type { Fact, FactSource } from "../ai/prompts/assistant";
import { db } from "../db";

// Every fact the assistant is allowed to state, gathered from synced Canvas data.
// The source of each one becomes the translated chip under the reply.
export function buildFacts(
  course: {
    code: string;
    name: string;
    instructor: string | null;
    latePolicy: string | null;
    officeHours: string | null;
    meetingTimes: string | null;
  } | null,
  assignment: {
    title: string;
    dueAt: Date | null;
    points: number | null;
    submissionType: string;
    submittedAt: Date | null;
    late: boolean;
  } | null,
  formatDate: (date: Date) => string,
): Fact[] {
  const facts: Fact[] = [];
  const add = (source: FactSource, label: string, text: string | null | undefined, name?: string) => {
    if (text) facts.push({ source, label, text, ...(name ? { name } : {}) });
  };
  if (course) {
    add("course", "Canvas · course", `${course.code} is ${course.name}.`);
    add("instructor", "Canvas · instructor", course.instructor ? `The instructor is ${course.instructor}.` : null);
    add("latePolicy", "Syllabus · late policy", course.latePolicy);
    add("officeHours", "Syllabus · office hours", course.officeHours);
    add("meetingTimes", "Syllabus · meeting times", course.meetingTimes);
  }
  if (assignment) {
    add(
      "assignment",
      `Canvas · ${assignment.title}`,
      [
        assignment.dueAt ? `Due ${formatDate(assignment.dueAt)}.` : "No due date is set in Canvas.",
        assignment.points !== null ? `Worth ${assignment.points} points.` : null,
        `Submitted through ${assignment.submissionType}.`,
        assignment.submittedAt ? `Submitted on ${formatDate(assignment.submittedAt)}.` : "Not submitted yet.",
        assignment.late ? "Canvas has marked it late." : null,
      ]
        .filter(Boolean)
        .join(" "),
      assignment.title,
    );
  }
  return facts;
}

const courseFields = {
  id: true,
  code: true,
  name: true,
  instructor: true,
  latePolicy: true,
  officeHours: true,
  meetingTimes: true,
} as const;

// A chosen assignment decides the course, so picking an assignment alone, or one from another
// course than the one selected, still grounds the reply in that assignment.
export async function loadContext(userId: string, courseId: string | null, assignmentId: string | null) {
  const assignment = assignmentId
    ? await db.assignment.findFirst({
        where: { id: assignmentId, course: { userId, hidden: false } },
        select: {
          id: true,
          title: true,
          dueAt: true,
          points: true,
          submissionType: true,
          submittedAt: true,
          late: true,
          course: { select: courseFields },
        },
      })
    : null;
  if (assignment) {
    const { course, ...rest } = assignment;
    return { course, assignment: rest };
  }
  const course = courseId
    ? await db.course.findFirst({ where: { id: courseId, userId, hidden: false }, select: courseFields })
    : null;
  return { course, assignment: null };
}
