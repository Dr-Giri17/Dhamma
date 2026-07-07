/**
 * Server-side data access for Next.js route handlers / server components.
 *
 * The corpus JSON is imported STATICALLY (not read from the filesystem at
 * runtime). Next.js therefore bundles `data/corpus/*.json` into every page
 * and serverless function that imports this module, which makes the app
 * deploy-safe on serverless hosts (Vercel) without relying on Next.js's file
 * tracer. The validation contract from `seed.ts` still runs on first access.
 *
 * Memoized per-process.
 */

import "server-only";
import type { Corpus } from "./corpus/types";
import { loadCorpusFromObjects } from "./corpus/seed";
// Static imports — Next.js bundles these into the consuming function/page.
import worksJson from "../../data/corpus/works.json";
import textsJson from "../../data/corpus/texts.json";
import segmentsJson from "../../data/corpus/segments.json";

let cache: Corpus | null = null;

/** Return the validated corpus, loading + validating once per process. */
export function getCorpus(): Corpus {
  if (cache) return cache;
  cache = loadCorpusFromObjects({
    works: worksJson as unknown as Corpus["works"],
    texts: textsJson as unknown as Corpus["texts"],
    segments: segmentsJson as unknown as Corpus["segments"],
  });
  return cache;
}
