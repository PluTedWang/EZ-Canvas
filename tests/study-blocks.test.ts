import { expect, test } from "vitest";
import { planStudyBlocks, type PlannedAssignment } from "../lib/study-blocks";
import { zonedParts } from "../lib/week";

// Times are local to New York and written with their offset, so the machine's zone never matters.
const timeZone = "America/New_York";
const ny = (day: number, hour = 0, minute = 0) =>
  new Date(`2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`);
const local = (date: Date) => zonedParts(date, timeZone);

// Monday 14 September 2026 through Sunday 20 September, planning from Monday 9 AM.
const monday = ny(14, 9);
const sunday = ny(20, 23, 59);

const assignment = (over: Partial<PlannedAssignment> = {}): PlannedAssignment => ({
  id: "a1",
  title: "HW 2",
  courseId: "c1",
  dueAt: ny(18, 23, 59),
  hoursLeft: 4,
  ...over,
});

const plan = (assignments: PlannedAssignment[], busy: { start: Date; end: Date }[] = []) =>
  planStudyBlocks({ assignments, busy, from: monday, to: sunday, now: monday, timeZone });

test("hours left are split into blocks of at most two hours", () => {
  const blocks = plan([assignment({ hoursLeft: 5 })]);
  const hours = blocks.map((b) => (b.end.getTime() - b.start.getTime()) / 3600_000);
  expect(hours).toEqual([2, 2, 1]);
  expect(hours.reduce((a, b) => a + b)).toBe(5);
});

test("blocks never overlap a lecture", () => {
  const lecture = { start: ny(14, 10, 10), end: ny(14, 11, 25) };
  const blocks = plan([assignment({ hoursLeft: 4 })], [lecture]);
  expect(blocks.some((b) => b.start < lecture.end && lecture.start < b.end)).toBe(false);
});

test("nothing is scheduled after the deadline", () => {
  const dueAt = ny(15, 12);
  const blocks = plan([assignment({ hoursLeft: 10, dueAt })]);
  expect(blocks.length).toBeGreaterThan(0);
  expect(blocks.every((b) => b.end <= dueAt)).toBe(true);
});

test("Saturday evening stays free", () => {
  const blocks = plan([assignment({ hoursLeft: 40, dueAt: sunday })]);
  const saturdayBlocks = blocks.filter((b) => local(b.start).weekday === 6);
  expect(saturdayBlocks.length).toBeGreaterThan(0);
  expect(saturdayBlocks.every((b) => local(b.end).hour <= 17)).toBe(true);
});

test("blocks stay inside the 9 AM to 7 PM window", () => {
  const blocks = plan([assignment({ hoursLeft: 40, dueAt: sunday })]);
  expect(blocks.every((b) => local(b.start).hour >= 9 && local(b.end).hour <= 19)).toBe(true);
});

test("the earlier deadline gets the earlier time", () => {
  const blocks = plan([
    assignment({ id: "late", title: "PS 3", hoursLeft: 2, dueAt: ny(18, 23, 59) }),
    assignment({ id: "soon", title: "HW 2", hoursLeft: 2, dueAt: ny(15, 23, 59) }),
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
  const wednesdayNoon = ny(16, 12);
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 4, dueAt: sunday })],
    busy: [],
    from: monday,
    to: sunday,
    now: wednesdayNoon,
    timeZone,
  });
  expect(blocks.every((b) => b.start >= wednesdayNoon)).toBe(true);
});

test("blocks start on the hour or the half hour, even after a lecture ends at 11:25", () => {
  const lecture = { start: ny(14, 10, 10), end: ny(14, 11, 25) };
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 6, dueAt: sunday })],
    busy: [lecture],
    from: monday,
    to: sunday,
    now: ny(14, 9, 17),
    timeZone,
  });
  expect(blocks.every((b) => local(b.start).minute % 30 === 0)).toBe(true);
});

// The same week planned for a student in Shanghai uses Shanghai's 9 AM, not the server's.
test("study hours follow the student's zone", () => {
  const shanghai = "Asia/Shanghai";
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 4, dueAt: sunday })],
    busy: [],
    from: monday,
    to: sunday,
    now: monday,
    timeZone: shanghai,
  });
  expect(blocks.length).toBeGreaterThan(0);
  expect(blocks.every((b) => zonedParts(b.start, shanghai).hour >= 9 && zonedParts(b.end, shanghai).hour <= 19)).toBe(true);
});

// Kathmandu runs 45 minutes off the hour; blocks still start on its local hour or half hour.
test("blocks start on the local half hour in zones with odd offsets", () => {
  const kathmandu = "Asia/Kathmandu";
  const blocks = planStudyBlocks({
    assignments: [assignment({ hoursLeft: 4, dueAt: sunday })],
    busy: [],
    from: monday,
    to: sunday,
    now: ny(14, 0, 7),
    timeZone: kathmandu,
  });
  expect(blocks.length).toBeGreaterThan(0);
  expect(blocks.every((b) => zonedParts(b.start, kathmandu).minute % 30 === 0)).toBe(true);
});
