/**
 * Canonical source-reference formatting (ТЗ §11).
 *
 * Rules:
 *   Dhammapada          → `Dhp {verse}`
 *   Majjhima Nikāya     → `MN {number}`
 *   Saṃyutta Nikāya     → `SN {chapter}.{sutta}`
 *   Aṅguttara Nikāya    → `AN {book}.{sutta}`
 *   Dīgha Nikāya        → `DN {number}`
 *   Sutta Nipāta        → `Snp {chapter}.{sutta}`
 *   Visuddhimagga       → `Vism {chapter/section}`
 */

import type { DhammaText, SourceWork } from "./types";

/** Format a Dhammapada reference: `Dhp 5`, `Dhp 1.1`. */
export function formatDhammapadaRef(verseNumber?: string): string {
  if (!verseNumber) return "Dhp";
  return `Dhp ${verseNumber}`;
}

/**
 * Format a source reference from text + work metadata.
 * Falls back to the work title if no structured reference is derivable.
 */
export function formatSourceRef(
  text: DhammaText,
  work: SourceWork,
  opts?: { verseNumber?: string; sectionLabel?: string }
): string {
  const uid = (text.uid || "").toLowerCase();

  switch (uid) {
    case "dhp":
      return formatDhammapadaRef(opts?.verseNumber);
    default: {
      // Nikāya UIDs: dn / mn / sn / an / snp (sutta nipāta) / vism
      const m = uid.match(/^(dn|mn|sn|an|snp|vism|snp1|snp2)/);
      if (m) {
        const prefix = m[1].startsWith("snp")
          ? "Snp"
          : m[1] === "vism"
            ? "Vism"
            : m[1].toUpperCase();
        const tail = uid.replace(m[1], "").replace(/^[-_.]+/, "");
        return tail ? `${prefix} ${tail}` : prefix;
      }
      return opts?.sectionLabel || work.title;
    }
  }
}

/** Validate that a source ref looks well-formed (non-empty, has a label). */
export function isValidSourceRef(ref: string): boolean {
  if (!ref || typeof ref !== "string") return false;
  const trimmed = ref.trim();
  if (trimmed.length === 0) return false;
  // must contain at least one letter
  return /[a-zA-Z]/.test(trimmed);
}
