import { asString, parseJsonObject } from "../json";
import type { AiProvider } from "../types";

// The study assistant. Every fact comes from Canvas and is passed in here; the model is
// told never to add its own. Each fact carries the label the screen shows as a source chip.

export type Fact = { label: string; text: string };
export type Tone = "formal" | "warm" | "brief";
export const tones: Tone[] = ["formal", "warm", "brief"];

export type AssistantDraft = { advice: string; subject: string; body: string };

const maxTokens = 2000;

const toneLine: Record<Tone, string> = {
  formal: "Formal: address the professor by title, no contractions, no slang.",
  warm: "Warm: polite and human, contractions are fine, still direct.",
  brief: "Brief: the shortest email that still states the facts and the ask.",
};

export function assistantPrompt({
  situation,
  tone,
  writingLanguage,
  studentName,
}: {
  situation: string;
  tone: Tone;
  writingLanguage: string;
  studentName: string;
}) {
  return [
    "You help an international student handle a situation with a professor, and you draft the email.",
    "",
    `Situation: ${situation}`,
    `Student name: ${studentName}`,
    "",
    "Grounding:",
    "- Use only the facts listed in the message. Never add a date, policy, name or deadline that is not there.",
    "- If a fact the student needs is missing, say so in the advice instead of guessing.",
    "",
    "Writing style, applied to the email body:",
    "1. Short sentences. State what happened once. Do not stack apologies or over explain.",
    "2. Exactly one clear ask, phrased as a direct question or request.",
    '3. No filler or hedging. Never write "I hope this email finds you well", "sorry to bother you" or "just".',
    "4. Keep dates, assignment names and policy wording exactly as given.",
    `5. ${toneLine[tone]}`,
    "",
    `Write the advice and the email in ${writingLanguage}. Keep course codes and assignment names in English.`,
    "",
    "Shape:",
    '{"advice":"two or three sentences on what to do now","subject":"...","body":"the full email including the greeting and sign off"}',
  ].join("\n");
}

export function parseAssistantDraft(reply: string): AssistantDraft {
  const data = parseJsonObject(reply);
  return { advice: asString(data.advice), subject: asString(data.subject), body: asString(data.body) };
}

export async function draftForSituation(
  provider: AiProvider,
  input: {
    situation: string;
    question: string;
    facts: Fact[];
    tone: Tone;
    writingLanguage: string;
    studentName: string;
  },
): Promise<AssistantDraft> {
  const facts = input.facts.map((fact) => `- [${fact.label}] ${fact.text}`).join("\n");
  const reply = await provider.complete({
    system: assistantPrompt(input),
    messages: [{ role: "user", content: `${input.question}\n\nFacts from Canvas:\n${facts || "- none available"}` }],
    maxTokens,
    json: true,
  });
  return parseAssistantDraft(reply);
}
