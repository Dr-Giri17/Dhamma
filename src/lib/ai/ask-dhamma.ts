/**
 * Ask Dhamma — fail-closed, source-grounded RAG (ТЗ §6, §9 Phase E).
 *
 * Contract (ТЗ §6.3): an answer with NO sources is forbidden. When retrieval
 * returns nothing (or only weak commentarial material for a "what did the
 * Buddha say" question), `askDhamma` refuses to fabricate and returns the
 * canonical "I could not find reliable support in the current corpus"
 * message with `confidence: "low"` and a warning.
 *
 * Two answer paths share the same contract:
 *   - LOCAL (default, MVP): deterministic extractive summary built from the
 *     retrieved segments. No external model. No hallucination surface.
 *   - PROVIDER (optional, later): if an LlmProvider is supplied, the
 *     retrieved context is sent to it under the Dhamma system prompt.
 *
 * In both paths the answer must include citations, and commentarial sources
 * are never dressed up as words of the Buddha.
 */

import type { Corpus, DhammaAnswer, RetrievedSegment } from "../corpus/types";
import { search } from "../corpus/search";
import { isDhammaTerm, DHAMMA_TERMS } from "../corpus/search";
import { tokenize, detectLanguage } from "../corpus/normalize";
import { DHAMMA_SYSTEM_PROMPT } from "./dhamma-system-prompt";
import { buildUserMessage } from "./prompts";
import type { LlmProvider } from "./provider";

export interface AskOptions {
  language?: string;
  limit?: number;
  provider?: LlmProvider | null;
}

/** Refusal message returned when retrieval is empty (ТЗ §6.3). */
export const NO_SOURCE_REFUSAL_EN =
  "I could not find reliable support for this in the current corpus. " +
  "I can offer a general orientation, but I will not present it as a canonical quotation.";

export const NO_SOURCE_REFUSAL_RU =
  "Я не нашёл достаточно надёжной опоры в текущем корпусе. " +
  "Могу дать общую ориентировку, но не буду выдавать её как каноническую цитату.";

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

  const retrieved = search(corpus, question, {
    limit,
    filters: { includeCommentarial: false },
  });

  // Fail closed: no sources → no doctrinal answer (ТЗ §6.3).
  if (retrieved.length === 0) {
    return {
      answer:
        language === "ru" ? NO_SOURCE_REFUSAL_RU : NO_SOURCE_REFUSAL_EN,
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
 * segments. This is intentionally conservative — it quotes/paraphrases the
 * corpus, names every source, and explicitly labels non-Buddha-voice
 * material (commentarial) rather than presenting it as scripture.
 */
function composeLocalAnswer(
  question: string,
  retrieved: RetrievedSegment[],
  language: string
): string {
  const top = retrieved.slice(0, 3);
  const termHits = tokenize(question).filter((t) => isDhammaTerm(t));

  const lines: string[] = [];

  // Short answer: extract a tight gloss from the strongest segment.
  const strongest = top[0];
  const gloss = (strongest.translationText || strongest.rootText || "").trim();
  const shortAnswer =
    language === "ru"
      ? `Краткий ответ: ${truncate(gloss)}`
      : `Short answer: ${truncate(gloss)}`;
  lines.push(shortAnswer, "");

  // Sources block with explicit refs.
  lines.push(language === "ru" ? "Опора в текстах:" : "Sources:");
  top.forEach((s, i) => {
    const quote = truncate((s.translationText || s.rootText || "").trim(), 220);
    lines.push(`${i + 1}. [${s.sourceRef}] ${quote}`);
  });
  lines.push("");

  // Explanation: surface matched Pāli terms with their canonical form.
  if (termHits.length > 0) {
    const terms = termHits
      .map((t) => `${DHAMMA_TERMS[t] ?? t}`)
      .join(", ");
    lines.push(
      language === "ru"
        ? `Объяснение: в вопросе есть термины пали — ${terms}.`
        : `Explanation: the question touches on the Pāli term(s): ${terms}.`
    );
    lines.push(
      language === "ru"
        ? "Это объяснение опирается на приведённые источники, а не на выдумку."
        : "This explanation is grounded in the cited sources, not generated from memory."
    );
  } else {
    lines.push(
      language === "ru"
        ? "Объяснение: ответ построен строго из приведённых цитат."
        : "Explanation: this answer is built strictly from the cited passages."
    );
  }
  lines.push("");

  // Confidence line.
  lines.push(
    language === "ru"
      ? "Уверенность: см. поле confidence."
      : "Confidence: see the confidence field."
  );

  return lines.join("\n");
}

function truncate(s: string, max = 280): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
