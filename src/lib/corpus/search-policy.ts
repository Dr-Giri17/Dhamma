export const MAX_QUERY_CHARS = 512;
export const MAX_RESULTS = 20;
export const MAX_SHARDS_PER_QUERY = 32;
export const MAX_DECOMPRESSED_BYTES_PER_SHARD = 40 * 1024 * 1024;
export const FETCH_TIMEOUT = 8_000;

export type SearchLanguage = "pli" | "en" | "ru";
export type SearchCanonicalStatus = "canonical" | "tradition-dependent" | "post-canonical";

const DOCTRINAL_TERMS = new Set([
  "dukkha", "dukkham", "suffering", "stress", "страдание", "страдания", "страдании",
  "anicca", "impermanence", "непостоянство", "anatta", "nonself", "notself", "безличность",
  "paticcasamuppada", "paticca", "samuppada", "dependent", "origination", "зависимое", "возникновение",
  "nibbana", "nirvana", "ниббана", "нирвана", "tanha", "craving", "жажда",
  "sati", "mindfulness", "осознанность", "metta", "lovingkindness", "доброжелательность",
]);

const LANGUAGE_EXPANSIONS: Record<SearchLanguage, Record<string, string[]>> = {
  pli: {
    dukkha: ["dukkha", "dukkham"],
    dukkham: ["dukkha", "dukkham"],
    paticcasamuppada: ["paticca", "samuppada"],
  },
  en: {
    dukkha: ["suffering"],
    dukkham: ["suffering"],
    paticcasamuppada: ["dependent", "origination"],
  },
  ru: {
    dukkha: ["страдание", "страдания"],
    dukkham: ["страдание", "страдания"],
    paticcasamuppada: ["зависимое", "возникновение"],
  },
};

export function normalizeFullSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function prepareFullSearchQuery(query: string, explicitLanguage?: string): {
  supported: boolean;
  language: SearchLanguage;
  terms: string[];
} {
  const trimmed = query.trim();
  const language: SearchLanguage = explicitLanguage === "pli" || explicitLanguage === "en" || explicitLanguage === "ru"
    ? explicitLanguage
    : /\p{Script=Cyrillic}/u.test(trimmed)
      ? "ru"
      : /[āīūṃṁṅñṇṭḍḷ]/i.test(trimmed)
        ? "pli"
        : "en";
  if (!trimmed || trimmed.length > MAX_QUERY_CHARS) return { supported: false, language, terms: [] };
  const normalized = [...new Set(normalizeFullSearch(trimmed).split(/\s+/).filter((term) => term.length >= 3 && term.length <= 40))];
  const terms = [...new Set(normalized.flatMap((term) => LANGUAGE_EXPANSIONS[language][term] ?? [term]))]
    .filter((term) => DOCTRINAL_TERMS.has(term));
  return { supported: terms.length > 0 && normalized.length <= 16, language, terms };
}

export function searchDocumentAllowed(
  document: { canonicalStatus: SearchCanonicalStatus; language: SearchLanguage; collection: string },
  options: { language: SearchLanguage; collection?: string; canonicalOnly?: boolean; canonicalStatus?: SearchCanonicalStatus }
): boolean {
  if (document.language !== options.language) return false;
  if (options.collection && document.collection !== options.collection) return false;
  if (options.canonicalOnly && document.canonicalStatus !== "canonical") return false;
  if (options.canonicalStatus && document.canonicalStatus !== options.canonicalStatus) return false;
  return true;
}
