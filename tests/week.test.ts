import { expect, test } from "vitest";
import {
  addDays,
  dayKey,
  daysBetween,
  hourOfDay,
  isTimeZone,
  parseWeekParam,
  sameDay,
  startOfWeek,
  zonedParts,
  zonedTime,
} from "../lib/week";

// Instants are written with their offset, so these tests pass whatever zone the machine runs in.
const ny = "America/New_York";
const shanghai = "Asia/Shanghai";
const at = (iso: string) => new Date(iso);

test("the week starts on Monday at local midnight", () => {
  // Sunday 20 September 2026 belongs to the week that began Monday the 14th.
  expect(startOfWeek(at("2026-09-20T17:30:00-04:00"), ny)).toEqual(at("2026-09-14T00:00:00-04:00"));
  expect(startOfWeek(at("2026-09-14T00:01:00-04:00"), ny)).toEqual(at("2026-09-14T00:00:00-04:00"));
  expect(startOfWeek(at("2026-09-21T09:00:00-04:00"), ny)).toEqual(at("2026-09-21T00:00:00-04:00"));
});

// The same instant is Sunday evening in New York and already Monday in Shanghai.
test("the week depends on the student's zone, not the server's", () => {
  const instant = at("2026-09-20T20:00:00-04:00");
  expect(startOfWeek(instant, ny)).toEqual(at("2026-09-14T00:00:00-04:00"));
  expect(startOfWeek(instant, shanghai)).toEqual(at("2026-09-21T00:00:00+08:00"));
});

// Local midnight in Shanghai is the previous afternoon in UTC; a UTC date string slipped a week.
test("the week parameter round trips east of UTC", () => {
  const monday = startOfWeek(at("2026-09-23T12:00:00+08:00"), shanghai);
  expect(dayKey(monday, shanghai)).toBe("2026-09-21");
  expect(startOfWeek(parseWeekParam(dayKey(monday, shanghai), shanghai, new Date(0)), shanghai)).toEqual(monday);
  const next = addDays(monday, 7, shanghai);
  expect(dayKey(next, shanghai)).toBe("2026-09-28");
});

test("a week parameter is read as a local calendar day", () => {
  const fallback = at("2026-09-20T20:00:00-04:00");
  expect(parseWeekParam("2026-09-21", ny, fallback)).toEqual(at("2026-09-21T00:00:00-04:00"));
});

test("a missing or malformed week parameter falls back to the given date", () => {
  const fallback = new Date(0);
  expect(parseWeekParam(undefined, ny, fallback)).toBe(fallback);
  expect(parseWeekParam("not-a-date", ny, fallback)).toBe(fallback);
  expect(parseWeekParam(["2026-09-21"], ny, fallback)).toBe(fallback);
});

test("adding days crosses a month boundary without changing the time of day", () => {
  expect(addDays(at("2026-09-28T14:30:00-04:00"), 7, ny)).toEqual(at("2026-10-05T14:30:00-04:00"));
});

// Daylight saving time ends in New York on 1 November 2026.
test("adding days keeps the local time across a daylight saving change", () => {
  expect(addDays(at("2026-10-28T14:30:00-04:00"), 7, ny)).toEqual(at("2026-11-04T14:30:00-05:00"));
  expect(startOfWeek(at("2026-11-04T10:00:00-05:00"), ny)).toEqual(at("2026-11-02T00:00:00-05:00"));
});

test("zoned time and parts agree", () => {
  const instant = zonedTime(ny, 2026, 9, 17, 23, 59);
  expect(instant).toEqual(at("2026-09-17T23:59:00-04:00"));
  expect(zonedParts(instant, ny)).toMatchObject({ year: 2026, month: 9, day: 17, hour: 23, minute: 59, weekday: 4 });
  expect(hourOfDay(at("2026-09-17T13:30:00-04:00"), ny)).toBe(13.5);
});

test("calendar days follow the local date", () => {
  const lateEvening = at("2026-09-17T23:00:00-04:00");
  const earlyMorning = at("2026-09-18T01:00:00-04:00");
  expect(daysBetween(lateEvening, earlyMorning, ny)).toBe(1);
  expect(sameDay(lateEvening, earlyMorning, ny)).toBe(false);
  // In UTC both instants fall on 18 September.
  expect(sameDay(lateEvening, earlyMorning, "UTC")).toBe(true);
});

test("only real IANA zones are accepted", () => {
  expect(isTimeZone("Asia/Shanghai")).toBe(true);
  expect(isTimeZone("Mars/Olympus")).toBe(false);
  expect(isTimeZone("")).toBe(false);
  expect(isTimeZone(42)).toBe(false);
});
