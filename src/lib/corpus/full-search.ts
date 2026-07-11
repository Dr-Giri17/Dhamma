import "server-only";

import manifestJson from "../../../data/corpus/full-search-manifest.json";
import type { RetrievedSegment } from "./types";
import { fetchTrustedJson } from "./trusted-assets";
import {
  FETCH_TIMEOUT,
  MAX_DECOMPRESSED_BYTES_PER_SHARD,
  MAX_RESULTS,
  MAX_SHARDS_PER_QUERY,
  prepareFullSearchQuery,
  searchDocumentAllowed,
  type SearchCanonicalStatus as CanonicalStatus,
  type SearchLanguage,
} from "./search-policy";

export { MAX_QUERY_CHARS } from "./search-policy";
const SHARD_CONCURRENCY = 4;

interface SearchDocument {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  sourceUrl: string;
  excerpt: string;
  language: SearchLanguage;
  canonicalStatus: CanonicalStatus;
  collection: string;
  translator?: string;
  attribution: string;
}

interface SearchShard {
  documents: SearchDocument[];
  postings: Record<string, number[]>;
}

const manifest = manifestJson as { shards: Array<{ language: SearchLanguage; collection: string; asset: string }> };

async function mapBounded<T, R>(values: T[], limit: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await fn(values[index]);
    }
  }));
  return output;
}

async function loadShard(asset: string): Promise<SearchShard> {
  return fetchTrustedJson<SearchShard>(asset, {
    maxBytes: MAX_DECOMPRESSED_BYTES_PER_SHARD,
    timeoutMs: FETCH_TIMEOUT,
  });
}

export interface FullSearchOptions {
  language?: string;
  collection?: string;
  canonicalOnly?: boolean;
  canonicalStatus?: CanonicalStatus;
  limit?: number;
}

export async function searchFullCorpus(query: string, options: FullSearchOptions = {}): Promise<RetrievedSegment[]> {
  const prepared = prepareFullSearchQuery(query, options.language);
  if (!prepared.supported) return [];
  const { language, terms: groundedTerms } = prepared;

  const selected = manifest.shards
    .filter((entry) => entry.language === language && (!options.collection || entry.collection === options.collection))
    .slice(0, MAX_SHARDS_PER_QUERY);
  const shards = await mapBounded(selected, SHARD_CONCURRENCY, (entry) => loadShard(entry.asset));
  const scored: Array<{ document: SearchDocument; score: number }> = [];

  for (const shard of shards) {
    const scores = new Map<number, number>();
    for (const term of groundedTerms) {
      for (const documentId of shard.postings[term] ?? []) scores.set(documentId, (scores.get(documentId) ?? 0) + 1);
    }
    for (const [documentId, hits] of scores) {
      const document = shard.documents[documentId];
      if (!document) continue;
      if (!searchDocumentAllowed(document, { language, collection: options.collection, canonicalOnly: options.canonicalOnly, canonicalStatus: options.canonicalStatus })) continue;
      scored.push({ document, score: hits * 5 + (document.canonicalStatus === "canonical" ? 2 : 0) });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.document.segmentUid.localeCompare(b.document.segmentUid));
  const limit = Math.min(Math.max(1, Math.trunc(options.limit ?? MAX_RESULTS)), MAX_RESULTS);
  return scored.slice(0, limit).map(({ document, score }) => ({
    id: document.id,
    textId: document.textId,
    segmentUid: document.segmentUid,
    segmentOrder: 0,
    language: document.language,
    rootText: document.language === "pli" ? document.excerpt : undefined,
    translationText: document.language !== "pli" ? document.excerpt : undefined,
    sourceRef: document.sourceRef,
    license: document.attribution,
    translator: document.translator,
    provider: document.language === "en" || document.language === "ru" ? "bilara" : "manual",
    metadata: { sourceUrl: document.sourceUrl, collection: document.collection, canonicalStatus: document.canonicalStatus },
    score,
    reason: score >= groundedTerms.length * 5 + 2 ? "exact" : "lexical",
  }));
}
