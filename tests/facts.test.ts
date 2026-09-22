import { expect, test } from "vitest";
import { buildFacts } from "../lib/assistant/facts";

const date = (value: Date) => value.toISOString().slice(0, 10);

const course = {
  code: "CS 5780",
  name: "Machine Learning",
  instructor: "Ana Rivera",
  latePolicy: "Late work accepted up to 3 days at 10% per day.",
  officeHours: "Tuesdays 2 to 3 PM.",
  meetingTimes: "Mon Wed 1:25 to 2:40 PM.",
};

const assignment = {
  title: "Problem Set 2",
  dueAt: new Date("2026-09-16T03:59:00Z"),
  points: 50,
  submissionType: "external_tool",
  submittedAt: null,
  late: true,
};

test("every fact carries the source label the chip will show", () => {
  const labels = buildFacts(course, assignment, date).map((f) => f.label);
  expect(labels).toEqual([
    "Canvas · course",
    "Canvas · instructor",
    "Syllabus · late policy",
    "Syllabus · office hours",
    "Syllabus · meeting times",
    "Canvas · Problem Set 2",
  ]);
});

test("a missing syllabus policy produces no fact rather than an empty one", () => {
  const bare = { ...course, instructor: null, latePolicy: null, officeHours: null, meetingTimes: null };
  expect(buildFacts(bare, null, date)).toEqual([{ source: "course", label: "Canvas · course", text: "CS 5780 is Machine Learning." }]);
});

test("the assignment fact states the due date, points and submission state", () => {
  const text = buildFacts(course, assignment, date).at(-1)?.text ?? "";
  expect(text).toContain("Due 2026-09-16.");
  expect(text).toContain("Worth 50 points.");
  expect(text).toContain("Not submitted yet.");
  expect(text).toContain("Canvas has marked it late.");
});

test("a submitted assignment says so and drops the late note", () => {
  const submitted = { ...assignment, submittedAt: new Date("2026-09-15T20:00:00Z"), late: false };
  const text = buildFacts(course, submitted, date).at(-1)?.text ?? "";
  expect(text).toContain("Submitted on 2026-09-15.");
  expect(text).not.toContain("marked it late");
});

test("an assignment with no due date says that plainly instead of omitting it", () => {
  const undated = { ...assignment, dueAt: null };
  expect(buildFacts(course, undated, date).at(-1)?.text).toContain("No due date is set in Canvas.");
});

test("with no course there are no facts at all", () => {
  expect(buildFacts(null, null, date)).toEqual([]);
});

// The chip text comes from the messages, so it follows the interface language.
test("every fact names its source kind, and the assignment fact its title", () => {
  const facts = buildFacts(course, assignment, date);
  expect(facts.map((f) => f.source)).toEqual(["course", "instructor", "latePolicy", "officeHours", "meetingTimes", "assignment"]);
  expect(facts.at(-1)?.name).toBe("Problem Set 2");
  expect(facts[0].name).toBeUndefined();
});
