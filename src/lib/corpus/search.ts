/**
 * Hybrid search over the corpus (ТЗ §6.1, §9 Phase D).
 *
 * Three match signals combined into one ranked list:
 *   1. `exact`   — exact (normalized) substring hit on the query as a whole;
 *   2. `term`    — exact normalized match on a known Pāli / Dhamma term
 *                  (e.g. `anattā`, `dukkha`), which beats loose lexical hits;
 *   3. `lexical` — token-overlap (bag of words) score.
 *
 * Re-ranking (ТЗ §6.1.5):
 *   - canonical texts rank above commentarial;
 *   - exact Pāli term above loose semantic match;
 *   - Dhammapada verses are eligible but never the sole source for complex
 *     doctrine (enforced at the answer layer, not here).
 *
 * No embeddings required (ТЗ §13). This is the lexical progression.
 */

import type {
  Corpus,
  DhammaSegment,
  RetrievedSegment,
  SearchFilters,
  SourceWork,
} from "./types";
import {
  normalizeForSearch,
  stripPaliDiacritics,
  tokenize,
} from "./normalize";
import { searchableSegments } from "./seed";

/** Known Pāli / Dhamma terms — match these with elevated weight. */
export const DHAMMA_TERMS: Record<string, string> = {
  dukkha: "dukkha",
  anicca: "anicca",
  anatta: "anattā",
  tanha: "taṇhā",
  upadana: "upādāna",
  sati: "sati",
  samadhi: "samādhi",
  panna: "paññā",
  sila: "sīla",
  nibbana: "nibbāna",
  metta: "mettā",
  karuna: "karuṇā",
  upekkha: "upekkhā",
  jhana: "jhāna",
  kamma: "kamma",
  sankhara: "saṅkhāra",
  khandha: "khandha",
  ayatana: "āyatana",
  paticcasamuppada: "paṭiccasamuppāda",
};

const TERM_KEYS = new Set(Object.keys(DHAMMA_TERMS));

/** True if `term` (already normalized ASCII) is a recognized Dhamma term. */
export function isDhammaTerm(term: string): boolean {
  return TERM_KEYS.has(term);
}

export interface SearchOptions {
  filters?: SearchFilters;
  limit?: number;
}

/** Apply filter predicates to a segment given its owning work. */
function passesFilters(
  seg: DhammaSegment,
  work: SourceWork | undefined,
  filters: SearchFilters
): boolean {
  if (filters.category && work?.category !== filters.category) return false;
  if (filters.workId && seg.textId !== filters.workId) return false;
  if (filters.language && seg.language !== filters.language) return false;
  if (filters.uidPrefix) {
    const prefix = filters.uidPrefix.toLowerCase();
    if (!seg.segmentUid.toLowerCase().startsWith(prefix)) return false;
  }
  if (
    filters.includeCommentarial === false &&
    work?.category === "commentarial"
  ) {
    return false;
  }
  return true;
}

/**
 * Score a single segment against a parsed query.
 * Returns null if nothing matched.
 */
function scoreSegment(
  seg: DhammaSegment,
  normalizedQuery: string,
  terms: string[],
  work?: SourceWork
): { score: number; reason: RetrievedSegment["reason"] } | null {
  const haystackRoot = normalizeForSearch(seg.rootText || "");
  const haystackTrans = normalizeForSearch(seg.translationText || "");
  const haystack = `${haystackRoot} ${haystackTrans}`;

  let score = 0;
  let reason: RetrievedSegment["reason"] = "lexical";

  // 1. exact whole-query substring
  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    score += 10;
    reason = "exact";
  }

  // 2. term-level matches (Pāli terms get elevated weight)
  let termHits = 0;
  for (const t of terms) {
    const isTerm = isDhammaTerm(t);
    if (isTerm && haystack.includes(t)) {
      score += 6;
      termHits++;
    }
  }
  if (termHits > 0 && reason !== "exact") reason = "term";

  // 3. lexical token overlap
  const hayTokens = new Set(haystack.split(/[^a-z0-9]+/i).filter(Boolean));
  let overlap = 0;
  for (const t of terms) {
    if (hayTokens.has(t)) overlap++;
  }
  score += overlap * 2;

  if (score === 0) return null;

  // re-rank: canonical above commentarial / modern_explanation
  if (work?.category === "canonical") score += 3;

  return { score, reason };
}

/**
 * Run a hybrid search. Never throws on empty results — returns `[]`.
 * The caller (askDhamma) is responsible for failing closed when `[]`.
 */
export function search(
  corpus: Corpus,
  query: string,
  options: SearchOptions = {}
): RetrievedSegment[] {
  const normalizedQuery = normalizeForSearch(query);
  const terms = tokenize(query);
  const filters = options.filters ?? {};
  const limit = options.limit ?? 20;

  const workById = new Map(corpus.works.map((w) => [w.id, w]));
  const textById = new Map(corpus.texts.map((t) => [t.id, t]));

  const candidates = searchableSegments(corpus);
  const results: RetrievedSegment[] = [];

  for (const seg of candidates) {
    const text = textById.get(seg.textId);
    const work = text ? workById.get(text.workId) : undefined;
    if (!passesFilters(seg, work, filters)) continue;

    const scored = scoreSegment(seg, normalizedQuery, terms, work);
    if (!scored) continue;

    results.push({ ...seg, score: scored.score, reason: scored.reason });
  }

  // Stable sort: by score desc, then segmentOrder asc for deterministic output.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.segmentOrder - b.segmentOrder;
  });

  return results.slice(0, limit);
}

/** Convenience: search using a raw (already-loaded) segment list, e.g. for tests. */
export function searchSegments(
  segments: DhammaSegment[],
  query: string,
  limit = 20
): RetrievedSegment[] {
  const pseudoCorpus: Corpus = {
    works: [],
    texts: [],
    segments,
  };
  // Bypass searchableSegments filtering so tests control their own input.
  const normalizedQuery = normalizeForSearch(query);
  const terms = tokenize(query);
  const results: RetrievedSegment[] = [];
  for (const seg of segments) {
    const scored = scoreSegment(seg, normalizedQuery, terms, undefined);
    if (!scored) continue;
    results.push({ ...seg, score: scored.score, reason: scored.reason });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** Strip diacritics and re-export for callers that need the same normalization. */
export { stripPaliDiacritics };
