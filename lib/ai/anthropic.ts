import Anthropic from "@anthropic-ai/sdk";
import { AiError, type AiProvider, type CompleteInput } from "./types";

export const anthropicModel = "claude-opus-5";
const defaultMaxTokens = 16000;
const jsonInstruction = "Reply with one JSON object and nothing else. No prose, no code fence.";

export function anthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });

  return {
    async complete({ system, messages, maxTokens, json }: CompleteInput) {
      try {
        const response = await client.messages.create({
          model: anthropicModel,
          max_tokens: maxTokens ?? defaultMaxTokens,
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
