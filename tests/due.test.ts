import { expect, test } from "vitest";
import { dueChip } from "../lib/due";

const now = new Date(2026, 8, 17, 14, 0); // Thursday 17 September 2026, 2 PM local

test("a deadline later today reads as today and warns", () => {
  expect(dueChip(new Date(2026, 8, 17, 23, 59), now)).toEqual({ tone: "warn", label: "today" });
});

test("a deadline tomorrow reads as tomorrow and warns", () => {
  expect(dueChip(new Date(2026, 8, 18, 23, 59), now)).toEqual({ tone: "warn", label: "tomorrow" });
});

test("a deadline two days out reads as a plain date", () => {
  expect(dueChip(new Date(2026, 8, 19, 23, 59), now)).toEqual({ tone: "neutral", label: "date" });
});

// 11 PM today and 1 AM tomorrow are two hours apart but must not read the same.
test("the day word follows the calendar day, not a 24 hour window", () => {
  expect(dueChip(new Date(2026, 8, 17, 23, 0), now).label).toBe("today");
  expect(dueChip(new Date(2026, 8, 18, 1, 0), now).label).toBe("tomorrow");
});

test("a passed deadline is overdue however close it is", () => {
  expect(dueChip(new Date(2026, 8, 17, 13, 59), now)).toEqual({ tone: "danger", label: "overdue" });
  expect(dueChip(new Date(2026, 8, 10, 9, 0), now)).toEqual({ tone: "danger", label: "overdue" });
});
