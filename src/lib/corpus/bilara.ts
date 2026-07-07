/**
 * Bilara / SuttaCentral data integration helpers.
 *
 * Pure, framework-agnostic utilities for:
 *   - resolving the bilara-data file path for a given UID (root + translation);
 *   - deriving a canonical sourceRef (ТЗ §11) from a Bilara segment UID;
 *   - building DhammaSegment records from raw Bilara segment maps.
 *
 * The only network lives in scripts/ingest-bilara.ts. This module is testable
 * without touching the filesystem or the network.
 *
 * Source: https://github.com/suttacentral/bilara-data  (branch `published`).
 * Bilara segment files are a FLAT MAP { [segmentUid: string]: string } —
 * there is NO `text` / `author_uid` / `vn` wrapper. Author/lang live in the
 * filename and repo-root metadata. See docs/CORPUS_POLICY.md.
 */

import type { DhammaSegment } from "./types";
import { KNOWN_LICENSES } from "./licenses";

/** Branch of bilara-data we consume. `main` does NOT exist — must be `published`. */
export const BILARA_BRANCH = "published";
export const BILARA_BASE = `https://raw.githubusercontent.com/suttacentral/bilara-data/${BILARA_BRANCH}`;

/** Mahāsaṅgīti Pāli root edition identifier used by Bilara. */
export const ROOT_EDITION = "Mahāsaṅgīti / ms";

/** Per-segment provenance for Sujato CC0 translations (ТЗ §4, OneShot §4). */
export const SUJATO_PROVENANCE = {
  license: KNOWN_LICENSES.CC0,
  provider: "bilara" as const,
  translator: "Bhikkhu Sujato",
};

/**
 * The seed corpus target list (OneShot §3).
 *
 * `collectionDir` is the bilara-data subdirectory under `sutta/`. The mapping
 * is verified against the live repo: MN/DN are flat, AN is split by nipata,
 * SN by saṃyutta, and Sutta Nipāta lives under kn/snp then by vagga (the
 * vagga number is path-only — it does NOT appear in segment UIDs).
 */
export interface BilaraTarget {
  uid: string;
  workId: string;       // links to source_works.id
  collectionDir: string; // path under sutta/, e.g. "mn", "an/an3", "kn/snp/vagga1"
}

export const BILARA_TARGETS: readonly BilaraTarget[] = [
  { uid: "mn10", workId: "work-mn", collectionDir: "mn" },
  { uid: "mn118", workId: "work-mn", collectionDir: "mn" },
  { uid: "dn31", workId: "work-dn", collectionDir: "dn" },
  { uid: "an3.65", workId: "work-an", collectionDir: "an/an3" },
  { uid: "sn56.11", workId: "work-sn", collectionDir: "sn/sn56" },
  { uid: "snp1.8", workId: "work-snp", collectionDir: "kn/snp/vagga1" },
  { uid: "snp2.1", workId: "work-snp", collectionDir: "kn/snp/vagga2" },
  { uid: "snp2.4", workId: "work-snp", collectionDir: "kn/snp/vagga2" },
];

/** Resolve the bilara-data path for a UID's Pāli root file. */
export function rootPath(t: BilaraTarget): string {
  return `root/pli/ms/sutta/${t.collectionDir}/${t.uid}_root-pli-ms.json`;
}

/** Resolve the bilara-data path for a UID's Sujato English translation file. */
export function translationPath(t: BilaraTarget): string {
  return `translation/en/sujato/sutta/${t.collectionDir}/${t.uid}_translation-en-sujato.json`;
}

/** Full URL for a bilara-data path. */
export function bilaraUrl(pathSeg: string): string {
  return `${BILARA_BASE}/${pathSeg}`;
}

/**
 * Derive the canonical sourceRef prefix (ТЗ §11) from a Bilara UID.
 *
 *   mn10      -> "MN 10"
 *   mn118     -> "MN 118"
 *   dn31      -> "DN 31"
 *   an3.65    -> "AN 3.65"
 *   sn56.11   -> "SN 56.11"
 *   snp1.8    -> "Snp 1.8"
 *   snp2.1    -> "Snp 2.1"
 *   snp2.4    -> "Snp 2.4"
 *
 * The UID prefix (everything before any `:` in a segment id) is the work+number.
 * We uppercase the collection code and uppercase only the leading "snp" → "Snp".
 */
export function uidToSourceRef(uid: string): string {
  const prefix = uid.split(":")[0];
  const m = prefix.match(/^([a-z]+)(.*)$/i);
  if (!m) return prefix;
  const [, code, rest] = m;
  const codeLabel = code.toLowerCase() === "snp" ? "Snp" : code.toUpperCase();
  const restTrim = rest.trim();
  return restTrim ? `${codeLabel} ${restTrim}` : codeLabel;
}

/**
 * A Bilara segment-id prefix is the part before the first colon, e.g.
 * `mn10:4.0.1` -> `mn10`. Used for grouping + sourceRef.
 */
export function segmentUidPrefix(segmentUid: string): string {
  return segmentUid.split(":")[0];
}

/**
 * Build a DhammaSegment from a Bilara (root?, translation?) pair.
 *
 * Segment UID is preserved VERBATIM — including three-level (`mn10:4.0.1`) and
 * range (`mn10:18-23.1`) forms. `segmentOrder` is the index of the segment in
 * Bilara's insertion order, so re-ingestion yields a stable order.
 *
 * If both root and translation are present, the top-level `license` is the
 * translation license (CC0) and the Pāli root provenance is stored separately
 * in `metadata` (OneShot §4).
 */
export function buildSegment(input: {
  uid: string;
  textId: string;
  segmentUid: string;
  segmentOrder: number;
  rootText?: string;
  translationText?: string;
}): DhammaSegment {
  const { uid, textId, segmentUid, segmentOrder, rootText, translationText } = input;

  const hasTranslation = typeof translationText === "string" && translationText.length > 0;

  const metadata: Record<string, unknown> = {
    rootLicense: KNOWN_LICENSES.PUBLIC_DOMAIN,
    rootProvider: "bilara",
    rootEdition: ROOT_EDITION,
  };

  if (hasTranslation) {
    metadata.translationLicense = SUJATO_PROVENANCE.license;
    metadata.translationProvider = SUJATO_PROVENANCE.provider;
    metadata.translator = SUJATO_PROVENANCE.translator;
  }

  return {
    id: segmentUidToId(segmentUid),
    textId,
    segmentUid,
    segmentOrder,
    language: "en",
    rootText: rootText && rootText.length > 0 ? rootText : undefined,
    translationText: hasTranslation ? translationText : undefined,
    sourceRef: uidToSourceRef(uid),
    license: hasTranslation ? SUJATO_PROVENANCE.license : KNOWN_LICENSES.PUBLIC_DOMAIN,
    provider: SUJATO_PROVENANCE.provider,
    translator: SUJATO_PROVENANCE.translator,
    metadata,
  };
}

/**
 * Stable internal `id` derived from the segmentUid by replacing `:` and `.`/`-`
 * with hyphens. Keeps ids filesystem/JSON-safe and unique within the corpus.
 *   "mn10:4.0.1" -> "seg-mn10-4-0-1"
 */
export function segmentUidToId(segmentUid: string): string {
  const safe = segmentUid
    .replace(/[:.]/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "-");
  return `seg-${safe}`;
}
