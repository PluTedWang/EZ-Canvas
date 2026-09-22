// Maps raw Canvas shapes to the app's models. This is the only place the two meet.
import { parseSyllabus } from "./syllabus";
import type {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasFile,
  CanvasModule,
  CanvasPage,
} from "./types";

const date = (value: string | null | undefined) => (value ? new Date(value) : null);

export function mapCourse(raw: CanvasCourse) {
  return {
    code: raw.course_code,
    name: raw.name,
    term: raw.term?.name ?? null,
    instructor: raw.teachers?.map((t) => t.display_name).join(", ") || null,
    syllabus: raw.syllabus_body ?? null,
    ...parseSyllabus(raw.syllabus_body),
  };
}

// Links to Canvas files inside the description are the assignment's attachments.
export function attachmentsFrom(description: string | null) {
  const links = description?.matchAll(/<a[^>]+href="([^"]*\/files\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/g) ?? [];
  return [...links].map(([, url, name]) => ({ name: name.trim(), url }));
}

export function mapAssignment(raw: CanvasAssignment) {
  return {
    title: raw.name,
    description: raw.description,
    dueAt: date(raw.due_at),
    points: raw.points_possible,
    submissionType: raw.submission_types.join(","),
    htmlUrl: raw.html_url,
    rubric: raw.rubric?.map((c) => ({ id: c.id, title: c.description, detail: c.long_description ?? null, points: c.points })) ?? [],
    attachments: attachmentsFrom(raw.description),
    isGroup: raw.group_category_id !== null,
    submittedAt: date(raw.submission?.submitted_at),
    score: raw.submission?.score ?? null,
    late: raw.submission?.late ?? false,
    canvasUpdatedAt: new Date(raw.updated_at),
  };
}

export type ModuleContext = Map<string, { moduleName: string; modulePosition: number }>;

// Keyed by "File:5007", "Page:course-policies" or "Item:4403" so files, pages and links find their module.
export function moduleContext(modules: CanvasModule[]): ModuleContext {
  const context: ModuleContext = new Map();
  for (const mod of modules) {
    const place = { moduleName: mod.name, modulePosition: mod.position };
    for (const item of mod.items ?? []) {
      if (item.type === "File" && item.content_id) context.set(`File:${item.content_id}`, place);
      else if (item.type === "Page" && item.page_url) context.set(`Page:${item.page_url}`, place);
      else context.set(`Item:${item.id}`, place);
    }
  }
  return context;
}

export function mapFile(raw: CanvasFile, context: ModuleContext) {
  return {
    canvasId: String(raw.id),
    type: "file",
    title: raw.display_name,
    url: raw.url,
    contentType: raw["content-type"],
    size: raw.size,
    postedAt: new Date(raw.updated_at),
    ...(context.get(`File:${raw.id}`) ?? {}),
  };
}

export function mapPage(raw: CanvasPage, context: ModuleContext) {
  return {
    canvasId: raw.url,
    type: "page",
    title: raw.title,
    url: raw.html_url,
    body: raw.body ?? null,
    postedAt: new Date(raw.updated_at),
    ...(context.get(`Page:${raw.url}`) ?? {}),
  };
}

// Module items that are neither files, pages nor assignments: readings, recordings, tools.
export function mapLinks(modules: CanvasModule[]) {
  return modules.flatMap((mod) =>
    (mod.items ?? [])
      .filter((item) => item.type === "ExternalUrl" || item.type === "ExternalTool")
      .map((item) => ({
        canvasId: String(item.id),
        type: "link",
        title: item.title,
        url: item.external_url ?? item.html_url ?? "",
        moduleName: mod.name,
        modulePosition: mod.position,
      })),
  );
}

export function mapAnnouncement(raw: CanvasAnnouncement) {
  return {
    canvasId: String(raw.id),
    type: "announcement",
    title: raw.title,
    url: raw.html_url,
    body: raw.message,
    postedAt: date(raw.posted_at),
  };
}

export const courseIdFromContext = (contextCode: string) => Number(contextCode.replace("course_", ""));

export function mapEvent(raw: CanvasCalendarEvent) {
  return {
    source: "lecture",
    title: raw.title,
    startAt: new Date(raw.start_at as string),
    endAt: date(raw.end_at),
    allDay: raw.all_day,
    location: raw.location_name ?? null,
  };
}
