import "server-only";

import { headers } from "next/headers";
import manifestJson from "../../../data/corpus/full-search-manifest.json";
import type { RetrievedSegment } from "./types";

interface SearchDocument {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  sourceUrl: string;
  excerpt: string;
  language: "pli" | "en" | "ru";
  canonicalStatus: "canonical" | "post-canonical";
  collection: string;
  translator?: string;
  attribution: string;
}

interface SearchShard {
  documents: SearchDocument[];
  postings: Record<string, number[]>;
}

const searchManifest = manifestJson as { shards: Array<{ language: string; collection: string; asset: string }> };

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function queryLanguage(query: string, explicit?: string): "pli" | "en" | "ru" {
  if (explicit === "pli" || explicit === "en" || explicit === "ru") return explicit;
  if (/\p{Script=Cyrillic}/u.test(query)) return "ru";
  if (/[āīūṃṁṅñṇṭḍḷ]/i.test(query)) return "pli";
  return "en";
}

async function shard(asset: string): Promise<SearchShard> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("Cannot resolve search shard origin");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const response = await fetch(`${protocol}://${host}${asset}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Search shard request failed (${response.status}): ${asset}`);
  return response.json() as Promise<SearchShard>;
}

export async function searchFullCorpus(query: string, options: { language?: string; collection?: string; canonicalOnly?: boolean; limit?: number } = {}): Promise<RetrievedSegment[]> {
  const language = queryLanguage(query, options.language);
  const terms = [...new Set(normalize(query).split(/\s+/).filter((term) => term.length >= 3))];
  if (!terms.length) return [];
  const selected = searchManifest.shards.filter((entry) => entry.language === language && (!options.collection || entry.collection === options.collection));
  const scored: Array<{ document: SearchDocument; score: number }> = [];
  for (const entry of selected) {
    const value = await shard(entry.asset);
    const scores = new Map<number, number>();
    for (const term of terms) {
      for (const documentId of value.postings[term] ?? []) scores.set(documentId, (scores.get(documentId) ?? 0) + 1);
    }
    for (const [documentId, hits] of scores) {
      const document = value.documents[documentId];
      if (!document || (options.canonicalOnly && document.canonicalStatus !== "canonical")) continue;
      scored.push({ document, score: hits * 5 + (document.canonicalStatus === "canonical" ? 2 : 0) });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.document.segmentUid.localeCompare(b.document.segmentUid));
  return scored.slice(0, Math.min(options.limit ?? 20, 50)).map(({ document, score }, index) => ({
    id: document.id,
    textId: document.textId,
    segmentUid: document.segmentUid,
    segmentOrder: index + 1,
    language: document.language,
    rootText: document.language === "pli" ? document.excerpt : undefined,
    translationText: document.language !== "pli" ? document.excerpt : undefined,
    sourceRef: document.sourceRef,
    license: document.attribution,
    translator: document.translator,
    provider: document.language === "en" ? "bilara" : "manual",
    metadata: { sourceUrl: document.sourceUrl, collection: document.collection, canonicalStatus: document.canonicalStatus },
    score,
    reason: hitsReason(score, terms.length),
  }));
}

function hitsReason(score: number, termCount: number): RetrievedSegment["reason"] {
  return score >= termCount * 5 + 2 ? "exact" : "lexical";
}
