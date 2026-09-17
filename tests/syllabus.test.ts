import { expect, test } from "vitest";
import courses from "../fixtures/canvas/courses.json";
import { htmlToText, parseSyllabus } from "../lib/canvas/syllabus";

const syllabus = (code: string) => courses.find((c) => c.course_code === code)?.syllabus_body ?? null;

test("htmlToText keeps paragraph breaks and decodes entities", () => {
  expect(htmlToText("<h2>Title</h2><p>One &amp; two.</p><p>Three<br>four</p>")).toBe("Title\nOne & two.\nThree\nfour");
});

test("SYSEN 5100: all four policies, headings ignored", () => {
  expect(parseSyllabus(syllabus("SYSEN 5100"))).toEqual({
    latePolicy:
      "Late work is accepted up to 3 days late with a 10% penalty per day. Illness extensions are considered if you email the instructor within 48 hours of the deadline.",
    aiPolicy:
      "Generative AI tools may be used to understand course material and to check your own work, but not to write submitted answers. Cite any AI use in your submission.",
    officeHours: "Office hours: Tuesdays 2:00 to 3:00 PM in Rhodes 240, or by appointment.",
    meetingTimes: "Lectures meet Mon Wed Fri 10:10 – 11:25 AM in Hollister 110.",
  });
});

test("SYSEN 5200: no AI policy, a one line late policy", () => {
  expect(parseSyllabus(syllabus("SYSEN 5200"))).toEqual({
    latePolicy: "No late homework is accepted.",
    aiPolicy: null,
    officeHours: "Office hours: Wednesday 4:00–5:00 PM, Upson 340.",
    meetingTimes: "Class meets Tuesday and Thursday 11:40 AM – 12:55 PM in Upson 222.",
  });
});

test("SYSEN 5930 and CS 5780", () => {
  expect(parseSyllabus(syllabus("SYSEN 5930"))).toEqual({
    latePolicy: "Late deliverables lose 5% per day.",
    aiPolicy: "AI tools are welcome for drafting and planning; your team is responsible for the content.",
    officeHours: "Office hours by appointment; email to arrange.",
    meetingTimes: "Studio sessions Tuesdays 2:55 – 4:10 PM, Hollister 206.",
  });
  expect(parseSyllabus(syllabus("CS 5780"))).toEqual({
    latePolicy:
      "Late submissions lose 10% per day for up to 3 days. Illness extensions are considered if you email within 48 hours.",
    aiPolicy: "You may not use AI assistants to produce problem set solutions.",
    officeHours: "Office hours Thursday 3 to 4 PM, Gates 310.",
    meetingTimes: "Lectures Mon Wed 1:25 – 2:40 PM, Bailey Hall.",
  });
});

test("an empty syllabus gives nulls", () => {
  expect(parseSyllabus(null)).toEqual({ latePolicy: null, aiPolicy: null, officeHours: null, meetingTimes: null });
  expect(parseSyllabus("<p>Welcome to the course.</p>").aiPolicy).toBeNull();
});
