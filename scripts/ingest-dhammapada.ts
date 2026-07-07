/**
 * Dhammapada ingestion script (ТЗ §9 Phase C).
 *
 * MVP ships with a small hand-entered, license-clean seed
 * (Pāli root + Müller 1881 English, both public domain) in
 * `data/corpus/segments.json`. This script is the EXTENSION point: it
 * documents how to add the full 423 verses from a verified source and how
 * to validate them against the corpus invariants before they're written.
 *
 * Run:  npm run ingest:dhammapada
 *
 * Safety: the script NEVER overwrites existing stable segment UIDs and never
 * writes a record that fails corpus validation.
 */

import { loadCorpus, validateCorpus } from "../src/lib/corpus/seed";
import type { DhammaSegment } from "../src/lib/corpus/types";

async function main() {
  console.log("[dhammapada-ingest] loading existing corpus...");
  const corpus = await loadCorpus();
  const existing = corpus.segments.filter((s) => s.textId === "text-dhp");
  console.log(`[dhammapada-ingest] current Dhammapada segments: ${existing.length}`);

  // Demonstrate the validation contract on a synthetic record.
  const sample: DhammaSegment = {
    id: "dhp-demo",
    textId: "text-dhp",
    segmentUid: "dhp:demo.1",
    segmentOrder: 9999,
    language: "en",
    translationText: "(placeholder — replace with verified public-domain text)",
    verseNumber: "9999",
    chapter: "demo",
    sourceRef: "Dhp 9999",
    license: "Public Domain",
    translator: "F. Max Müller (1881)",
    provider: "manual",
    metadata: {},
  };

  try {
    validateCorpus({
      ...corpus,
      segments: [...corpus.segments, sample],
    });
    console.log("[dhammapada-ingest] validation contract OK for sample record.");
  } catch (err) {
    console.error("[dhammapada-ingest] validation FAILED:", (err as Error).message);
    process.exit(1);
  }

  console.log(
    "[dhammapada-ingest] Next: replace placeholder with verified Müller 1881 verses, " +
      "keeping segmentUid stable. See docs/CORPUS_POLICY.md."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
