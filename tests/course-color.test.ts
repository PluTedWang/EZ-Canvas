import { expect, test } from "vitest";
import { courseSoft, courseSolid } from "../components/course-color";
import { courseColorCount, nextCourseColor } from "../lib/course-color";

test("courses take the colors in order and wrap around", () => {
  expect([0, 1, 2, 3, 4, 5].map(nextCourseColor)).toEqual([1, 2, 3, 4, 1, 2]);
});

test("every color the sync hands out has its own class", () => {
  const colors = Array.from({ length: courseColorCount }, (_, i) => i + 1);
  expect(new Set(colors.map(courseSolid)).size).toBe(courseColorCount);
  expect(new Set(colors.map(courseSoft)).size).toBe(courseColorCount);
  expect(courseSolid(courseColorCount + 1)).toBe(courseSolid(1));
});
