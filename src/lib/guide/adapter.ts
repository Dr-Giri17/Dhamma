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

  const citationIds = new Set(output.citationIds);
  const normalizedDirectQuotes = output.directQuotes.map((quote) => quote.trim());
  if (normalizedDirectQuotes.some((quote) => {
    if (!quote) return true;
    return !retrieved.some(
      (segment) => citationIds.has(segment.id) && segment.text.includes(quote)
    );
  })) {
    return { valid: false };
  }

  const declaredQuotes = new Set(normalizedDirectQuotes);
  for (const quote of quoteLikeSpans(output.answer)) {
    if (!declaredQuotes.has(quote)) return { valid: false };
    if (!retrieved.some((segment) => segment.text.includes(quote))) return { valid: false };
  }

  return { valid: true, citations: Array.from(citationIds) };
}

const MIN_QUOTE_CHARS = 20;
const QUOTE_PATTERNS = [
  /"([^"\r\n]+)"/gu,
  /“([^”\r\n]+)”/gu,
  /«([^»\r\n]+)»/gu,
  /„([^“\r\n]+)“/gu,
];

function quoteLikeSpans(answer: string): string[] {
  const spans: string[] = [];
  for (const pattern of QUOTE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of answer.matchAll(pattern)) {
      const quote = match[1].trim();
      if (quote.length >= MIN_QUOTE_CHARS) spans.push(quote);
    }
  }
  return spans;
}

/**
 * No external provider is configured in this repository. The interface is
 * injected into answerGuide for server-only adapters and is disabled by default.
 */
export const NO_SYNTHESIS_ADAPTER: GuideSynthesisAdapter | null = null;
