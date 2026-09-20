// One server side interface for every AI provider. Adapters live beside this file.
// Keys never leave the server; see docs/INTEGRATIONS.md section 3.

export type Message = { role: "user" | "assistant"; content: string };

export type CompleteInput = {
  system: string;
  messages: Message[];
  maxTokens?: number;
  // Ask the provider for JSON only. The caller still validates the shape.
  json?: boolean;
};

export interface AiProvider {
  complete(input: CompleteInput): Promise<string>;
}

export const providers = ["anthropic"] as const;
export type ProviderName = (typeof providers)[number];

export function isProvider(value: unknown): value is ProviderName {
  return providers.includes(value as ProviderName);
}

// Thrown when a provider rejects the request; the screens turn this into one readable line.
export class AiError extends Error {
  constructor(
    readonly kind: "auth" | "rate-limit" | "request" | "network",
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}
