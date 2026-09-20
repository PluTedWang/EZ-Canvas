import { expect, test } from "vitest";
import { planStudyBlocks, type PlannedAssignment } from "../lib/study-blocks";

// Monday 14 September 2026 through Sunday 20 September, planning from Monday 9 AM.
const monday = new Date(2026, 8, 14, 9, 0);
const sunday = new Date(2026, 8, 20, 23, 59);
const saturday = new Date(2026, 8, 19);

const assignment = (over: Partial<PlannedAssignment> = {}): PlannedAssignment => ({
  id: "a1",
  title: "HW 2",
  courseId: "c1",
  dueAt: new Date(2026, 8, 18, 23, 59),
  hoursLeft: 4,
  ...over,
});

const plan = (assignments: PlannedAssignment[], busy: { start: Date; end: Date }[] = []) =>
  planStudyBlocks({ assignments, busy, from: monday, to: sunday, now: monday });

test("hours left are split into blocks of at most two hours", () => {
  const blocks = plan([assignment({ hoursLeft: 5 })]);
  const hours = blocks.map((b) => (b.end.getTime() - b.start.getTime()) / 3600_000);
  expect(hours).toEqual([2, 2, 1]);
  expect(hours.reduce((a, b) => a + b)).toBe(5);
});

test("blocks never overlap a lecture", () => {
  const lecture = { start: new Date(2026, 8, 14, 10, 10), end: new Date(2026, 8, 14, 11, 25) };
  const blocks = plan([assignment({ hoursLeft: 4 })], [lecture]);
  expect(blocks.some((b) => b.start < lecture.end && lecture.start < b.end)).toBe(false);
});

test("nothing is scheduled after the deadline", () => {
  const dueAt = new Date(2026, 8, 15, 12, 0);
  const blocks = plan([assignment({ hoursLeft: 10, dueAt })]);
  expect(blocks.length).toBeGreaterThan(0);
  expect(blocks.every((b) => b.end <= dueAt)).toBe(true);
});

test("Saturday evening stays free", () => {
  const blocks = plan([assignment({ hoursLeft: 40, dueAt: sunday })]);
  const saturdayBlocks = blocks.filter((b) => b.start.getDate() === saturday.getDate());
  expect(saturdayBlocks.length).toBeGreaterThan(0);
  expect(saturdayBlocks.every((b) => b.end.getHours() <= 17)).toBe(true);
});

test("blocks stay inside the 9 AM to 7 PM window", () => {
  const blocks = plan([assignment({ hoursLeft: 40, dueAt: sunday })]);
  expect(blocks.every((b) => b.start.getHours() >= 9 && b.end.getHours() <= 19)).toBe(true);
});

test("the earlier deadline gets the earlier time", () => {
  const blocks = plan([
    assignment({ id: "late", title: "PS 3", hoursLeft: 2, dueAt: new Date(2026, 8, 18, 23, 59) }),
    assignment({ id: "soon", title: "HW 2", hoursLeft: 2, dueAt: new Date(2026, 8, 15, 23, 59) }),
  ]);
  expect(blocks[0].assignmentId).toBe("soon");
});

test("two assignments never land on the same slot", () => {
  const blocks = plan([
    assignment({ id: "a", hoursLeft: 6, dueAt: sunday }),
    assignment({ id: "b", hoursLeft: 6, dueAt: sunday }),
  ]);
  const clash = blocks.some((one, i) => blocks.some((two, j) => i !== j && one.start < two.end && two.start < one.end));
  expect(clash).toBe(false);
});

test("an assignment with under an hour left gets no block", () => {
  expect(plan([assignment({ hoursLeft: 0.5 })])).toEqual([]);
});

test("planning starts at the current time, not the start of the week", () => {
  const wednesdayNoon = new Date(2026, 8, 16, 12, 0);
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 4, dueAt: sunday })],
    busy: [],
    from: monday,
    to: sunday,
    now: wednesdayNoon,
  });
  expect(blocks.every((b) => b.start >= wednesdayNoon)).toBe(true);
});

test("blocks start on the hour or the half hour, even after a lecture ends at 11:25", () => {
  const lecture = { start: new Date(2026, 8, 14, 10, 10), end: new Date(2026, 8, 14, 11, 25) };
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 6, dueAt: sunday })],
    busy: [lecture],
    from: monday,
    to: sunday,
    now: new Date(2026, 8, 14, 9, 17),
  });
  expect(blocks.every((b) => b.start.getMinutes() % 30 === 0)).toBe(true);
});
