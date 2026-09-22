import { expect, test } from "vitest";
import { allDayStart, openWork, visibleHours } from "../lib/calendar";

const now = new Date("2026-09-16T12:00:00-04:00");
const hours = (h: number) => h * 3600_000;
const block = (startIso: string, length: number) => {
  const startAt = new Date(startIso);
  return { startAt, endAt: new Date(startAt.getTime() + hours(length)) };
};

// A 100 point upload with no rubric predicts 2 + 100 / 50 = 4 hours.
const assignment = (calendarItems: { startAt: Date; endAt: Date | null }[]) => ({
  id: "a1",
  courseId: "c1",
  title: "HW 2",
  dueAt: new Date("2026-09-18T23:59:00-04:00"),
  submittedAt: null,
  points: 100,
  submissionType: "online_upload",
  description: null,
  rubric: null,
  calendarItems,
});

test("finished blocks count as done and reduce the hours left", () => {
  const [work] = openWork({ assignments: [assignment([block("2026-09-15T09:00:00-04:00", 1.5)])] }, now);
  expect(work.prediction.hours).toBe(4);
  expect(work.done).toBe(1.5);
  expect(work.left).toBe(2.5);
  expect(work.unplanned).toBe(2.5);
});

// Accepting a plan used to leave the hours unplanned, so the next page load proposed them again.
test("accepted blocks still ahead are booked, so nothing is proposed twice", () => {
  const booked = [block("2026-09-16T14:00:00-04:00", 2), block("2026-09-17T09:00:00-04:00", 2)];
  const [work] = openWork({ assignments: [assignment(booked)] }, now);
  expect(work.done).toBe(0);
  expect(work.left).toBe(4);
  expect(work.unplanned).toBe(0);
});

test("submitted and past due work is not open", () => {
  const submitted = { ...assignment([]), submittedAt: new Date("2026-09-15T10:00:00-04:00") };
  const pastDue = { ...assignment([]), id: "a2", dueAt: new Date("2026-09-15T23:59:00-04:00") };
  expect(openWork({ assignments: [submitted, pastDue] }, now)).toEqual([]);
});

test("the week grid shows 9 to 7 and stretches for earlier or later lectures", () => {
  const ny = "America/New_York";
  const event = (start: string, end: string) => ({ start: new Date(`${start}-04:00`), end: new Date(`${end}-04:00`) });
  expect(visibleHours([], ny)).toEqual({ first: 9, last: 19 });
  expect(visibleHours([event("2026-09-16T10:10:00", "2026-09-16T11:25:00")], ny)).toEqual({ first: 9, last: 19 });
  expect(visibleHours([event("2026-09-16T08:00:00", "2026-09-16T09:15:00")], ny)).toEqual({ first: 8, last: 19 });
  expect(visibleHours([event("2026-09-16T19:30:00", "2026-09-16T20:45:00")], ny)).toEqual({ first: 9, last: 21 });
  expect(visibleHours([event("2026-09-16T22:00:00", "2026-09-17T01:00:00")], ny)).toEqual({ first: 9, last: 24 });
});
// A London all-day event starts at 00:00 BST, which is 23:00 the day before in UTC.
test("an all-day item keeps the student's local date in the feed", () => {
  const start = new Date("2026-09-20T00:00:00+01:00");
  expect(allDayStart(start, "Europe/London").toISOString()).toBe("2026-09-20T00:00:00.000Z");
  expect(allDayStart(new Date("2026-09-20T00:00:00-04:00"), "America/New_York").toISOString()).toBe("2026-09-20T00:00:00.000Z");
});
