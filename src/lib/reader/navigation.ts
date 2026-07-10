import type { SupportedLanguage } from "../i18n/language";

export type TextEditionLanguage = "pli" | SupportedLanguage;

export function normalizeTextEdition(value: string | undefined): TextEditionLanguage {
  return value === "pli" || value === "ru" || value === "id" ? value : "en";
}

export function buildEditionHref(input: {
  slug: string;
  edition: TextEditionLanguage;
  parallel?: boolean;
  segmentUid?: string;
}): string {
  const query = new URLSearchParams({ edition: input.edition });
  if (input.parallel && input.edition !== "pli") query.set("parallel", "1");
  const hash = input.segmentUid ? `#${encodeURIComponent(input.segmentUid)}` : "";
  return `/reader/${input.slug}?${query.toString()}${hash}`;
}

