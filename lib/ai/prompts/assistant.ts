import { asString, parseJsonObject } from "../json";
import type { AiProvider } from "../types";

// The study assistant. Every fact comes from Canvas and is passed in here; the model is
// told never to add its own. The model reads each fact's English label; the screen shows
// the source as a translated chip.
export type FactSource = "course" | "instructor" | "latePolicy" | "officeHours" | "meetingTimes" | "assignment";
export type Fact = { source: FactSource; name?: string; label: string; text: string };
export type Tone = "formal" | "warm" | "brief";
export const tones: Tone[] = ["formal", "warm", "brief"];

export type EmailDraft = { subject: string; body: string; translation: string | null };
export type AssistantDraft = EmailDraft & { advice: string };

const maxTokens = 3000;

const toneLine: Record<Tone, string> = {
  formal: "Formal: address the professor by title, no contractions, no slang.",
  warm: "Warm: polite and human, contractions are fine, still direct.",
  brief: "Brief: the shortest email that still states the facts and the ask.",
};

type Languages = { writingLanguage: string; translationLanguage: string | null };

function styleRules(tone: Tone) {
  return [
    "Writing style, applied to the email body:",
    "1. Short sentences. State what happened once. Do not stack apologies or over explain.",
    "2. Exactly one clear ask, phrased as a direct question or request.",
    '3. No filler or hedging. Never write "I hope this email finds you well", "sorry to bother you" or "just".',
    "4. Keep dates, assignment names and policy wording exactly as given.",
    `5. ${toneLine[tone]}`,
  ];
}

// The preview translation comes back in the same reply, so a draft costs one request, not two.
function translationRules({ translationLanguage }: Languages) {
  return translationLanguage
    ? [
        `Also translate the email body into ${translationLanguage} for the student to read before sending.`,
        "In the translation keep course codes, assignment names and the student's name in English, and keep the line breaks.",
      ]
    : [];
}

const translationField = ({ translationLanguage }: Languages) =>
  translationLanguage ? ',"translation":"the body translated for the student"' : "";

export function assistantPrompt(input: Languages & { situation: string; tone: Tone; studentName: string }) {
  return [
    "You help an international student handle a situation with a professor, and you draft the email.",
    "",
    `Situation: ${input.situation}`,
    `Student name: ${input.studentName}`,
    "",
    "Grounding:",
    "- Use only the facts listed in the message. Never add a date, policy, name or deadline that is not there.",
    "- If a fact the student needs is missing, say so in the advice instead of guessing.",
    "",
    ...styleRules(input.tone),
    "",
    `Write the advice and the email in ${input.writingLanguage}. Keep course codes and assignment names in English.`,
    ...translationRules(input),
    "",
    "Shape:",
    `{"advice":"two or three sentences on what to do now","subject":"...","body":"the full email including the greeting and sign off"${translationField(input)}}`,
  ].join("\n");
}

export function retonePrompt(input: Languages & { tone: Tone }) {
  return [
    "You rewrite a student's email to a professor in a different tone.",
    "Keep every fact, date, name and the single ask exactly as they are. Change only the wording.",
    "",
    ...styleRules(input.tone),
    "",
    `Write the email in ${input.writingLanguage}. Keep course codes and assignment names in English.`,
    ...translationRules(input),
    "",
    "Shape:",
    `{"subject":"...","body":"the full email including the greeting and sign off"${translationField(input)}}`,
  ].join("\n");
}

function parseEmail(data: Record<string, unknown>): EmailDraft {
  return { subject: asString(data.subject), body: asString(data.body), translation: asString(data.translation) || null };
}

export function parseAssistantDraft(reply: string): AssistantDraft {
  const data = parseJsonObject(reply);
  return { advice: asString(data.advice), ...parseEmail(data) };
}

export async function draftForSituation(
  provider: AiProvider,
  input: Languages & { situation: string; question: string; facts: Fact[]; tone: Tone; studentName: string },
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

// Changing the tone rewrites only the email; the advice already given stays as it is.
export async function retoneDraft(
  provider: AiProvider,
  input: Languages & { tone: Tone; draft: { subject: string; body: string } },
): Promise<EmailDraft> {
  const reply = await provider.complete({
    system: retonePrompt(input),
    messages: [{ role: "user", content: `Subject: ${input.draft.subject}\n\n${input.draft.body}` }],
    maxTokens,
    json: true,
  });
  return parseEmail(parseJsonObject(reply));
}
