import type { AiProvider } from "../types";

// Used for the preview under an email draft, so the student can read what they are about to send.
// Course terms stay in English because that is the vocabulary the professor used.
const maxTokens = 2000;

export function translatePrompt(targetLanguage: string) {
  return [
    `Translate the text into ${targetLanguage}.`,
    "Keep course codes, assignment names and the sender's name in English.",
    "Keep the line breaks and the greeting and sign off in place.",
    "Reply with the translation only. No preface, no notes, no quotes around it.",
  ].join("\n");
}

export async function translate(provider: AiProvider, text: string, targetLanguage: string) {
  const reply = await provider.complete({
    system: translatePrompt(targetLanguage),
    messages: [{ role: "user", content: text }],
    maxTokens,
  });
  return reply.trim();
}
