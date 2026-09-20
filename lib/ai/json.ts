import { AiError } from "./types";

// Models sometimes wrap JSON in a code fence or add a sentence around it.
// Take the outermost object rather than trusting the reply to be clean.
export function parseJsonObject(reply: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(reply);
  const body = (fenced ? fenced[1] : reply).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new AiError("request", "The model did not return JSON.");
  try {
    const value = JSON.parse(body.slice(start, end + 1));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new AiError("request", "The model returned JSON that is not an object.");
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError("request", "The model returned JSON that could not be parsed.");
  }
}

export const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
