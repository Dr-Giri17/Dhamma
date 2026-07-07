/**
 * Corpus data model for the Dhamma App.
 *
 * Source-grounded Theravāda companion. Every claim answers back to a segment.
 * See ТЗ §5 (data architecture) and §10 (suggested file contracts).
 *
 * Invariants enforced across the codebase:
 *  - `segmentUid` is STABLE and never rewritten.
 *  - Every imported segment carries a non-empty `sourceRef`, `license`, and provider.
 *  - `commentarial` sources are never presented as words of the Buddha.
 */

/** Canonical provenance tier. Determines retrieval re-ranking (canonical ranks above commentarial). */
export type CorpusCategory =
  | "canonical"
  | "commentarial"
  | "modern_explanation";

/** Piṭaka bucket. `post_canonical` is reserved for Visuddhimagga and later commentaries. */
export type Pitaka =
  | "vinaya"
  | "sutta"
  | "abhidhamma"
  | "post_canonical"
  | "unknown";

/** Where the text was obtained from. */
export type SourceProvider =
  | "suttacentral"
  | "bilara"
  | "project_gutenberg"
  | "manual";

/** Nikāya / collection shorthand. */
export type Nikaya = "dn" | "mn" | "sn" | "an" | "kn";

/** Tradition. This app is Theravāda-only; the field exists for future explicit labelling. */
export type Tradition = "theravada";

/**
 * `source_works` — a work / book / collection.
 * Example: "Dhammapada", "Majjhima Nikāya", "Visuddhimagga".
 */
export interface SourceWork {
  id: string;
  slug: string;
  title: string;
  titlePali?: string;
  tradition: Tradition;
  category: CorpusCategory;
  pitaka: Pitaka;
  nikaya?: Nikaya;
  sourceProvider: SourceProvider;
  license: string;
  licenseNote?: string;
  translator?: string;
  author?: string;
  language: string;
  version?: string;
  importedAt: string;
}

/**
 * `texts` — one text inside a work.
 * Example: `mn10`, `sn56.11`, `dhp`.
 */
export interface DhammaText {
  id: string;
  workId: string;
  uid: string;
  slug: string;
  title: string;
  titlePali?: string;
  collection?: string;
  orderIndex?: number;
  metadata?: Record<string, unknown>;
}

/**
 * `segments` — the atomic unit of reading and retrieval.
 * `segmentUid` MUST be stable (e.g. `mn1:1.1`, `dhp:1.1`).
 */
export interface DhammaSegment {
  id: string;
  textId: string;
  segmentUid: string;
  segmentOrder: number;
  language: string;
  rootText?: string;
  translationText?: string;
  htmlTemplate?: string;
  speaker?: string;
  sectionTitle?: string;
  verseNumber?: string;
  chapter?: string;
  sourceRef: string;
  license: string;
  translator?: string;
  provider: SourceProvider;
  metadata?: Record<string, unknown>;
}

/** A segment with a retrieval score and the reason it matched. */
export interface RetrievedSegment extends DhammaSegment {
  score: number;
  reason: "exact" | "term" | "semantic" | "lexical";
}

/** Confidence label returned to the user alongside any doctrinal answer. */
export type Confidence = "high" | "medium" | "low";

/** Result of `askDhamma()`. Answer must fail closed when `sources` is empty. */
export interface DhammaAnswer {
  answer: string;
  sources: RetrievedSegment[];
  confidence: Confidence;
  warnings: string[];
  retrievedSegments: RetrievedSegment[];
}

/** The loaded corpus: all works, texts, and segments together. */
export interface Corpus {
  works: SourceWork[];
  texts: DhammaText[];
  segments: DhammaSegment[];
}

/** Filter options for corpus search. */
export interface SearchFilters {
  category?: CorpusCategory;
  workId?: string;
  uidPrefix?: string; // e.g. "dhp", "mn"
  language?: string;
  includeCommentarial?: boolean;
}

/** Normalized search query. */
export interface ParsedQuery {
  raw: string;
  language: string;
  terms: string[];
}
