/**
 * Ask Dhamma — fail-closed, source-grounded RAG (ТЗ §6, §9 Phase E).
 *
 * Contract (ТЗ §6.3): an answer with NO sources is forbidden. When retrieval
 * returns nothing (or only weak commentarial material for a "what did the
 * Buddha say" question), `askDhamma` refuses to fabricate and returns the
 * localized "I could not find reliable support in the current corpus"
 * message with `confidence: "low"` and a warning.
 *
 * Two answer paths share the same contract:
 *   - LOCAL (default, MVP): deterministic extractive summary built from the
 *     retrieved segments. No external model. No hallucination surface.
 *   - PROVIDER (optional, later): if an LlmProvider is supplied, the
 *     retrieved context is sent to it under the Dhamma system prompt.
 *
 * Localization: only answer FRAMING is localized (see src/lib/ai/i18n.ts).
 * Retrieved source excerpts stay in the corpus language (English Müller /
 * Sujato) and a localized note says so — excerpts are never presented as
 * canonical translations into the user's language.
 */

import type { Corpus, DhammaAnswer, RetrievedSegment } from "../corpus/types";
import { search } from "../corpus/search";
import { isDhammaTerm, DHAMMA_TERMS } from "../corpus/search";
import { tokenize, detectLanguage } from "../corpus/normalize";
import { DHAMMA_SYSTEM_PROMPT } from "./dhamma-system-prompt";
import { buildUserMessage } from "./prompts";
import { stringsFor } from "./i18n";
import type { LlmProvider } from "./provider";

export interface AskOptions {
  language?: string;
  limit?: number;
  provider?: LlmProvider | null;
}

/**
 * Refusal message returned when retrieval is empty (ТЗ §6.3).
 * Kept as named exports for backward compatibility with tests; the i18n table
 * is the canonical source.
 */
export const NO_SOURCE_REFUSAL_EN = stringsFor("en").noSourceRefusal;
export const NO_SOURCE_REFUSAL_RU = stringsFor("ru").noSourceRefusal;

/**
 * The canonical Ask Dhamma entry point.
 *
 * @returns always resolves — never throws on "no sources"; instead fails closed.
 */
export async function askDhamma(
  corpus: Corpus,
  question: string,
  options: AskOptions = {}
): Promise<DhammaAnswer> {
  const language = options.language ?? detectLanguage(question);
  const limit = options.limit ?? 6;
  const t = stringsFor(language);

  const safetyRefusal = refusalForUnsafeRoleRequest(question, language);
  if (safetyRefusal) return safetyRefusal;

  const retrieved = search(corpus, question, {
    limit,
    filters: { includeCommentarial: false },
  });

  // Fail closed: no sources → no doctrinal answer (ТЗ §6.3).
  if (retrieved.length === 0) {
    return {
      answer: t.noSourceRefusal,
      sources: [],
      retrievedSegments: [],
      confidence: "low",
      warnings: [
        "no-retrieved-sources",
        "refused-to-fabricate",
      ],
    };
  }

  const warnings: string[] = [];

  // Optional provider path. If supplied, defer the wording to the model but
  // keep the same contract & citation discipline.
  if (options.provider) {
    const answer = await options.provider.complete({
      system: DHAMMA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(question, retrieved) }],
      temperature: 0.2,
    });
    return {
      answer,
      sources: retrieved,
      retrievedSegments: retrieved,
      confidence: confidenceFor(retrieved),
      warnings,
    };
  }

  // LOCAL extractive answer — deterministic, no model.
  const answer = composeLocalAnswer(question, retrieved, language);
  return {
    answer,
    sources: retrieved,
    retrievedSegments: retrieved,
    confidence: confidenceFor(retrieved),
    warnings,
  };
}

const IMPERSONATION_PATTERNS = [
  /\b(?:speak|talk|answer|respond)\b.{0,40}\bas\s+(?:the\s+)?buddha\b/i,
  /\bpretend\s+to\s+be\s+(?:the\s+)?buddha\b/i,
  /(?:говори|ответь|обращайся).{0,40}как\s+(?:сам\s+)?будд[аы]/iu,
  /(?:berbicara|jawab).{0,40}sebagai\s+(?:sang\s+)?buddha/i,
];

const MONASTIC_AUTHORITY_PATTERNS = [
  /\b(?:answer|respond|speak|talk)\b.{0,40}\b(?:with\s+the\s+authority\s+of|as)\s+(?:an?\s+)?(?:ordained\s+)?(?:monk|bhikkhu)\b/i,
  /(?:ответь|говори|обращайся).{0,40}(?:как|с\s+авторитетом)\s+(?:монах(?:а|ом)?|бхиккху)/iu,
  /(?:jawab|berbicara).{0,40}(?:sebagai|dengan\s+otoritas)\s+(?:seorang\s+)?(?:biksu|bhikkhu)/i,
];

function refusalForUnsafeRoleRequest(
  question: string,
  language: string
): DhammaAnswer | null {
  if (IMPERSONATION_PATTERNS.some((pattern) => pattern.test(question))) {
    return {
      answer: roleSafetyMessage(language, "impersonation"),
      sources: [],
      retrievedSegments: [],
      confidence: "low",
      warnings: ["refused-to-impersonate"],
    };
  }
  if (MONASTIC_AUTHORITY_PATTERNS.some((pattern) => pattern.test(question))) {
    return {
      answer: roleSafetyMessage(language, "monastic-authority"),
      sources: [],
      retrievedSegments: [],
      confidence: "low",
      warnings: ["not-an-ordained-monk"],
    };
  }
  return null;
}

function roleSafetyMessage(
  language: string,
  kind: "impersonation" | "monastic-authority"
): string {
  if (language === "ru") {
    return kind === "impersonation"
      ? "Я могу помочь с объяснением Дхаммы, опираясь на источники, но не могу говорить от имени Будды или изображать его."
      : "Я не являюсь посвящённым монахом и не могу приписывать себе монашеский авторитет. Я могу только дать объяснение с явной опорой на источники.";
  }
  if (language === "id") {
    return kind === "impersonation"
      ? "Saya dapat membantu menjelaskan Dhamma berdasarkan sumber, tetapi tidak dapat berbicara sebagai atau meniru Buddha."
      : "Saya bukan bhikkhu yang ditahbiskan dan tidak dapat mengklaim otoritas monastik. Saya hanya dapat memberi penjelasan dengan rujukan yang jelas.";
  }
  return kind === "impersonation"
    ? "I can help explain the Dhamma from sources, but I cannot speak as or impersonate the Buddha."
    : "I am not an ordained monk and cannot claim monastic authority. I can only provide an explanation with explicit source support.";
}

/** Decide a confidence label from the retrieval quality. */
function confidenceFor(retrieved: RetrievedSegment[]): "high" | "medium" | "low" {
  if (retrieved.length === 0) return "low";
  const topScore = retrieved[0].score;
  const hasCanonical = retrieved.some(
    (s) => s.reason === "exact" || s.reason === "term"
  );
  if (topScore >= 8 && hasCanonical) return "high";
  if (topScore >= 4) return "medium";
  return "low";
}

/**
 * Compose a deterministic, citation-bearing answer from the top retrieved
 * segments. Only FRAMING strings are localized; source excerpts are emitted
 * verbatim from the corpus (English) with a localized availability note, so
 * they are never presented as translations into the user's language.
 */
function composeLocalAnswer(
  question: string,
  retrieved: RetrievedSegment[],
  language: string
): string {
  const t = stringsFor(language);
  const top = retrieved.slice(0, 3);
  const termHits = tokenize(question).filter((tk) => isDhammaTerm(tk));

  const lines: string[] = [];

  // Short answer: extract a tight gloss from the strongest segment.
  // The gloss stays in the corpus language (English); only the label is localized.
  const strongest = top[0];
  const gloss = (strongest.translationText || strongest.rootText || "").trim();
  lines.push(`${t.shortAnswerLabel}: ${truncate(gloss)}`, "");

  // Sources block with explicit refs. Excerpts are NOT translated.
  lines.push(t.sourcesHeading);
  top.forEach((s, i) => {
    const quote = truncate((s.translationText || s.rootText || "").trim(), 220);
    lines.push(`${i + 1}. [${s.sourceRef}] ${quote}`);
  });
  lines.push("");

  // Localized note: excerpts are in the available English translation.
  lines.push(t.sourceExcerptNote, "");

  // Explanation: surface matched Pāli terms with their canonical form.
  if (termHits.length > 0) {
    const terms = termHits
      .map((term) => `${DHAMMA_TERMS[term] ?? term}`)
      .join(", ");
    lines.push(t.explanationWithTerms(terms));
  } else {
    lines.push(t.explanationGeneric);
  }
  lines.push(t.explanationGrounded, "");

  // Confidence line.
  lines.push(t.confidenceLine);

  return lines.join("\n");
}

function truncate(s: string, max = 280): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
