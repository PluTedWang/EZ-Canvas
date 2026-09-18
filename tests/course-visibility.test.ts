import { expect, test } from "vitest";
import { visibilityUpdates } from "../lib/course-visibility";

const courses = [
  { id: "a", hidden: false },
  { id: "b", hidden: false },
  { id: "c", hidden: true },
];

test("only courses whose visibility changed are updated", () => {
  expect(visibilityUpdates(courses, ["a", "c"])).toEqual([
    { id: "b", hidden: true },
    { id: "c", hidden: false },
  ]);
});

test("saving the current state changes nothing", () => {
  expect(visibilityUpdates(courses, ["a", "b"])).toEqual([]);
});

test("unknown ids are ignored and unchecking everything hides all", () => {
  expect(visibilityUpdates(courses, ["zzz"])).toEqual([
    { id: "a", hidden: true },
    { id: "b", hidden: true },
  ]);
});
