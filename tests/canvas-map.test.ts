import { expect, test } from "vitest";
import assignments from "../fixtures/canvas/assignments-101.json";
import courses from "../fixtures/canvas/courses.json";
import events from "../fixtures/canvas/calendar_events.json";
import files from "../fixtures/canvas/files-101.json";
import modules from "../fixtures/canvas/modules-101.json";
import pages from "../fixtures/canvas/pages-101.json";
import { attachmentsFrom, mapAssignment, mapCourse, mapEvent, mapFile, mapLinks, mapPage, moduleContext } from "../lib/canvas/map";
import type { CanvasAssignment, CanvasCalendarEvent, CanvasCourse, CanvasFile, CanvasModule, CanvasPage } from "../lib/canvas/types";
import { extractMaterial } from "../lib/materials/extract";

const hw2 = assignments[1] as CanvasAssignment;

test("mapCourse keeps code, name, term, instructor and syllabus", () => {
  expect(mapCourse(courses[0] as CanvasCourse)).toMatchObject({
    code: "SYSEN 5100",
    name: "Model-Based Systems Engineering",
    term: "Fall 2026",
    instructor: "Ana Rivera",
  });
  expect(mapCourse({ id: 1, name: "X", course_code: "X 1", workflow_state: "available" })).toMatchObject({
    term: null,
    instructor: null,
    syllabus: null,
  });
});

test("mapAssignment converts dates, rubric, attachments and submission state", () => {
  const mapped = mapAssignment(hw2);
  expect(mapped.dueAt?.toISOString()).toBe("2026-09-19T03:59:00.000Z");
  expect(mapped.submissionType).toBe("online_upload");
  expect(mapped.rubric).toEqual([
    { id: "r1", title: "Correctness", detail: null, points: 40 },
    { id: "r2", title: "Clarity", detail: null, points: 30 },
    { id: "r3", title: "Traceability", detail: null, points: 20 },
    { id: "r4", title: "Format", detail: null, points: 10 },
  ]);
  expect(mapped.attachments).toEqual([
    { name: "HW2_instructions.pdf", url: "https://canvas.example.edu/files/5010" },
    { name: "Use_case_template_v2.docx", url: "https://canvas.example.edu/files/5011" },
  ]);
  expect(mapped).toMatchObject({ isGroup: false, submittedAt: null, score: null, late: false });
});

test("a submitted assignment keeps its submission", () => {
  const mapped = mapAssignment(assignments[0] as CanvasAssignment);
  expect(mapped.submittedAt?.toISOString()).toBe("2026-09-04T22:10:00.000Z");
  expect(mapped.score).toBe(92);
});

test("attachmentsFrom ignores links that are not Canvas files", () => {
  expect(attachmentsFrom('<a href="https://example.org/doc">Doc</a>')).toEqual([]);
  expect(attachmentsFrom(null)).toEqual([]);
});

test("files and links pick up their module from the module items", () => {
  const context = moduleContext(modules as CanvasModule[]);
  const lecture7 = mapFile(files.find((f) => f.id === 5007) as CanvasFile, context);
  expect(lecture7).toMatchObject({ canvasId: "5007", type: "file", moduleName: "Week 4 · Stakeholders and requirements", modulePosition: 4 });
  const template = mapFile(files.find((f) => f.id === 5011) as CanvasFile, context);
  expect(template.moduleName).toBeUndefined();
  expect(mapLinks(modules as CanvasModule[]).map((l) => l.title)).toEqual([
    "Reading · INCOSE Handbook §4.2",
    "Recording · Sep 15 lecture",
  ]);
});

test("mapEvent turns a Canvas event into a lecture", () => {
  expect(mapEvent(events[0] as CanvasCalendarEvent)).toEqual({
    source: "lecture",
    title: "SYSEN 5100",
    startAt: new Date("2026-09-14T14:10:00Z"),
    endAt: new Date("2026-09-14T15:25:00Z"),
    allDay: false,
    location: "Hollister 110",
  });
});

// Canvas only sends a page body when asked with include[]=body; without it every page read as empty.
test("mapPage keeps the page body so notes can be written from it", async () => {
  const mapped = mapPage(pages[0] as CanvasPage, moduleContext(modules as CanvasModule[]));
  expect(mapped.body).toContain("Late work loses 10 percent per day");
  const extracted = await extractMaterial({ type: "page", contentType: null, body: mapped.body }, async () => new Uint8Array());
  expect("text" in extracted ? extracted.text : "").toContain("Late work loses 10 percent per day, up to three days.");
  expect(mapPage({ ...(pages[1] as CanvasPage), body: undefined }, new Map()).body).toBeNull();
});
