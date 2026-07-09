import type { SupportedLanguage } from "../i18n/language";
import type { TeacherWarning } from "./types";

export const VOICE_TITLE: Record<SupportedLanguage, string> = {
  en: "Dhamma Voice",
  ru: "Голос Дхаммы",
  id: "Suara Dhamma",
};

export const VOICE_DISCLAIMER: Record<SupportedLanguage, string> = {
  en: "An explanation in the style of a calm Dhamma teaching, grounded in the texts. This is not a literal speech of the Buddha.",
  ru: "Объяснение в стиле спокойного наставления Дхаммы, основанное на текстах. Это не буквальные слова Будды.",
  id: "Penjelasan bergaya ajaran Dhamma yang tenang, berakar pada teks. Ini bukan ucapan literal Buddha.",
};

export const WARNING_LABELS: Record<SupportedLanguage, Record<TeacherWarning, string>> = {
  en: {
    "not-canonical-quote": "App explanation, not a canonical quotation.",
    "no-source-found": "No mapped source found in the current local teacher map.",
    "refused-to-impersonate-buddha": "Refused literal Buddha impersonation.",
    "refused-to-fabricate-quote": "Refused to fabricate a Buddha quote or scripture.",
    "not-an-ordained-monk": "This app is not an ordained monk.",
    "no-direct-concept-match": "No exact mapped concept was found; this is general orientation.",
    "source-limited": "Source support is limited to the checked-in corpus map.",
  },
  ru: {
    "not-canonical-quote": "Объяснение приложения, не каноническая цитата.",
    "no-source-found": "В текущей локальной карте учения не найден сопоставленный источник.",
    "refused-to-impersonate-buddha": "Отказ от буквального представления себя Буддой.",
    "refused-to-fabricate-quote": "Отказ придумывать цитату Будды или писание.",
    "not-an-ordained-monk": "Это приложение не является посвящённым монахом.",
    "no-direct-concept-match": "Точное понятие в локальной карте не найдено; это общая ориентация.",
    "source-limited": "Опора на источники ограничена проверенной локальной картой корпуса.",
  },
  id: {
    "not-canonical-quote": "Penjelasan aplikasi, bukan kutipan kanonis.",
    "no-source-found": "Tidak ada sumber yang dipetakan dalam peta ajaran lokal saat ini.",
    "refused-to-impersonate-buddha": "Menolak peniruan literal sebagai Buddha.",
    "refused-to-fabricate-quote": "Menolak membuat kutipan Buddha atau kitab suci palsu.",
    "not-an-ordained-monk": "Aplikasi ini bukan bhikkhu tertahbis.",
    "no-direct-concept-match": "Tidak ada konsep tepat yang dipetakan; ini adalah orientasi umum.",
    "source-limited": "Dukungan sumber terbatas pada peta korpus lokal yang tersedia.",
  },
};

export const MODE_LABELS = {
  en: {
    strict_source: "Strict Source",
    explain_simple: "Explain Simply",
    dhamma_voice: "Dhamma Voice",
  },
  ru: {
    strict_source: "Строго по источникам",
    explain_simple: "Простое объяснение",
    dhamma_voice: "Голос Дхаммы",
  },
  id: {
    strict_source: "Sumber Ketat",
    explain_simple: "Jelaskan Sederhana",
    dhamma_voice: "Suara Dhamma",
  },
} as const;
