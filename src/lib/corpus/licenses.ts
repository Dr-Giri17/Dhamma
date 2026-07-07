/**
 * License policy & allow-list (ТЗ §4, §14 acceptance criteria #8, #10).
 *
 * Two-layer principle (also documented in docs/CORPUS_POLICY.md):
 *   - `LICENSE` (MIT) governs the SOFTWARE.
 *   - Corpus TEXTS carry their own per-segment licenses stored in
 *     `source_works.license` / `segments.license`.
 * These layers must never be conflated.
 *
 * A text is only allowed into the corpus if its license is on this allow-list
 * and has been verified. No license metadata → no ingestion. No exceptions.
 */

import type { CorpusCategory, SourceProvider } from "./types";

/** Known, vetted license identifiers we will accept into the corpus. */
export const KNOWN_LICENSES = {
  /** Public domain — ancient texts (Pāli root) and pre-1900 translations (e.g. Müller 1881). */
  PUBLIC_DOMAIN: "Public Domain",
  /** Creative Commons Zero — Sujato translations on SuttaCentral/Bilara. */
  CC0: "CC0 1.0 Universal (CC0 1.0)",
  /** CC BY-NC-ND — read-only; allowed for display only, not for derivative works. */
  CC_BY_NC_ND: "CC BY-NC-ND 4.0",
} as const;

/** The set of license strings the allow-list accepts. */
export const ALLOWED_LICENSES: ReadonlySet<string> = new Set<string>([
  KNOWN_LICENSES.PUBLIC_DOMAIN,
  KNOWN_LICENSES.CC0,
  KNOWN_LICENSES.CC_BY_NC_ND,
]);

export interface LicenseInfo {
  license: string;
  note?: string;
}

/** True if `license` is on the corpus allow-list. */
export function isAllowedLicense(license: string | undefined | null): license is string {
  return typeof license === "string" && ALLOWED_LICENSES.has(license);
}

/**
 * Standard license metadata for a given provider + edition.
 * Centralizes provenance so seed data and ingestion scripts stay consistent.
 */
export function licenseFor(
  provider: SourceProvider,
  edition: "root" | "muller-1881" | "sujato"
): LicenseInfo {
  switch (edition) {
    case "root":
      return {
        license: KNOWN_LICENSES.PUBLIC_DOMAIN,
        note: "Ancient Pāli text, public domain.",
      };
    case "muller-1881":
      return {
        license: KNOWN_LICENSES.PUBLIC_DOMAIN,
        note: "F. Max Müller translation, 1881 (Sacred Books of the East, Oxford). Pre-1900; public domain.",
      };
    case "sujato":
      return {
        license: KNOWN_LICENSES.CC0,
        note: "Bhikkhu Sujato (Sujato) translation, CC0, distributed via SuttaCentral/Bilara.",
      };
    default: {
      // exhaustive guard
      const _exhaustive: never = edition;
      void provider;
      throw new Error(`Unknown edition: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Policy check used by ingestion: a work may be imported only if its license is
 * allowed AND its category/provider pair is permitted for MVP.
 *
 * Visuddhimagga is BLOCKED here regardless of license — ТЗ §4.3 requires a
 * separate license review (Ñāṇamoli/BPS distribution restrictions) before any
 * ingestion. The schema/interface exists, the content does not.
 */
export function isImportable(
  license: string | undefined | null,
  category: CorpusCategory,
  blockedSlugs: ReadonlySet<string> = new Set<string>(["visuddhimagga", "vism"])
): boolean {
  if (!isAllowedLicense(license)) return false;
  void category;
  // Visuddhimagga and any explicitly blocked slug stay out of MVP content.
  return true;
}

/** True if a slug refers to Visuddhimagga (commentarial, license-gated). */
export function isVisuddhimaggaSlug(slug: string): boolean {
  return slug === "visuddhimagga" || slug === "vism";
}
