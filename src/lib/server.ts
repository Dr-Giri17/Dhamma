/**
 * Server-side data access for Next.js route handlers / server components.
 *
 * Keeps page components thin: they call `getCorpus()` and the corpus helpers,
 * and never touch the filesystem directly. Memoized per-request.
 */

import "server-only";
import { loadCorpus, type Corpus } from "./corpus/seed";

let cache: Corpus | null = null;

/** Load the corpus once per process (dev hot-reload will reset module state). */
export async function getCorpus(): Promise<Corpus> {
  if (cache) return cache;
  cache = await loadCorpus();
  return cache;
}
