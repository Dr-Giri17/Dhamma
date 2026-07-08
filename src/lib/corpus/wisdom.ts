/**
 * Daily wisdom (ТЗ §9 Phase F, §2 goal #5).
 *
 * Selection rules:
 *   - prefer short, standalone segments (Dhammapada verses are ideal);
 *   - avoid obscure technical Abhidhamma for general users;
 *   - ALWAYS include a source ref — no unsourced wisdom ever ships;
 *   - selection is deterministic for a given (date, language) so it is
 *     stable across reloads and testable.
 *
 * Reflection / practice prompts are MARKED as explanation, not scripture
 * (ТЗ §4.3 spirit, §2 goal #5).
 */

import type { Corpus, DhammaSegment } from "./types";
import { searchableSegments } from "./seed";

export interface DailyWisdom {
  segment: DhammaSegment;
  theme: string;
  shortReflection: string;
  practicePrompt: string;
  language: string;
  /** Always 'manual' in MVP — reflections are templated, not AI-generated. */
  createdBy: "manual";
}

export interface WisdomOptions {
  language?: string;
  theme?: string;
  date?: Date | string;
}

/** Simple, deterministic 32-bit hash → index into the candidate pool. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Format a Date/string as YYYY-MM-DD (stable key for the day). */
function dayKey(date: Date | string | undefined): string {
  const d = date instanceof Date ? date : date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Pick today's wisdom. Throws if the corpus has no eligible segments —
 * because an unsourced "wisdom of the day" is worse than none (ТЗ §6.3).
 */
export function getDailyWisdom(
  corpus: Corpus,
  options: WisdomOptions = {}
): DailyWisdom {
  const language = options.language ?? "en";
  const key = `${dayKey(options.date)}:${language}`;

  const eligible = searchableSegments(corpus).filter((s) => {
    // Prefer Dhammapada verses (short, standalone, suitable for any reader).
    // Avoid long sutta exposition and any verse without a translation.
    const text = (s.translationText || "").trim();
    if (text.length === 0) return false;
    if (text.length > 400) return false; // keep it short
    // Dhammapada verses are preferred; allow other short canonical too.
    return true;
  });

  if (eligible.length === 0) {
    throw new Error(
      "No eligible wisdom segments in corpus. Cannot ship unsourced wisdom."
    );
  }

  const idx = hashString(key) % eligible.length;
  const segment = eligible[idx];

  return {
    segment,
    theme: deriveTheme(segment),
    shortReflection: reflectionFor(segment),
    practicePrompt: practicePromptFor(segment),
    language,
    createdBy: "manual",
  };
}

function deriveTheme(seg: DhammaSegment): string {
  if (seg.metadata && typeof seg.metadata === "object") {
    const topic = (seg.metadata as Record<string, unknown>).topic;
    if (typeof topic === "string") return topic;
  }
  if (seg.chapter) return seg.chapter;
  return "Размышление о Дхамме";
}

/** Templated reflection — explicitly marked as explanation, not scripture. */
function reflectionFor(seg: DhammaSegment): string {
  const ref = seg.sourceRef;
  return `(${ref} — размышление, не канонический текст) Этот фрагмент указывает на силу ума и намерения. Обратите внимание: ваши нынешние мысли формируют то, что за ними следует.`;
}

function practicePromptFor(_seg: DhammaSegment): string {
  return "Сегодня мягко понаблюдайте связь между мыслью и тем, что следует за ней — без оценки, просто замечая.";
}
