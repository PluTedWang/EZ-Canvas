import { expect, test } from "vitest";
import { groupByModule, hasNotes } from "../lib/materials/course-page";
import { mergeNotes, readNotes, sourceHash } from "../lib/materials/notes";

const english = { points: [{ text: "A point.", quiz: false, evidence: null }], terms: [] };
const chinese = { points: [{ text: "一个要点。", quiz: false, evidence: null }], terms: [] };
const hash = sourceHash("lecture text");

test("the same text always hashes the same, different text does not", () => {
  expect(sourceHash("lecture text")).toBe(hash);
  expect(sourceHash("lecture text v2")).not.toBe(hash);
  expect(hash).toHaveLength(32);
});

test("notes come back for the language asked for", () => {
  const stored = { en: english, "zh-Hans": chinese };
  expect(readNotes(stored, hash, hash, "en")).toEqual(english);
  expect(readNotes(stored, hash, hash, "zh-Hans")).toEqual(chinese);
});

test("a language that has not been generated yet returns nothing", () => {
  expect(readNotes({ en: english }, hash, hash, "zh-Hans")).toBeNull();
});

test("a changed file invalidates every language", () => {
  const stored = { en: english, "zh-Hans": chinese };
  const newHash = sourceHash("lecture text v2");
  expect(readNotes(stored, hash, newHash, "en")).toBeNull();
  expect(readNotes(stored, hash, newHash, "zh-Hans")).toBeNull();
});

test("a material with no notes yet returns nothing", () => {
  expect(readNotes(null, null, hash, "en")).toBeNull();
});

test("a second language is added beside the first", () => {
  expect(mergeNotes({ en: english }, true, "zh-Hans", chinese)).toEqual({ en: english, "zh-Hans": chinese });
});

test("when the file changed, old languages are dropped rather than kept beside the new notes", () => {
  expect(mergeNotes({ en: english, "zh-Hans": chinese }, false, "en", english)).toEqual({ en: english });
});

test("regenerating one language replaces only that language", () => {
  const fresh = { points: [{ text: "Updated.", quiz: true, evidence: "on the quiz" }], terms: [] };
  expect(mergeNotes({ en: english, "zh-Hans": chinese }, true, "en", fresh)).toEqual({ en: fresh, "zh-Hans": chinese });
});

test("the newest module reads first and files with no module come last", () => {
  const item = (id: string, moduleName: string | null, modulePosition: number | null) =>
    ({ id, moduleName, modulePosition }) as never;
  const groups = groupByModule([
    item("a", "Week 1", 1),
    item("b", "Week 4", 4),
    item("c", "Week 4", 4),
    item("d", null, null),
    item("e", "Week 3", 3),
  ]);
  expect(groups.map((g) => [g.name, g.items.map((i) => (i as { id: string }).id)])).toEqual([
    ["Week 4", ["b", "c"]],
    ["Week 3", ["e"]],
    ["Week 1", ["a"]],
    ["", ["d"]],
  ]);
});

test("a material counts as summarized only when a language is stored", () => {
  expect(hasNotes({ notes: null })).toBe(false);
  expect(hasNotes({ notes: {} })).toBe(false);
  expect(hasNotes({ notes: { en: english } })).toBe(true);
});
