/**
 * Dhammapada ingestion helpers — F. Max Müller 1881 translation.
 *
 * Source: Project Gutenberg eBook #2017
 *   https://www.gutenberg.org/cache/epub/2017/pg2017.txt
 * License: Public domain in the USA (pre-1900 translation, Sacred Books of
 * the East vol. X, Oxford, 1881).
 *
 * The Gutenberg plain text contains exactly 423 verses numbered continuously
 * 1..423 (verified). 9 entries are compound ("58, 59." etc.) where Müller
 * prints two Pāli gāthās under one translation; the parser expands these to
 * two UIDs sharing the same text.
 *
 * This module is pure & framework-agnostic; the network fetch lives in
 * scripts/ingest-dhammapada.ts.
 */

import type { DhammaSegment } from "./types";
import { KNOWN_LICENSES } from "./licenses";

/** Canonical Gutenberg URL for the Müller 1881 Dhammapada. */
export const DHAMMAPADA_GUTENBERG_URL =
  "https://www.gutenberg.org/cache/epub/2017/pg2017.txt";

/** Per-segment provenance for Müller 1881 Dhammapada verses (OneShot §5). */
export const MULLER_PROVENANCE = {
  license: KNOWN_LICENSES.PUBLIC_DOMAIN,
  provider: "project_gutenberg" as const,
  translator: "F. Max Müller",
  edition: "Sacred Books of the East vol. X, Oxford, 1881 (Project Gutenberg #2017)",
};

/**
 * The 26 vaggas (chapters) of the Dhammapada with their verse ranges.
 * Ranges are inclusive. Verified against the canonical structure.
 */
export interface Vagga {
  number: number;
  name: string;
  firstVerse: number;
  lastVerse: number;
}

export const VAGGAS: readonly Vagga[] = [
  { number: 1, name: "Yamaka-vagga (Twin Verses)", firstVerse: 1, lastVerse: 20 },
  { number: 2, name: "Appamāda-vagga (Earnestness)", firstVerse: 21, lastVerse: 32 },
  { number: 3, name: "Citta-vagga (Mind)", firstVerse: 33, lastVerse: 43 },
  { number: 4, name: "Puppha-vagga (Flowers)", firstVerse: 44, lastVerse: 59 },
  { number: 5, name: "Bāla-vagga (Fools)", firstVerse: 60, lastVerse: 75 },
  { number: 6, name: "Paṇḍita-vagga (The Wise)", firstVerse: 76, lastVerse: 89 },
  { number: 7, name: "Arahat-vagga (The Venerable)", firstVerse: 90, lastVerse: 99 },
  { number: 8, name: "Sahassa-vagga (Thousands)", firstVerse: 100, lastVerse: 115 },
  { number: 9, name: "Pāpa-vagga (Wickedness)", firstVerse: 116, lastVerse: 128 },
  { number: 10, name: "Daṇḍa-vagga (Punishment)", firstVerse: 129, lastVerse: 145 },
  { number: 11, name: "Jarā-vagga (Old Age)", firstVerse: 146, lastVerse: 156 },
  { number: 12, name: "Atta-vagga (Self)", firstVerse: 157, lastVerse: 166 },
  { number: 13, name: "Loka-vagga (The World)", firstVerse: 167, lastVerse: 178 },
  { number: 14, name: "Buddha-vagga (The Awakened One)", firstVerse: 179, lastVerse: 196 },
  { number: 15, name: "Sukha-vagga (Happiness)", firstVerse: 197, lastVerse: 208 },
  { number: 16, name: "Piya-vagga (Affection)", firstVerse: 209, lastVerse: 220 },
  { number: 17, name: "Kodha-vagga (Anger)", firstVerse: 221, lastVerse: 234 },
  { number: 18, name: "Mala-vagga (Impurity)", firstVerse: 235, lastVerse: 255 },
  { number: 19, name: "Dhammaṭṭha-vagga (The Just)", firstVerse: 256, lastVerse: 272 },
  { number: 20, name: "Magga-vagga (The Way)", firstVerse: 273, lastVerse: 289 },
  { number: 21, name: "Pakinnaka-vagga (Miscellaneous)", firstVerse: 290, lastVerse: 305 },
  { number: 22, name: "Nirāya-vagga (The Hellish)", firstVerse: 306, lastVerse: 319 },
  { number: 23, name: "Nāga-vagga (The Elephant)", firstVerse: 320, lastVerse: 333 },
  { number: 24, name: "Taṇhā-vagga (Craving)", firstVerse: 334, lastVerse: 359 },
  { number: 25, name: "Bhikkhu-vagga (The Mendicant)", firstVerse: 360, lastVerse: 382 },
  { number: 26, name: "Brāhmaṇa-vagga (The Brahmana)", firstVerse: 383, lastVerse: 423 },
];

/** Resolve the vagga (chapter) for a verse number. Returns undefined if out of range. */
export function vaggaForVerse(verse: number): Vagga | undefined {
  return VAGGAS.find((v) => verse >= v.firstVerse && verse <= v.lastVerse);
}

/** A parsed verse: a single verse number with its (possibly shared) text. */
export interface ParsedVerse {
  verse: number;
  text: string;
}

/** Marker lines that bound the Gutenberg body. */
const START_MARKER = "*** START OF";
const END_MARKER = "*** END OF";

/**
 * Parse the Gutenberg plain text into individual verses.
 *
 * - Body is the text between the `*** START OF` and `*** END OF` markers.
 * - A verse block starts at a line matching `^(\d+(?:, \d+)*)\.\s` and continues
 *   until the next such line. Continuation lines are joined with a space.
 * - Compound entries (`58, 59.`) are expanded: each number gets its own
 *   ParsedVerse sharing the same text.
 *
 * Throws if the result is not exactly verses 1..N continuous with no gaps.
 */
export function parseGutenbergDhammapada(raw: string): ParsedVerse[] {
  const startIdx = raw.indexOf(START_MARKER);
  const endIdx = raw.indexOf(END_MARKER);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    throw new Error("Could not locate Gutenberg START/END markers");
  }
  const body = raw.slice(startIdx, endIdx);

  // Strip the START line itself so the first verse boundary isn't masked.
  const firstNewline = body.indexOf("\n");
  const lines = body.slice(firstNewline + 1).split(/\r?\n/);

  const verseStartRe = /^(\d+(?:,\s*\d+)*)\.\s?(.*)$/;
  const blocks: Array<{ nums: number[]; text: string }> = [];
  let current: { nums: number[]; text: string } | null = null;

  for (const line of lines) {
    const m = line.match(verseStartRe);
    if (m) {
      if (current) blocks.push(current);
      const nums = m[1].split(",").map((s) => Number(s.trim()));
      const rest = (m[2] || "").trim();
      current = { nums, text: rest };
    } else if (current) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        current.text = current.text ? `${current.text} ${trimmed}` : trimmed;
      }
    }
  }
  if (current) blocks.push(current);

  // Expand compound blocks into one ParsedVerse per number.
  const verses: ParsedVerse[] = [];
  const seen = new Set<number>();
  for (const b of blocks) {
    for (const n of b.nums) {
      if (seen.has(n)) {
        throw new Error(`Duplicate verse number ${n} in Dhammapada source`);
      }
      seen.add(n);
      verses.push({ verse: n, text: b.text });
    }
  }

  // Validate continuity 1..N.
  verses.sort((a, b) => a.verse - b.verse);
  for (let i = 0; i < verses.length; i++) {
    if (verses[i].verse !== i + 1) {
      throw new Error(
        `Dhammapada verse gap/duplication: expected ${i + 1} but got ${verses[i].verse}`
      );
    }
  }
  return verses;
}

/**
 * Build a DhammaSegment for one Dhammapada verse.
 *
 * UID scheme: `dhp:<verse>` (e.g. `dhp:1`, `dhp:423`). One segment per verse.
 */
export function verseToSegment(verse: ParsedVerse): DhammaSegment {
  const vagga = vaggaForVerse(verse.verse);
  return {
    id: `dhp-${verse.verse}`,
    textId: "text-dhp",
    segmentUid: `dhp:${verse.verse}`,
    segmentOrder: verse.verse,
    language: "en",
    translationText: verse.text,
    verseNumber: String(verse.verse),
    chapter: vagga?.name,
    sourceRef: `Dhp ${verse.verse}`,
    license: MULLER_PROVENANCE.license,
    provider: MULLER_PROVENANCE.provider,
    translator: MULLER_PROVENANCE.translator,
    metadata: {
      edition: MULLER_PROVENANCE.edition,
      vaggaNumber: vagga?.number,
    },
  };
}
