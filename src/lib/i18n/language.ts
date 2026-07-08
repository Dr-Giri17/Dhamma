export const SUPPORTED_LANGUAGES = ["ru", "en", "id"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "ru";

export const LANGUAGE_COOKIE = "dhamma_lang";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ru: "RU",
  en: "EN",
  id: "ID",
};

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ru: "Русский",
  en: "English",
  id: "Indonesia",
};

export const LANGUAGE_FALLBACK_ORDER: readonly SupportedLanguage[] = [
  DEFAULT_LANGUAGE,
  "en",
  "id",
];

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

export function normalizeLanguage(value: string | undefined | null): SupportedLanguage {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}
