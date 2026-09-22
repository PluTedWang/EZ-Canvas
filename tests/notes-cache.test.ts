import { expect, test } from "vitest";
import { groupByModule, hasNotes } from "../lib/materials/course-page";
import { materialChanged, mergeNotes, readNotes } from "../lib/materials/notes";

const english = { points: [{ text: "A point.", quiz: false, evidence: null }], terms: [] };
const chinese = { points: [{ text: "一个要点。", quiz: false, evidence: null }], terms: [] };

test("notes come back for the language asked for", () => {
  const stored = { en: english, "zh-Hans": chinese };
  expect(readNotes(stored, "en")).toEqual(english);
  expect(readNotes(stored, "zh-Hans")).toEqual(chinese);
});

test("a language that has not been generated yet returns nothing", () => {
  expect(readNotes({ en: english }, "zh-Hans")).toBeNull();
});

test("a material with no notes yet returns nothing", () => {
  expect(readNotes(null, "en")).toBeNull();
});

test("a second language is added beside the first", () => {
  expect(mergeNotes({ en: english }, "zh-Hans", chinese)).toEqual({ en: english, "zh-Hans": chinese });
});

test("regenerating one language replaces only that language", () => {
  const fresh = { points: [{ text: "Updated.", quiz: true, evidence: "on the quiz" }], terms: [] };
  expect(mergeNotes({ en: english, "zh-Hans": chinese }, "en", fresh)).toEqual({ en: fresh, "zh-Hans": chinese });
});

// Sync compares what Canvas sends with what is stored and clears every language on a change.
test("a new upload or an edited body counts as a new version", () => {
  const posted = new Date("2026-09-01T10:00:00Z");
  const stored = { postedAt: posted, body: "<p>v1</p>" };
  expect(materialChanged(stored, { postedAt: new Date(posted), body: "<p>v1</p>" })).toBe(false);
  expect(materialChanged(stored, { postedAt: new Date("2026-09-05T10:00:00Z"), body: "<p>v1</p>" })).toBe(true);
  expect(materialChanged(stored, { postedAt: posted, body: "<p>v2</p>" })).toBe(true);
});

test("files carry no body, and links carry no date, without counting as changed", () => {
  const posted = new Date("2026-09-01T10:00:00Z");
  expect(materialChanged({ postedAt: posted, body: null }, { postedAt: posted })).toBe(false);
  expect(materialChanged({ postedAt: null, body: null }, {})).toBe(false);
});

// Pages synced before bodies were fetched were stored empty; the first body is a change.
test("a page that gains its body is read again", () => {
  const posted = new Date("2026-09-01T10:00:00Z");
  expect(materialChanged({ postedAt: posted, body: null }, { postedAt: posted, body: "<p>Policies</p>" })).toBe(true);
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
