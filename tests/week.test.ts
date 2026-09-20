import { expect, test } from "vitest";
import { addDays, parseWeekParam, startOfWeek } from "../lib/week";

test("the week starts on Monday", () => {
  // Sunday 20 September 2026 belongs to the week that began Monday the 14th.
  expect(startOfWeek(new Date(2026, 8, 20, 17, 30))).toEqual(new Date(2026, 8, 14));
  expect(startOfWeek(new Date(2026, 8, 14, 0, 1))).toEqual(new Date(2026, 8, 14));
  expect(startOfWeek(new Date(2026, 8, 21, 9, 0))).toEqual(new Date(2026, 8, 21));
});

// Reading the parameter as UTC put an evening viewer in the previous week.
test("a week parameter is read as a local calendar day", () => {
  const fallback = new Date(2026, 8, 20, 20, 0);
  expect(parseWeekParam("2026-09-21", fallback)).toEqual(new Date(2026, 8, 21));
  expect(startOfWeek(parseWeekParam("2026-09-21", fallback))).toEqual(new Date(2026, 8, 21));
});

test("a missing or malformed week parameter falls back to the given date", () => {
  const fallback = new Date(2026, 8, 20);
  expect(parseWeekParam(undefined, fallback)).toBe(fallback);
  expect(parseWeekParam("not-a-date", fallback)).toBe(fallback);
  expect(parseWeekParam(["2026-09-21"], fallback)).toBe(fallback);
});

test("adding days crosses a month boundary without changing the time of day", () => {
  expect(addDays(new Date(2026, 8, 28, 14, 30), 7)).toEqual(new Date(2026, 9, 5, 14, 30));
});
