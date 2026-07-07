/**
 * Dhammapada ingestion script — F. Max Müller 1881 (Project Gutenberg #2017).
 *
 * Fetches the public-domain plain text, parses all 423 verses, and regenerates
 * the Dhammapada portion of `data/corpus/segments.json`:
 *   - REMOVES the old seed Dhammapada segments (the 8 temporary `dhp:N.M` entries);
 *   - ADDS 423 full verses with stable UIDs `dhp:1`..`dhp:423`;
 *   - PRESERVES every Bilara/Sujato segment untouched;
 *   - writes deterministic, idempotent JSON.
 *
 * Network is required at GENERATION TIME only. Runtime reads checked-in JSON.
 *
 * Run:  npm run ingest:dhammapada
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DHAMMAPADA_GUTENBERG_URL,
  MULLER_PROVENANCE,
  parseGutenbergDhammapada,
  verseToSegment,
} from "../src/lib/corpus/dhammapada";
import type { DhammaSegment, DhammaText, SourceWork } from "../src/lib/corpus/types";

const CORPUS_DIR = path.resolve(process.cwd(), "data", "corpus");
const FILES = {
  works: path.join(CORPUS_DIR, "works.json"),
  texts: path.join(CORPUS_DIR, "texts.json"),
  segments: path.join(CORPUS_DIR, "segments.json"),
} as const;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function readJson<T>(file: string): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return [] as unknown as T;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  const arr = Array.isArray(data) ? data : [data];
  await fs.writeFile(file, JSON.stringify(arr, null, 2) + "\n", "utf8");
}

function compareSegment(a: DhammaSegment, b: DhammaSegment): number {
  if (a.textId !== b.textId) return a.textId.localeCompare(b.textId);
  return a.segmentOrder - b.segmentOrder;
}

async function main() {
  console.log("[dhp-ingest] fetching Müller 1881 from Project Gutenberg #2017 ...");
  const raw = await fetchText(DHAMMAPADA_GUTENBERG_URL);

  console.log("[dhp-ingest] parsing verses ...");
  const verses = parseGutenbergDhammapada(raw);
  if (verses.length !== 423) {
    throw new Error(`Expected 423 verses, parsed ${verses.length}`);
  }
  console.log(`[dhp-ingest] parsed ${verses.length} verses (1..423).`);

  const dhpSegments: DhammaSegment[] = verses.map(verseToSegment);

  // Load existing corpus.
  const [existingWorks, existingTexts, existingSegments] = await Promise.all([
    readJson<SourceWork[]>(FILES.works),
    readJson<DhammaText[]>(FILES.texts),
    readJson<DhammaSegment[]>(FILES.segments),
  ]);

  // Refresh the Dhammapada work metadata to cite the full edition.
  const works = existingWorks.map((w) =>
    w.id === "work-dhp"
      ? {
          ...w,
          sourceProvider: MULLER_PROVENANCE.provider,
          license: MULLER_PROVENANCE.license,
          translator: MULLER_PROVENANCE.translator,
          licenseNote: `${MULLER_PROVENANCE.edition}. Public domain in the USA.`,
          version: "full-423",
        }
      : w
  );

  // Refresh the Dhammapada text record to reflect full coverage.
  const texts = existingTexts.map((t) =>
    t.id === "text-dhp"
      ? { ...t, metadata: { ...(t.metadata || {}), verses: 423, vaggas: 26 } }
      : t
  );

  // Segments: drop ALL old Dhammapada entries (any text-dhp), keep everything
  // else (Bilara suttas untouched), then append the 423 new verses.
  const nonDhpSegments = existingSegments.filter((s) => s.textId !== "text-dhp");
  const segments = [...nonDhpSegments, ...dhpSegments].sort(compareSegment);

  console.log(
    `[dhp-ingest] writing corpus JSON: ${works.length} works, ${texts.length} texts, ${segments.length} segments.`
  );
  await writeJson(FILES.works, works);
  await writeJson(FILES.texts, texts);
  await writeJson(FILES.segments, segments);

  console.log("[dhp-ingest] done. Dhammapada now has 423 verses (dhp:1..dhp:423).");
}

main().catch((err) => {
  console.error("[dhp-ingest] FAILED:", err);
  process.exit(1);
});
