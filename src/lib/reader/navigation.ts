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

export function missingEditionMessage(
  language: SupportedLanguage,
  edition: TextEditionLanguage
): string {
  const names = {
    en: { pli: "Pāli root", en: "English translation", ru: "Russian translation", id: "Indonesian translation" },
    ru: { pli: "Корневой текст на пали", en: "Английский перевод", ru: "Русский перевод", id: "Индонезийский перевод" },
    id: { pli: "Teks akar Pāli", en: "Terjemahan Inggris", ru: "Terjemahan Rusia", id: "Terjemahan Indonesia" },
  } as const;
  const suffix = {
    en: "is not imported in the local corpus.",
    ru: "пока не включён в локальный корпус.",
    id: "belum diimpor ke korpus lokal.",
  } as const;
  return `${names[language][edition]} ${suffix[language]}`;
}
