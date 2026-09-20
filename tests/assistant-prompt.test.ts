import { expect, test } from "vitest";
import { assistantPrompt, draftForSituation, parseAssistantDraft } from "../lib/ai/prompts/assistant";
import { AiError } from "../lib/ai/types";

const reply = JSON.stringify({
  advice: "You are still inside the 48 hour window, so email today.",
  subject: "Problem Set 2 · late submission",
  body: "Dear Professor Rivera,\n\nI missed the deadline.\n\nTed",
});

test("a well formed reply becomes advice, subject and body", () => {
  expect(parseAssistantDraft(reply)).toEqual({
    advice: "You are still inside the 48 hour window, so email today.",
    subject: "Problem Set 2 · late submission",
    body: "Dear Professor Rivera,\n\nI missed the deadline.\n\nTed",
  });
});

test("missing fields come back empty rather than undefined", () => {
  expect(parseAssistantDraft('{"advice":"Do this."}')).toEqual({ advice: "Do this.", subject: "", body: "" });
});

test("a reply that is not JSON is rejected", () => {
  expect(() => parseAssistantDraft("Here is your email.")).toThrow(AiError);
});

test("the prompt carries the grounding rule, the style rules and the tone", () => {
  const prompt = assistantPrompt({ situation: "Missed a deadline", tone: "brief", writingLanguage: "English", studentName: "Ted" });
  expect(prompt).toContain("Never add a date, policy, name or deadline that is not there");
  expect(prompt).toContain("Exactly one clear ask");
  expect(prompt).toContain("Brief:");
  expect(prompt).not.toContain("Formal:");
});

test("each tone produces its own instruction", () => {
  const base = { situation: "s", writingLanguage: "English", studentName: "Ted" } as const;
  expect(assistantPrompt({ ...base, tone: "formal" })).toContain("no contractions");
  expect(assistantPrompt({ ...base, tone: "warm" })).toContain("contractions are fine");
});

test("facts are sent with their source labels and nothing else", async () => {
  let sent = "";
  const provider = {
    complete: async (input: { messages: { content: string }[] }) => {
      sent = input.messages[0].content;
      return reply;
    },
  };
  await draftForSituation(provider, {
    situation: "Missed a deadline",
    question: "What should I do?",
    facts: [
      { label: "Canvas · PS 2", text: "Due Tue Sep 15, 11:59 PM." },
      { label: "Syllabus", text: "Late work accepted up to 3 days at 10% per day." },
    ],
    tone: "formal",
    writingLanguage: "English",
    studentName: "Ted Wang",
  });
  expect(sent).toContain("- [Canvas · PS 2] Due Tue Sep 15, 11:59 PM.");
  expect(sent).toContain("- [Syllabus] Late work accepted up to 3 days at 10% per day.");
  expect(sent).toContain("What should I do?");
});

test("with no facts the model is told so rather than left to invent them", async () => {
  let sent = "";
  const provider = {
    complete: async (input: { messages: { content: string }[] }) => {
      sent = input.messages[0].content;
      return reply;
    },
  };
  await draftForSituation(provider, {
    situation: "Something else",
    question: "Help",
    facts: [],
    tone: "warm",
    writingLanguage: "English",
    studentName: "Ted",
  });
  expect(sent).toContain("- none available");
});
