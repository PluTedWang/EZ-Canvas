// Turns what a student types into a Canvas origin, and guesses the school from it.

export function normalizeBaseUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
}

export function institutionFromHost(baseUrl: string) {
  const parts = new URL(baseUrl).hostname.split(".");
  const label = parts.length > 2 && parts[0] !== "canvas" ? parts[0] : parts[parts.length - 2];
  return label.charAt(0).toUpperCase() + label.slice(1);
}
