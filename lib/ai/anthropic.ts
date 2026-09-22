import Anthropic from "@anthropic-ai/sdk";
import { AiError, type AiProvider, type CompleteInput, type ModelTier } from "./types";

// The student's own key pays for every request, so each task uses the smallest model that does it
// well. ANTHROPIC_MODEL and ANTHROPIC_FAST_MODEL override the defaults when models are renamed.
export const anthropicModels: Record<ModelTier, string> = {
  writing: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  fast: process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5-20251001",
};
const jsonInstruction = "Reply with one JSON object and nothing else. No prose, no code fence.";

export function anthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });

  return {
    async complete({ system, messages, maxTokens, json, tier = "writing" }: CompleteInput) {
      try {
        const response = await client.messages.create({
          model: anthropicModels[tier],
          max_tokens: maxTokens,
          system: json ? `${system}\n\n${jsonInstruction}` : system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        if (response.stop_reason === "refusal") {
          throw new AiError("request", response.stop_details?.explanation ?? "The model declined this request.");
        }
        return response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("")
          .trim();
      } catch (error) {
        throw toAiError(error);
      }
    },
  };
}

// Most specific first, so a bad key reads differently from a rate limit.
function toAiError(error: unknown) {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.AuthenticationError) return new AiError("auth", "The API key was not accepted.");
  if (error instanceof Anthropic.PermissionDeniedError) return new AiError("auth", "This API key may not use that model.");
  if (error instanceof Anthropic.RateLimitError) return new AiError("rate-limit", "The provider is rate limiting this key.");
  if (error instanceof Anthropic.APIConnectionError) return new AiError("network", "Could not reach the provider.");
  if (error instanceof Anthropic.APIError) return new AiError("request", error.message);
  return new AiError("network", error instanceof Error ? error.message : "Unknown AI error.");
}
