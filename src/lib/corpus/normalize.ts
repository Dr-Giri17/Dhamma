/**
 * Text normalization for Pāli / English search.
 *
 * Goal (ТЗ §9 Phase D): a search for `anatta` must also match `anattā`,
 * `metta` must match `mettā`, `dukkha` must match `dukkha` regardless of
 * how the user typed the diacritic. We do this by stripping Pāli
 * diacritics to plain ASCII before comparison, while preserving the
 * original (diacritic-correct) text for display.
 */

/**
 * Map of Pāli / Sanskrit Romanized diacritics to their ASCII base letter.
 * Covers long vowels, retroflex/cerebral consonants, and palatal/velar nasals.
 * Conservative: every long-vowel macron and every dot/underdot retroflex is
 * reduced to its ASCII counterpart so normalized comparison is robust.
 */
const PALI_DIACRITIC_MAP: Record<string, string> = {
  // long vowels
  ā: "a", Ā: "A",
  ī: "i", Ī: "I",
  ū: "u", Ū: "U",
  // retroflex / cerebral consonants (dot below)
  ṭ: "t", Ṭ: "T",
  ḍ: "d", Ḍ: "D",
  ṇ: "n", Ṇ: "N",
  ḷ: "l", Ḷ: "L",
  ḹ: "l", Ḹ: "L",
  // velar nasal, palatal nasal, anusvara
  ṅ: "n", Ṅ: "N",
  ñ: "n", Ñ: "N",
  ṃ: "m", Ṃ: "M",
  ṁ: "m", Ṁ: "M",
  // visarga
  ḥ: "h", Ḥ: "H",
  // palatal / aspirates commonly romanized with h-digraph stay as-is
  ś: "s", Ś: "S",
  ṣ: "s", Ṣ: "S",
};

/** Strip Pāli diacritics to ASCII. Preserves case. `anattā` → `anatta`. */
export function stripPaliDiacritics(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    out += PALI_DIACRITIC_MAP[ch] ?? ch;
  }
  return out;
}

/**
 * Normalize a string for case- and diacritic-insensitive comparison.
 * Lowercases, strips Pāli diacritics, and collapses whitespace.
 * Does NOT remove hyphens — `dukkha-` stays distinct for exact work.
 */
export function normalizeForSearch(input: string): string {
  return stripPaliDiacritics(input)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize a string into normalized search terms.
 * Splits on whitespace and common punctuation; drops empty tokens and
 * stopwords so retrieval isn't dominated by "the", "and", "what".
 */
const STOPWORDS = new Set([
  // English
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is",
  "are", "be", "was", "were", "do", "does", "did", "what", "how", "why",
  "when", "who", "where", "which", "that", "this", "these", "those", "it",
  "as", "at", "by", "with", "from", "about", "into", "you", "your", "i",
  "me", "my", "we", "our",
  // Russian particles (light coverage; questions may be Russian — ТЗ §12)
  "и", "в", "во", "не", "на", "что", "как", "это", "этом", "ли", "же",
]);

export function tokenize(input: string): string[] {
  const raw = normalizeForSearch(input)
    // split on whitespace and any non-letter (keeps ascii letters only after normalize)
    .split(/[^a-z]+/i);
  const out: string[] = [];
  for (const tok of raw) {
    const t = tok.toLowerCase();
    if (t.length > 0 && !STOPWORDS.has(t)) {
      out.push(t);
    }
  }
  return out;
}

/**
 * Detect the user's language at a coarse level for the answer layer.
 * ТЗ §6.1 step 1. Returns an ISO-639-1-ish code. Cyrillic → "ru", Latin → "en".
 */
export function detectLanguage(input: string): string {
  if (!input) return "en";
  if (/[а-яё]/i.test(input)) return "ru";
  if (/[à-ÿ]/i.test(input) && !/[а-яё]/i.test(input)) return "id";
  return "en";
}
