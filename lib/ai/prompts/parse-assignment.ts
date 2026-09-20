import { asArray, asString, parseJsonObject } from "../json";
import type { AiProvider } from "../types";

// Splits one assignment into the questions the student actually has to answer.
// The rubric comes from Canvas already, so the model is never asked to invent one.

export type Question = { label: string; title: string; points: number | null; wording: string };

const maxQuestions = 20;
const maxSourceChars = 40000;
const maxTokens = 3000;

export function parseAssignmentPrompt() {
  return [
    "You split a course assignment into the questions a student must answer.",
    "",
    "Rules:",
    "- Use only the assignment text given. Never invent a question.",
    '- "label" is the number or letter the professor used, for example "1", "3b", "Part A".',
    '- "title" is a short description of the task in your own words, under ten words.',
    '- "wording" is the professor\'s own sentence for that question, copied exactly, in English.',
    '- "points" is the number of points if the assignment states one, otherwise null.',
    "- If the assignment has no numbered parts, return one question covering the whole task.",
    "",
    "Shape:",
    '{"questions":[{"label":"1","title":"Draw the context diagram","points":20,"wording":"Draw a system context diagram for the parking garage."}]}',
  ].join("\n");
}

export function parseQuestions(reply: string): Question[] {
  const data = parseJsonObject(reply);
  return asArray(data.questions)
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const label = asString(item.label);
      const title = asString(item.title);
      if (!label && !title) return null;
      const points = typeof item.points === "number" && Number.isFinite(item.points) ? item.points : null;
      return { label, title, points, wording: asString(item.wording) };
    })
    .filter((question): question is Question => question !== null)
    .slice(0, maxQuestions);
}

export async function parseAssignment(
  provider: AiProvider,
  input: { title: string; description: string; attachmentText: string },
): Promise<Question[]> {
  const source = [`Assignment: ${input.title}`, input.description, input.attachmentText]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, maxSourceChars);
  const reply = await provider.complete({
    system: parseAssignmentPrompt(),
    messages: [{ role: "user", content: source }],
    maxTokens,
    json: true,
  });
  return parseQuestions(reply);
}
