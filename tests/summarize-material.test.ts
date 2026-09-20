import { expect, test } from "vitest";
import { AiError } from "../lib/ai/types";
import { parseNotes, summarizeMaterial, summarizePrompt } from "../lib/ai/prompts/summarize-material";

const reply = JSON.stringify({
  points: [
    { text: "A stakeholder is anyone affected by the system.", quiz: false, evidence: null },
    { text: "Traceability links each requirement to a test.", quiz: true, evidence: "This will be on the midterm." },
  ],
  terms: [{ term: "traceability", translation: "可追溯性", definition: "Following a requirement through to its test." }],
});

test("a well formed reply becomes points and terms", () => {
  expect(parseNotes(reply)).toEqual({
    points: [
      { text: "A stakeholder is anyone affected by the system.", quiz: false, evidence: null },
      { text: "Traceability links each requirement to a test.", quiz: true, evidence: "This will be on the midterm." },
    ],
    terms: [{ term: "traceability", translation: "可追溯性", definition: "Following a requirement through to its test." }],
  });
});

test("a quiz flag without evidence still reads as a quiz point", () => {
  const notes = parseNotes('{"points":[{"text":"Chapter 5 is examinable.","quiz":true}],"terms":[]}');
  expect(notes.points).toEqual([{ text: "Chapter 5 is examinable.", quiz: true, evidence: null }]);
});

test("a quiz value that is not true is not treated as a flag", () => {
  const notes = parseNotes('{"points":[{"text":"A point.","quiz":"yes"}],"terms":[]}');
  expect(notes.points[0].quiz).toBe(false);
});

test("entries with no text or no term are dropped rather than rendered blank", () => {
  const notes = parseNotes('{"points":[{"text":""},{"text":"Kept."},null],"terms":[{"translation":"x"},{"term":"MBSE"}]}');
  expect(notes.points).toEqual([{ text: "Kept.", quiz: false, evidence: null }]);
  expect(notes.terms).toEqual([{ term: "MBSE", translation: "", definition: "" }]);
});

test("the lists are capped so one long reply cannot flood the notes panel", () => {
  const many = { points: Array.from({ length: 20 }, (_, i) => ({ text: `Point ${i}` })), terms: Array.from({ length: 20 }, (_, i) => ({ term: `T${i}` })) };
  const notes = parseNotes(JSON.stringify(many));
  expect(notes.points).toHaveLength(7);
  expect(notes.terms).toHaveLength(9);
});

test("missing lists give empty notes rather than throwing", () => {
  expect(parseNotes("{}")).toEqual({ points: [], terms: [] });
});

test("a reply that is not JSON is rejected", () => {
  expect(() => parseNotes("I could not read that file.")).toThrow(AiError);
});

test("the prompt names the explanation language and keeps terms in English", () => {
  const prompt = summarizePrompt("Simplified Chinese");
  expect(prompt).toContain("Simplified Chinese");
  expect(prompt).toContain("Keep academic and course terms in English");
});

test("the source text is truncated and the file is named for the model", async () => {
  const seen: { system: string; content: string; json?: boolean }[] = [];
  const provider = {
    complete: async (input: { system: string; messages: { content: string }[]; json?: boolean }) => {
      seen.push({ system: input.system, content: input.messages[0].content, json: input.json });
      return reply;
    },
  };
  await summarizeMaterial(provider, {
    title: "Lecture 7.pdf",
    courseCode: "SYSEN 5100",
    text: "x".repeat(80000),
    explanationLanguage: "English",
  });
  expect(seen[0].json).toBe(true);
  expect(seen[0].content).toContain("SYSEN 5100");
  expect(seen[0].content).toContain("Lecture 7.pdf");
  expect(seen[0].content.length).toBeLessThan(61000);
});
