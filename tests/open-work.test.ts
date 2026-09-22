import { expect, test } from "vitest";
import { openWork } from "../lib/calendar";

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
