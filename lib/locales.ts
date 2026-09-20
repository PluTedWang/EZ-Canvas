export const locales = ["en", "zh-Hans"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

// The names the AI prompts use when asked to write in a language.
const names: Record<Locale, string> = { en: "English", "zh-Hans": "Simplified Chinese" };

export function languageName(value: string) {
  return isLocale(value) ? names[value] : "English";
}
