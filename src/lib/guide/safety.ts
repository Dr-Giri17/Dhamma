import { normalizeForSearch, stripPaliDiacritics } from "../corpus/normalize";
import type { SupportedLanguage } from "../i18n/language";
import type { GuideWarning } from "./types";

export interface SafetyResult {
  warnings: GuideWarning[];
  prefixes: string[];
}

export function guideSafety(question: string, language: SupportedLanguage): SafetyResult {
  const q = searchable(question);
  const warnings: GuideWarning[] = [];
  const prefixes: string[] = [];

  if (includesAny(q, [
    "are you the buddha", "you are buddha", "speak as the buddha", "speak like buddha",
    "ты будда", "говори как будда", "как сам будда",
    "apakah kamu buddha", "berbicara sebagai buddha",
  ])) {
    warnings.push("refused-to-impersonate-buddha");
    prefixes.push(copy[language].impersonation);
  }
  if (
    includesAny(q, ["invent", "make up", "fabricate", "придумай", "сочини", "выдумай", "buatkan", "karang"])
    && includesAny(q, ["quote", "scripture", "цитат", "писание", "сутр", "kutipan", "kitab"])
  ) {
    warnings.push("refused-to-fabricate-quote");
    prefixes.push(copy[language].fabrication);
  }
  if (includesAny(q, [
    "as a monk", "real monk", "you are a monk",
    "как монах", "как настоящий монах", "ты монах",
    "sebagai bhikkhu", "sebagai biksu", "biksu sejati",
  ])) {
    warnings.push("not-an-ordained-monk");
    prefixes.push(copy[language].monk);
  }

  return { warnings, prefixes };
}

function searchable(value: string) {
  return normalizeForSearch(stripPaliDiacritics(value)).replace(/\s+/g, " ").trim();
}

function includesAny(query: string, patterns: string[]) {
  return patterns.some((pattern) => query.includes(searchable(pattern)));
}

const copy = {
  en: {
    impersonation: "This app cannot speak as the Buddha or present generated text as his literal words.",
    fabrication: "This app will not invent a Buddha quotation or scripture.",
    monk: "This app is not an ordained monk and does not claim monastic authority.",
  },
  ru: {
    impersonation: "Приложение не может говорить от лица Будды или выдавать сгенерированный текст за его буквальные слова.",
    fabrication: "Приложение не будет придумывать цитату Будды или писание.",
    monk: "Приложение не является посвящённым монахом и не претендует на монашеский авторитет.",
  },
  id: {
    impersonation: "Aplikasi ini tidak dapat berbicara sebagai Buddha atau menyajikan teks buatan sebagai ucapan literal beliau.",
    fabrication: "Aplikasi ini tidak akan membuat kutipan Buddha atau kitab suci palsu.",
    monk: "Aplikasi ini bukan bhikkhu tertahbis dan tidak mengklaim otoritas monastik.",
  },
} as const;

