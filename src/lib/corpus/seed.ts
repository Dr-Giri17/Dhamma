/**
 * Seed corpus loader + validator.
 *
 * Loads JSON from `data/corpus/` and guarantees the corpus invariants
 * (ТЗ §15 acceptance criteria, §14 quality gates):
 *   - every segment has a non-empty `sourceRef`, `license`, and `provider`;
 *   - every segment's `textId` resolves to a known text;
 *   - every text's `workId` resolves to a known work;
 *   - `segmentUid` is stable & unique;
 *   - works on the blocked list (Visuddhimagga) contribute NO segments.
 *
 * This module is framework-agnostic (no React/Next imports) so it can be
 * reused by Expo or a Telegram Mini App later.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Corpus,
  DhammaSegment,
  DhammaText,
  SourceWork,
} from "./types";
import {
  isAllowedLicense,
  isVisuddhimaggaSlug,
} from "./licenses";

const CORPUS_DIR = path.resolve(process.cwd(), "data", "corpus");

export type { Corpus };

/** Validation error with enough context to fix the offending record. */
export class CorpusValidationError extends Error {
  constructor(
    message: string,
    readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CorpusValidationError";
  }
}

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(CORPUS_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

/**
 * Load and validate the seed corpus. Throws on any invariant violation
 * so broken data never silently reaches search or RAG.
 */
export async function loadCorpus(): Promise<Corpus> {
  const [works, texts, segments] = await Promise.all([
    readJson<SourceWork[]>("works.json"),
    readJson<DhammaText[]>("texts.json"),
    readJson<DhammaSegment[]>("segments.json"),
  ]);

  validateCorpus({ works, texts, segments });
  return { works, texts, segments };
}

/**
 * Build and validate a Corpus from already-loaded objects (no FS read).
 *
 * Used by `src/lib/server.ts`, which imports the JSON statically so that
 * Next.js bundles the corpus into each page/function — making the app
 * deploy-safe on serverless hosts (Vercel) without relying on the file
 * tracer. The validation contract is identical to `loadCorpus()`.
 */
export function loadCorpusFromObjects(input: {
  works: SourceWork[];
  texts: DhammaText[];
  segments: DhammaSegment[];
}): Corpus {
  validateCorpus(input);
  return { ...input };
}

/** Synchronous validator — usable from tests without touching the filesystem. */
export function validateCorpus(corpus: Corpus): void {
  const { works, texts, segments } = corpus;

  const workIds = new Set<string>();
  for (const w of works) {
    if (!w.id || !w.slug || !w.title) {
      throw new CorpusValidationError(
        "Work missing required id/slug/title",
        { work: w }
      );
    }
    workIds.add(w.id);
  }

  const textIds = new Set<string>();
  const textById = new Map<string, DhammaText>();
  for (const t of texts) {
    if (!t.id || !t.workId || !t.uid) {
      throw new CorpusValidationError(
        "Text missing required id/workId/uid",
        { text: t }
      );
    }
    if (!workIds.has(t.workId)) {
      throw new CorpusValidationError(
        `Text "${t.id}" references unknown workId "${t.workId}"`,
        { text: t }
      );
    }
    textIds.add(t.id);
    textById.set(t.id, t);
  }

  const seenUids = new Set<string>();
  for (const seg of segments) {
    // segment-uid uniqueness & presence
    if (!seg.segmentUid) {
      throw new CorpusValidationError(
        "Segment missing stable segmentUid",
        { segment: seg }
      );
    }
    if (seenUids.has(seg.segmentUid)) {
      throw new CorpusValidationError(
        `Duplicate segmentUid "${seg.segmentUid}"`,
        { segment: seg }
      );
    }
    seenUids.add(seg.segmentUid);

    // text linkage
    if (!seg.textId || !textIds.has(seg.textId)) {
      throw new CorpusValidationError(
        `Segment "${seg.segmentUid}" references unknown textId "${seg.textId}"`,
        { segment: seg }
      );
    }

    // mandatory provenance — ТЗ §15.8
    if (!seg.sourceRef) {
      throw new CorpusValidationError(
        `Segment "${seg.segmentUid}" has no sourceRef`,
        { segment: seg }
      );
    }
    if (!seg.license) {
      throw new CorpusValidationError(
        `Segment "${seg.segmentUid}" has no license`,
        { segment: seg }
      );
    }
    if (!seg.provider) {
      throw new CorpusValidationError(
        `Segment "${seg.segmentUid}" has no provider`,
        { segment: seg }
      );
    }

    for (const [language, translation] of Object.entries(seg.translations ?? {})) {
      if (
        !translation ||
        translation.language !== language ||
        !translation.text ||
        !translation.translator ||
        !translation.provider ||
        !translation.sourcePath ||
        !translation.publicationStatus ||
        translation.published !== true ||
        !isAllowedLicense(translation.license)
      ) {
        throw new CorpusValidationError(
          `Segment "${seg.segmentUid}" has invalid ${language} translation provenance`,
          { segment: seg }
        );
      }
    }

    // Visuddhimagga must contribute no segments in MVP (ТЗ §4.3)
    const text = textById.get(seg.textId);
    if (text) {
      const work = works.find((w) => w.id === text.workId);
      if (work && isVisuddhimaggaSlug(work.slug)) {
        throw new CorpusValidationError(
          `Visuddhimagga segment "${seg.segmentUid}" present — blocked pending license review`,
          { segment: seg }
        );
      }
    }
  }
}

/**
 * Filter the corpus down to segments that are eligible for retrieval.
 * Excludes:
 *   - segments with no translation text;
 *   - any text whose work is on the blocked list (Visuddhimagga) — even if a
 *     stray record slipped in;
 *   - any segment whose OWN license is off the allow-list;
 *   - any segment whose owning WORK'S license is off the allow-list
 *     (policy enforced at both layers — ТЗ §4.4 forbids texts without
 *     license metadata).
 */
export function searchableSegments(corpus: Corpus): DhammaSegment[] {
  // Works that are either Visuddhimagga-blocked or carry a disallowed license.
  const disallowedWorkIds = new Set<string>();
  for (const w of corpus.works) {
    if (isVisuddhimaggaSlug(w.slug) || !isAllowedLicense(w.license)) {
      disallowedWorkIds.add(w.id);
    }
  }
  const blockedTextIds = new Set(
    corpus.texts.filter((t) => disallowedWorkIds.has(t.workId)).map((t) => t.id)
  );
  return corpus.segments.filter(
    (s) =>
      !blockedTextIds.has(s.textId) &&
      !!s.translationText &&
      isAllowedLicense(s.license)
  );
}
