import type { SupportedLanguage } from "../i18n/language";
import type { DhammaSegment, TranslationSegment } from "./types";

export interface SelectedTranslation {
  translation?: TranslationSegment;
  isFallback: boolean;
  requestedLanguageAvailable: boolean;
}

export function englishTranslation(segment: DhammaSegment): TranslationSegment | undefined {
  if (!segment.translationText) return undefined;
  const metadata = segment.metadata ?? {};
  return {
    language: "en",
    text: segment.translationText,
    translator: segment.translator ?? "Unknown",
    provider: segment.provider,
    license: segment.license,
    sourcePath:
      typeof metadata.translationSourcePath === "string"
        ? metadata.translationSourcePath
        : "",
    published:
      typeof metadata.translationPublished === "boolean"
        ? metadata.translationPublished
        : true,
    publicationStatus:
      typeof metadata.translationPublicationStatus === "string"
        ? metadata.translationPublicationStatus
        : "verified corpus source",
  };
}

export function selectTranslation(
  segment: DhammaSegment,
  language: SupportedLanguage
): SelectedTranslation {
  if (language === "en") {
    const translation = englishTranslation(segment);
    return {
      translation,
      isFallback: false,
      requestedLanguageAvailable: Boolean(translation),
    };
  }

  const selected = segment.translations?.[language];
  if (selected) {
    return {
      translation: selected,
      isFallback: false,
      requestedLanguageAvailable: true,
    };
  }

  return {
    translation: englishTranslation(segment),
    isFallback: true,
    requestedLanguageAvailable: false,
  };
}

export function translationLanguages(segments: DhammaSegment[]): Set<SupportedLanguage> {
  const languages = new Set<SupportedLanguage>();
  if (segments.some((segment) => Boolean(segment.translationText))) languages.add("en");
  if (segments.some((segment) => Boolean(segment.translations?.ru))) languages.add("ru");
  if (segments.some((segment) => Boolean(segment.translations?.id))) languages.add("id");
  return languages;
}
