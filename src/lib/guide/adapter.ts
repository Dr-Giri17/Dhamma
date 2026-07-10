import type {
  GuideCitation,
  GuideRetrievedSegment,
  GuideSynthesisAdapter,
  SynthesisOutput,
} from "./types";

export function validateSynthesis(
  output: SynthesisOutput,
  retrieved: GuideRetrievedSegment[]
): { valid: true; citations: GuideCitation["id"][] } | { valid: false } {
  const allowedIds = new Set(retrieved.map((segment) => segment.id));
  if (!output.answer.trim() || output.citationIds.length === 0) return { valid: false };
  if (output.citationIds.some((id) => !allowedIds.has(id))) return { valid: false };
  const corpusText = retrieved.map((segment) => segment.text).join("\n");
  if (output.directQuotes.some((quote) => !quote || !corpusText.includes(quote))) {
    return { valid: false };
  }
  return { valid: true, citations: Array.from(new Set(output.citationIds)) };
}

/**
 * No external provider is configured in this repository. The interface is
 * injected into answerGuide for server-only adapters and is disabled by default.
 */
export const NO_SYNTHESIS_ADAPTER: GuideSynthesisAdapter | null = null;

