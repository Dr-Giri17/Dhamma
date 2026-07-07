/**
 * Localized strings for the Ask Dhamma answer layer (en / ru / id).
 *
 * Design rules:
 *   - Only UI/answer FRAMING is localized: section headings, refusal text,
 *     explanation phrasing, the source-excerpt availability note.
 *   - Retrieved source EXCERPTS are NEVER translated here. They stay in the
 *     corpus language (currently English: Müller 1881 / Sujato CC0). A short
 *     localized note tells the reader this, so we never imply the excerpt is
 *     a canonical translation into the user's language.
 *   - Confidence labels are machine-readable enum values ("high"/"medium"/
 *     "low") and stay untranslated in the API contract; this table provides
 *     optional human-facing renderings only.
 */

export type SupportedLanguage = "en" | "ru" | "id";

/** All localized strings used by the deterministic Ask answer composer. */
export interface AskStrings {
  /** Refusal when no sources are retrieved (ТЗ §6.3, fail-closed). */
  noSourceRefusal: string;
  /** Lead-in for the short answer. */
  shortAnswerLabel: string;
  /** Heading introducing the sources block. */
  sourcesHeading: string;
  /** Lead-in for the explanation block when Pāli terms were matched. */
  explanationWithTerms: (terms: string) => string;
  /** Lead-in for the explanation block when no terms were matched. */
  explanationGeneric: string;
  /** Tail of the explanation, asserting source-grounding (no fabrication). */
  explanationGrounded: string;
  /** Confidence line shown at the end of the answer. */
  confidenceLine: string;
  /**
   * Note that retrieved excerpts are shown in the available corpus language
   * (English), not translated. Required by the localize task: never imply the
   * snippet is a canonical translation into the user's language.
   */
  sourceExcerptNote: string;
}

const en: AskStrings = {
  noSourceRefusal:
    "I could not find reliable support for this in the current corpus. " +
    "I can offer a general orientation, but I will not present it as a canonical quotation.",
  shortAnswerLabel: "Short answer",
  sourcesHeading: "Sources",
  explanationWithTerms: (terms) =>
    `Explanation: the question touches on the Pāli term(s): ${terms}.`,
  explanationGeneric:
    "Explanation: this answer is built strictly from the cited passages.",
  explanationGrounded:
    "This explanation is grounded in the cited sources, not generated from memory.",
  confidenceLine: "Confidence: see the confidence field.",
  sourceExcerptNote:
    "Source excerpts are shown in the available English translation.",
};

const ru: AskStrings = {
  noSourceRefusal:
    "Я не нашёл достаточно надёжной опоры в текущем корпусе. " +
    "Могу дать общую ориентировку, но не буду выдавать её как каноническую цитату.",
  shortAnswerLabel: "Краткий ответ",
  sourcesHeading: "Опора в текстах",
  explanationWithTerms: (terms) =>
    `Объяснение: в вопросе есть термины пали — ${terms}.`,
  explanationGeneric:
    "Объяснение: ответ построен строго из приведённых цитат.",
  explanationGrounded:
    "Это объяснение опирается на приведённые источники, а не на выдумку.",
  confidenceLine: "Уверенность: см. поле confidence.",
  sourceExcerptNote:
    "Фрагменты источников показаны в доступном английском переводе.",
};

const id: AskStrings = {
  noSourceRefusal:
    "Saya tidak menemukan dukungan yang andal untuk hal ini dalam korpus saat ini. " +
    "Saya bisa memberikan orientasi umum, tetapi tidak akan menyajikannya sebagai kutipan kanonis.",
  shortAnswerLabel: "Jawaban singkat",
  sourcesHeading: "Rujukan",
  explanationWithTerms: (terms) =>
    `Penjelasan: pertanyaan menyentuh istilah Pāli: ${terms}.`,
  explanationGeneric:
    "Penjelasan: jawaban ini disusun murni dari bagian yang dikutip.",
  explanationGrounded:
    "Penjelasan ini berakar pada sumber yang dikutip, bukan dibuat-buat dari ingatan.",
  confidenceLine: "Tingkat keyakinan: lihat bidang confidence.",
  sourceExcerptNote:
    "Kutipan sumber ditampilkan dalam terjemahan bahasa Inggris yang tersedia.",
};

const TABLE: Record<SupportedLanguage, AskStrings> = { en, ru, id };

/**
 * Resolve strings for a language code. Unknown codes fall back to English
 * (conservative default — never throw, never leave the caller without text).
 */
export function stringsFor(language: string): AskStrings {
  return TABLE[language as SupportedLanguage] ?? en;
}
