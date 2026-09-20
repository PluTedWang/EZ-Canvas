import { expect, test } from "vitest";
import { icsFeed, type IcsEvent } from "../lib/ics";

const now = new Date(Date.UTC(2026, 8, 20, 12, 0, 0));
const event = (over: Partial<IcsEvent> = {}): IcsEvent => ({
  uid: "abc",
  title: "SYSEN 5100",
  start: new Date(Date.UTC(2026, 8, 21, 14, 10)),
  end: new Date(Date.UTC(2026, 8, 21, 15, 25)),
  allDay: false,
  ...over,
});

const lines = (ics: string) => ics.split("\r\n");

test("every line ends with CRLF and the calendar is wrapped correctly", () => {
  const ics = icsFeed("EZCanvas", [event()], now);
  expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(ics.includes("\n\n")).toBe(false);
});

test("a timed event carries UTC start and end stamps", () => {
  const out = lines(icsFeed("EZCanvas", [event()], now));
  expect(out).toContain("DTSTART:20260921T141000Z");
  expect(out).toContain("DTEND:20260921T152500Z");
  expect(out).toContain("DTSTAMP:20260920T120000Z");
});

test("an all day event uses a DATE value and no end", () => {
  const out = lines(icsFeed("EZCanvas", [event({ allDay: true, end: null, title: "HW 2 due" })], now));
  expect(out).toContain("DTSTART;VALUE=DATE:20260921");
  expect(out.some((line) => line.startsWith("DTEND"))).toBe(false);
});

test("commas, semicolons, backslashes and newlines are escaped", () => {
  const out = lines(icsFeed("EZCanvas", [event({ title: "HW 2: parts 1, 2; see notes\\refs", description: "line one\nline two" })], now));
  expect(out).toContain("SUMMARY:HW 2: parts 1\\, 2\\; see notes\\\\refs");
  expect(out).toContain("DESCRIPTION:line one\\nline two");
});

test("a long summary is folded and every continuation line starts with a space", () => {
  const out = lines(icsFeed("EZCanvas", [event({ title: "A".repeat(200) })], now));
  const folded = out.filter((line) => line.startsWith("SUMMARY:") || line.startsWith(" A"));
  expect(folded.length).toBeGreaterThan(1);
  expect(out.every((line) => Buffer.from(line, "utf8").length <= 75)).toBe(true);
  expect(folded.join("").replace(/^SUMMARY:/, "").replace(/ /g, "")).toBe("A".repeat(200));
});

// Folding by bytes must not cut a Chinese character in half.
test("multi byte characters survive folding", () => {
  const title = "系统工程作业".repeat(12);
  const out = lines(icsFeed("EZCanvas", [event({ title })], now));
  const rebuilt = out
    .filter((line) => line.startsWith("SUMMARY:") || line.startsWith(" "))
    .map((line) => line.replace(/^SUMMARY:/, "").replace(/^ /, ""))
    .join("");
  expect(rebuilt).toBe(title);
});

test("an empty calendar is still a valid feed", () => {
  expect(icsFeed("EZCanvas", [], now)).toBe(
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EZCanvas//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:EZCanvas\r\nEND:VCALENDAR\r\n",
  );
});
