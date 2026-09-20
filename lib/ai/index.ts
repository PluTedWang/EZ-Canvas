import { decrypt } from "../crypto";
import { db } from "../db";
import { anthropicProvider } from "./anthropic";
import { AiError, isProvider, type AiProvider } from "./types";

// Builds the provider from the student's own stored key. Returns null when they have not set one up.
export async function providerFor(userId: string): Promise<AiProvider | null> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { aiProvider: true, aiKey: true },
  });
  if (!user.aiKey || !isProvider(user.aiProvider)) return null;
  return anthropicProvider(decrypt(user.aiKey));
}

export async function requireProvider(userId: string) {
  const provider = await providerFor(userId);
  if (!provider) throw new AiError("auth", "No AI provider is set up yet.");
  return provider;
}
