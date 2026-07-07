/**
 * Search-index builder (ТЗ §9 Phase C/D).
 *
 * In MVP the index is built in-memory at request time from the seed JSON,
 * so this script is a no-op placeholder that documents the future step:
 * when the corpus grows past a few thousand segments, persist a normalized
 * token index to `data/indexes/segments.json` (gitignored) and load it
 * instead of re-tokenizing on every request.
 *
 * Run:  npm run build:index
 */

import { loadCorpus } from "../src/lib/corpus/seed";

async function main() {
  const corpus = await loadCorpus();
  console.log(
    `[build-index] corpus: ${corpus.works.length} works, ` +
      `${corpus.texts.length} texts, ${corpus.segments.length} segments`
  );
  console.log(
    "[build-index] MVP builds the index in memory; nothing to persist yet."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
