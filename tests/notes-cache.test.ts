import { expect, test } from "vitest";
import { notesAreCurrent, sourceHash } from "../lib/materials/notes";

const notes = { points: [], terms: [] };

test("the same text always hashes the same, different text does not", () => {
  expect(sourceHash("lecture text")).toBe(sourceHash("lecture text"));
  expect(sourceHash("lecture text")).not.toBe(sourceHash("lecture text v2"));
  expect(sourceHash("x")).toHaveLength(32);
});

test("notes are reused when the text and the language both match", () => {
  const hash = sourceHash("same");
  expect(notesAreCurrent({ notes, notesHash: hash, notesLanguage: "en" }, hash, "en")).toBe(true);
});

test("a changed file is resummarized", () => {
  expect(notesAreCurrent({ notes, notesHash: sourceHash("old"), notesLanguage: "en" }, sourceHash("new"), "en")).toBe(false);
});

test("switching explanation language resummarizes even for the same file", () => {
  const hash = sourceHash("same");
  expect(notesAreCurrent({ notes, notesHash: hash, notesLanguage: "en" }, hash, "zh-Hans")).toBe(false);
});

test("a material that has never been summarized is not treated as current", () => {
  const hash = sourceHash("same");
  expect(notesAreCurrent({ notes: null, notesHash: hash, notesLanguage: "en" }, hash, "en")).toBe(false);
});
