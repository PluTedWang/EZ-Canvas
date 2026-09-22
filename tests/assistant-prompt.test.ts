import { expect, test } from "vitest";
import { assistantPrompt, draftForSituation, parseAssistantDraft, retoneDraft } from "../lib/ai/prompts/assistant";
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
    translation: null,
  });
});

test("missing fields come back empty rather than undefined", () => {
  expect(parseAssistantDraft('{"advice":"Do this."}')).toEqual({ advice: "Do this.", subject: "", body: "", translation: null });
});

test("a reply that is not JSON is rejected", () => {
  expect(() => parseAssistantDraft("Here is your email.")).toThrow(AiError);
});

test("the prompt carries the grounding rule, the style rules and the tone", () => {
  const prompt = assistantPrompt({
    situation: "Missed a deadline",
    tone: "brief",
    writingLanguage: "English",
    translationLanguage: null,
    studentName: "Ted",
  });
  expect(prompt).toContain("Never add a date, policy, name or deadline that is not there");
  expect(prompt).toContain("Exactly one clear ask");
  expect(prompt).toContain("Brief:");
  expect(prompt).not.toContain("Formal:");
});

test("each tone produces its own instruction", () => {
  const base = { situation: "s", writingLanguage: "English", translationLanguage: null, studentName: "Ted" } as const;
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
    translationLanguage: null,
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
    translationLanguage: null,
    studentName: "Ted",
  });
  expect(sent).toContain("- none available");
});

// The preview used to be a second request after the draft; now it rides in the same reply.
test("the translation preview comes back in the same single request", async () => {
  const calls: { system: string }[] = [];
  const provider = {
    complete: async (input: { system: string }) => {
      calls.push(input);
      return JSON.stringify({ advice: "Email today.", subject: "PS 2", body: "Dear Professor,", translation: "教授您好，" });
    },
  };
  const draft = await draftForSituation(provider, {
    situation: "Missed a deadline",
    question: "What now?",
    facts: [],
    tone: "formal",
    writingLanguage: "English",
    translationLanguage: "Simplified Chinese",
    studentName: "Ted",
  });
  expect(calls).toHaveLength(1);
  expect(calls[0].system).toContain("Also translate the email body into Simplified Chinese");
  expect(draft.translation).toBe("教授您好，");
});

test("without a second language nothing asks for a translation", () => {
  const prompt = assistantPrompt({ situation: "s", tone: "warm", writingLanguage: "English", translationLanguage: null, studentName: "T" });
  expect(prompt).not.toContain("translate");
  expect(prompt).not.toContain('"translation"');
});

// A tone change used to regenerate the advice too and then throw it away.
test("a tone change rewrites only the email, from the draft the student already has", async () => {
  const calls: { system: string; messages: { content: string }[] }[] = [];
  const provider = {
    complete: async (input: { system: string; messages: { content: string }[] }) => {
      calls.push(input);
      return JSON.stringify({ subject: "PS 2", body: "Hi Professor Rivera," });
    },
  };
  const email = await retoneDraft(provider, {
    tone: "warm",
    draft: { subject: "PS 2 late", body: "Dear Professor Rivera," },
    writingLanguage: "English",
    translationLanguage: null,
  });
  expect(email).toEqual({ subject: "PS 2", body: "Hi Professor Rivera,", translation: null });
  expect(calls[0].system).toContain("Warm:");
  expect(calls[0].system).toContain("Keep every fact, date, name and the single ask");
  expect(calls[0].system).not.toContain("advice");
  expect(calls[0].messages[0].content).toContain("Dear Professor Rivera,");
});
