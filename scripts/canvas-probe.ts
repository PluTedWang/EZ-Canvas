// Prints what Canvas returns for a token, or for the fixtures with CANVAS_MOCK=1.
// Usage: CANVAS_BASE_URL=https://canvas.school.edu CANVAS_TOKEN=... npm run canvas:probe
//        CANVAS_MOCK=1 npm run canvas:probe
import { canvas } from "../lib/canvas";
import { mockBaseUrl } from "../lib/canvas/mock";
import { parseSyllabus } from "../lib/canvas/syllabus";

const mock = process.env.CANVAS_MOCK === "1";
const baseUrl = process.env.CANVAS_BASE_URL || process.env.CANVAS_DEFAULT_BASE_URL || (mock ? mockBaseUrl : "");
const token = process.env.CANVAS_TOKEN ?? "";

async function main() {
  if (!mock && (!token || !baseUrl)) {
    console.error("Set CANVAS_TOKEN and CANVAS_BASE_URL (your school's Canvas address), or CANVAS_MOCK=1 to use the fixtures.");
    process.exit(1);
  }

  const api = canvas(baseUrl, token);
  const profile = await api.profile();
  console.log(`${profile.name} <${profile.primary_email ?? "no email"}> on ${baseUrl}`);

  const courses = await api.courses();
  for (const course of courses) {
    const [assignments, modules] = await Promise.all([api.assignments(course.id), api.modules(course.id)]);
    const teacher = course.teachers?.map((t) => t.display_name).join(", ") ?? "no teacher listed";
    console.log(
      `${course.course_code} · ${course.name} · ${course.term?.name ?? "no term"} · ${teacher}\n` +
        `  ${assignments.length} assignments · ${modules.length} modules · syllabus ${course.syllabus_body ? "yes" : "no"}`,
    );
    for (const [field, value] of Object.entries(parseSyllabus(course.syllabus_body))) {
      console.log(`  ${field}: ${value ?? "not found"}`);
    }
  }

  const groups = await api.groups();
  console.log(`${groups.length} groups: ${groups.map((g) => g.name).join(", ") || "none"}`);
}

main();
