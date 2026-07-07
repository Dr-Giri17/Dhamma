/**
 * Prompt assembly helpers for Ask Dhamma.
 * Keeps the user-message construction separate from the model call so it
 * can be unit-tested without a provider.
 */

import type { RetrievedSegment } from "../corpus/types";

/** Render retrieved segments into a compact, citation-bearing context block. */
export function renderContext(segments: RetrievedSegment[]): string {
  if (segments.length === 0) return "";
  const lines = segments.map((s, i) => {
    const text = (s.translationText || s.rootText || "").trim();
    return `${i + 1}. [${s.sourceRef}] ${text}`;
  });
  return ["Sources:", ...lines].join("\n");
}

/** Build the user message handed to a completion provider. */
export function buildUserMessage(
  question: string,
  segments: RetrievedSegment[]
): string {
  const ctx = renderContext(segments);
  return [
    `Question: ${question}`,
    "",
    ctx,
    "",
    "Answer strictly from the sources above. Cite each source by its [ref].",
    "If the sources are insufficient, say so plainly — do not fabricate.",
  ].join("\n");
}
