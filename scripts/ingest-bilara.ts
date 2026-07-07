/**
 * Bilara / SuttaCentral ingestion skeleton (ТЗ §4.1, §9 Phase C).
 *
 * The full seed-sutta import (Sujato CC0 translations) is the NEXT pass —
 * it requires online access to `suttacentral/bilara-data`. This script is
 * the documented, typed entry point: it shows the exact shape a fetched
 * Bilara segment must take and validates it before writing.
 *
 * Bilara structure (ТЗ §4.1):
 *   - each text is a JSON segment map;
 *   - key  = stable segment id, e.g. `mn1:1.1`;
 *   - value = the segment text;
 *   - cognate files: root / translation / html / comment / reference / variant.
 *
 * Run:  npm run ingest:bilara
 *
 * License gate: only CC0 (Sujato) translations pass the allow-list.
 * See src/lib/corpus/licenses.ts and docs/CORPUS_POLICY.md.
 */

import { loadCorpus, validateCorpus } from "../src/lib/corpus/seed";
import { licenseFor } from "../src/lib/corpus/licenses";
import type { DhammaSegment } from "../src/lib/corpus/types";

async function main() {
  console.log("[bilara-ingest] loading existing corpus...");
  const corpus = await loadCorpus();
  console.log(
    `[bilara-ingest] current segments: ${corpus.segments.length} (seed only)`
  );

  const cc0 = licenseFor("bilara", "sujato");
  console.log(
    `[bilara-ingest] Sujato translation license = "${cc0.license}" (${cc0.note})`
  );

  // Example shape of a future Bilara-fetched record for SN 56.11.
  const exampleFetched: DhammaSegment = {
    id: "sn56.11-bilara-1",
    textId: "text-sn56.11",
    segmentUid: "sn56.11:1.1", // STABLE — never rewrite
    segmentOrder: 1,
    language: "en",
    rootText: "(Pāli root fetched from bilara-data root file)",
    translationText: "(Sujato CC0 translation fetched from bilara-data translation file)",
    sourceRef: "SN 56.11",
    license: cc0.license,
    translator: "Bhikkhu Sujato",
    provider: "bilara",
    metadata: { fetchedFrom: "suttacentral/bilara-data" },
  };

  try {
    validateCorpus({
      ...corpus,
      segments: [...corpus.segments, exampleFetched],
    });
    console.log("[bilara-ingest] contract OK for example Bilara record.");
  } catch (err) {
    console.error("[bilara-ingest] validation FAILED:", (err as Error).message);
    process.exit(1);
  }

  console.log(
    "[bilara-ingest] Next pass: fetch root + translation from bilara-data, " +
      "preserve segmentUid, attach CC0 license metadata, validate, then write."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
