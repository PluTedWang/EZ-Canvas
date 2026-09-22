import type { CanvasClient } from "./client";
import type {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasFile,
  CanvasGroup,
  CanvasGroupUser,
  CanvasModule,
  CanvasPage,
  CanvasProfile,
} from "./types";

const contextCodes = (courseIds: number[]) => courseIds.map((id) => `course_${id}`);

export function canvasApi(client: CanvasClient) {
  return {
    profile: () => client.get<CanvasProfile>("/users/self/profile"),
    courses: () =>
      client.getAll<CanvasCourse>("/courses", {
        enrollment_state: "active",
        include: ["term", "teachers", "syllabus_body"],
      }),
    assignments: (courseId: number) =>
      client.getAll<CanvasAssignment>(`/courses/${courseId}/assignments`, {
        include: ["submission", "rubric"],
        order_by: "due_at",
      }),
    modules: (courseId: number) =>
      client.getAll<CanvasModule>(`/courses/${courseId}/modules`, {
        include: ["items", "content_details"],
      }),
    files: (courseId: number) => client.getAll<CanvasFile>(`/courses/${courseId}/files`),
    // Canvas leaves the page body out of the list unless asked; the notes need it.
    pages: (courseId: number) => client.getAll<CanvasPage>(`/courses/${courseId}/pages`, { include: ["body"] }),
    announcements: (courseIds: number[], startDate: string) =>
      client.getAll<CanvasAnnouncement>("/announcements", {
        context_codes: contextCodes(courseIds),
        start_date: startDate,
      }),
    calendarEvents: (courseIds: number[], type: "event" | "assignment", startDate: string, endDate: string) =>
      client.getAll<CanvasCalendarEvent>("/calendar_events", {
        context_codes: contextCodes(courseIds),
        type,
        start_date: startDate,
        end_date: endDate,
      }),
    download: (url: string) => client.getBytes(url),
    groups: () => client.getAll<CanvasGroup>("/users/self/groups"),
    groupUsers: (groupId: number) => client.getAll<CanvasGroupUser>(`/groups/${groupId}/users`),
  };
}
