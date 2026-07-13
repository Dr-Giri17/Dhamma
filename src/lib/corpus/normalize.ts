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
  let normalized = input.toLowerCase();
  for (const [alias, canonical] of Object.entries(CYRILLIC_DHAMMA_ALIASES)) {
    normalized = normalized.replaceAll(alias, canonical);
  }
  return stripPaliDiacritics(normalized)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common Russian spellings of Pāli terms. Russian framing words are still
 * ignored by the ASCII lexical index, while the doctrinal term remains a
 * precise, reviewable retrieval signal.
 */
const CYRILLIC_DHAMMA_ALIASES: Record<string, string> = {
  "дуккха": "dukkha",
  "аничча": "anicca",
  "анатта": "anatta",
  "танха": "tanha",
  "ниббана": "nibbana",
  "метта": "metta",
  "сати": "sati",
  "самадхи": "samadhi",
};

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

/**
 * High-frequency corpus-framing words that are too common to act as a
 * meaningful query signal on their own. These are NOT removed from the token
 * stream (they may contribute marginally), but a match that relies ONLY on
 * these words does NOT count as a real retrieval hit. This prevents filler
 * matches like "the Buddha was staying near..." from surfacing for an
 * unrelated question such as "cryptocurrency portfolio allocation".
 */
export const CORPUS_FILLER = new Set([
  // narrative framing ubiquitous across suttas
  "buddha", "buddhas", "monk", "monks", "mendicant", "mendicants",
  "bhikkhu", "bhikkhus", "bhagava", "bhagavan", "lord", "sir", "sirs",
  "venerable", "reverend", "say", "says", "said", "saying", "spoken",
  "speak", "speaks", "told", "tell", "tells", "asked", "ask", "asks",
  "replied", "reply", "answer", "answered", "one", "two", "three",
  "time", "then", "now", "near", "stay", "staying", "stayed", "place",
  "large", "several", "many", "well", "also", "thus", "so", "therefore",
  // extremely common connective/relational words in translation prose
  "thing", "things", "way", "ways", "man", "men", "person", "people",
  "world", "day", "night", "good", "bad",
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

/** True if a token is content-bearing (not a corpus-filler word). */
export function isContentToken(token: string): boolean {
  return !CORPUS_FILLER.has(token.toLowerCase());
}

/**
 * Detect the user's language at a coarse level for the answer layer.
 * ТЗ §6.1 step 1. Returns an ISO-639-1-ish code.
 *
 * - Cyrillic script  → "ru" (reliable: distinct Unicode block)
 * - Indonesian       → "id" ONLY when a strong Indonesian signal word is
 *                      present. Indonesian uses plain Latin script without
 *                      diacritics, so it cannot be distinguished from English
 *                      by script alone; we require an explicit keyword to
 *                      avoid false-positives that would mis-English-speakers.
 * - otherwise        → "en" (default, conservative)
 */
const INDONESIAN_SIGNAL_WORDS = new Set([
  // question words
  "apa", "apakah", "bagaimana", "mengapa", "kenapa", "siapa", "dimana",
  "ke mana", "dari mana", "berapa", "kapankan", "kapan",
  // very common function words distinctive of Indonesian
  "itu", "ini", "adalah", "tidak", "bukan", "dengan", "untuk", "pada",
  "tentang", "yang", "sebuah",
]);

export function detectLanguage(input: string): string {
  if (!input) return "en";
  // Cyrillic is unambiguous.
  if (/[а-яё]/i.test(input)) return "ru";
  // Indonesian: require a signal word to avoid English false-positives.
  const tokens = new Set(
    input
      .toLowerCase()
      .split(/[^a-zà-ÿ]+/i)
      .filter(Boolean)
  );
  for (const w of INDONESIAN_SIGNAL_WORDS) {
    if (tokens.has(w)) return "id";
  }
  return "en";
}
