import { expect, test } from "vitest";
import { dueChip } from "../lib/due";

const ny = "America/New_York";
const local = (time: string) => new Date(`2026-09-${time}-04:00`);
const now = local("17T14:00:00"); // Thursday 17 September 2026, 2 PM in New York

test("a deadline later today reads as today and warns", () => {
  expect(dueChip(local("17T23:59:00"), now, ny)).toEqual({ tone: "warn", label: "today" });
});

test("a deadline tomorrow reads as tomorrow and warns", () => {
  expect(dueChip(local("18T23:59:00"), now, ny)).toEqual({ tone: "warn", label: "tomorrow" });
});

test("a deadline two days out reads as a plain date", () => {
  expect(dueChip(local("19T23:59:00"), now, ny)).toEqual({ tone: "neutral", label: "date" });
});

// 11 PM today and 1 AM tomorrow are two hours apart but must not read the same.
test("the day word follows the calendar day, not a 24 hour window", () => {
  expect(dueChip(local("17T23:00:00"), now, ny).label).toBe("today");
  expect(dueChip(local("18T01:00:00"), now, ny).label).toBe("tomorrow");
});

// An 11:59 PM deadline in New York is already the next day in UTC.
test("the day word uses the student's zone", () => {
  const evening = local("17T20:00:00");
  expect(dueChip(local("17T23:59:00"), evening, ny).label).toBe("today");
  expect(dueChip(local("17T23:59:00"), evening, "Asia/Shanghai").label).toBe("today");
  // 11 AM Friday in New York is 11 PM Friday in Shanghai, where it is already Friday morning.
  expect(dueChip(local("18T11:00:00"), evening, ny).label).toBe("tomorrow");
  expect(dueChip(local("18T11:00:00"), evening, "Asia/Shanghai").label).toBe("today");
});

test("a passed deadline is overdue however close it is", () => {
  expect(dueChip(local("17T13:59:00"), now, ny)).toEqual({ tone: "danger", label: "overdue" });
  expect(dueChip(local("10T09:00:00"), now, ny)).toEqual({ tone: "danger", label: "overdue" });
});
