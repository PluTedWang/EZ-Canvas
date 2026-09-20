import { asArray, asString, parseJsonObject } from "../json";
import type { AiProvider } from "../types";

// Turns one course file into notes: summary points, quiz flags, key terms with translations.
// Course terms stay in English with the translation added once (see the language rules in the spec).

export type KeyPoint = { text: string; quiz: boolean; evidence: string | null };
export type KeyTerm = { term: string; translation: string; definition: string };
export type MaterialNotes = { points: KeyPoint[]; terms: KeyTerm[] };

const maxPoints = 7;
const maxTerms = 9;
const maxSourceChars = 60000;
const maxTokens = 4000;

export function summarizePrompt(explanationLanguage: string) {
  return [
    "You write study notes for an international student from one course file.",
    "",
    "Rules:",
    `- Write the notes in ${explanationLanguage}.`,
    "- Keep academic and course terms in English. Give the translation once, in the term list only.",
    "- Quote the file. Never add facts that are not in it.",
    `- Give five to ${maxPoints} summary points, each one sentence.`,
    '- Mark a point with "quiz": true only when the file says it is examinable, and put the exact wording that says so in "evidence".',
    `- Give up to ${maxTerms} key terms that a student new to the subject would need.`,
    "",
    "Shape:",
    '{"points":[{"text":"...","quiz":false,"evidence":null}],"terms":[{"term":"English term","translation":"...","definition":"one sentence"}]}',
  ].join("\n");
}

export function parseNotes(reply: string): MaterialNotes {
  const data = parseJsonObject(reply);
  const points = asArray(data.points)
    .map((raw) => {
      const point = (raw ?? {}) as Record<string, unknown>;
      const text = asString(point.text);
      return text ? { text, quiz: point.quiz === true, evidence: asString(point.evidence) || null } : null;
    })
    .filter((point): point is KeyPoint => point !== null)
    .slice(0, maxPoints);

  const terms = asArray(data.terms)
    .map((raw) => {
      const term = (raw ?? {}) as Record<string, unknown>;
      const name = asString(term.term);
      return name ? { term: name, translation: asString(term.translation), definition: asString(term.definition) } : null;
    })
    .filter((term): term is KeyTerm => term !== null)
    .slice(0, maxTerms);

  return { points, terms };
}

export async function summarizeMaterial(
  provider: AiProvider,
  input: { title: string; courseCode: string; text: string; explanationLanguage: string },
): Promise<MaterialNotes> {
  const reply = await provider.complete({
    system: summarizePrompt(input.explanationLanguage),
    messages: [
      {
        role: "user",
        content: `Course: ${input.courseCode}\nFile: ${input.title}\n\n${input.text.slice(0, maxSourceChars)}`,
      },
    ],
    maxTokens,
    json: true,
  });
  return parseNotes(reply);
}
