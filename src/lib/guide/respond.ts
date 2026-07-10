import type { Corpus } from "../corpus/types";
import { findConcepts } from "../teacher/respond";
import type { TeacherMode } from "../teacher/types";
import { normalizeLanguage, type SupportedLanguage } from "../i18n/language";
import { detectLanguage } from "../corpus/normalize";
import { validateSynthesis } from "./adapter";
import { retrieveGuide } from "./retrieval";
import { guideSafety } from "./safety";
import type {
  GuideAnswer,
  GuideCitation,
  GuideSynthesisAdapter,
  GuideWarning,
} from "./types";

export interface GuideRequest {
  question: string;
  language?: string;
  mode: TeacherMode;
  canonicalStatus?: "canonical" | "post-canonical" | "commentarial";
  adapter?: GuideSynthesisAdapter | null;
}

export async function answerGuide(
  corpus: Corpus,
  request: GuideRequest
): Promise<GuideAnswer> {
  const question = request.question.trim();
  const language = resolveLanguage(question, request.language);
  const safety = guideSafety(question, language);
  const retrieval = retrieveGuide(corpus, question, language, {
    canonicalStatus: request.canonicalStatus,
  });

  if (retrieval.segments.length === 0) {
    return {
      answerType: "unsupported",
      language,
      mode: request.mode,
      answer: [...safety.prefixes, copy[language].unsupported].join("\n\n"),
      warnings: unique([...safety.warnings, "no-relevant-source"]),
      citations: [],
      retrievedSegments: [],
      directExcerpts: [],
      fallbackUsed: false,
      groundingStatus: "unsupported",
    };
  }

  const fallbackUsed = retrieval.segments.some((segment) => segment.fallbackUsed);
  const baseWarnings: GuideWarning[] = [
    ...safety.warnings,
    ...(fallbackUsed ? ["language-fallback" as const] : []),
  ];

  if (request.mode !== "strict_source" && request.adapter) {
    try {
      const output = await request.adapter.synthesize({
        question,
        language,
        mode: request.mode,
        excerpts: retrieval.segments,
        allowedCitationIds: retrieval.segments.map((segment) => segment.id),
      });
      const validation = validateSynthesis(output, retrieval.segments);
      if (validation.valid) {
        const citationIds = new Set(validation.citations);
        return {
          answerType: "app-explanation",
          language,
          mode: request.mode,
          answer: [...safety.prefixes, output.answer].join("\n\n"),
          warnings: unique([...baseWarnings, "app-explanation-not-scripture"]),
          citations: retrieval.citations.filter((citation) => citationIds.has(citation.id)),
          retrievedSegments: retrieval.segments,
          directExcerpts: retrieval.segments,
          fallbackUsed,
          groundingStatus: "validated-synthesis",
        };
      }
    } catch {
      // Provider failures are intentionally converted to deterministic fallback.
    }
    baseWarnings.push("synthesis-validation-failed");
  }

  if (request.mode === "strict_source") {
    return {
      answerType: "extractive",
      language,
      mode: request.mode,
      answer: [...safety.prefixes, retrieval.segments[0].text].join("\n\n"),
      warnings: unique(baseWarnings),
      citations: retrieval.citations,
      retrievedSegments: retrieval.segments,
      directExcerpts: retrieval.segments,
      fallbackUsed,
      groundingStatus: "grounded",
    };
  }

  return {
    answerType: "app-explanation",
    language,
    mode: request.mode,
    answer: [...safety.prefixes, deterministicExplanation(question, language, request.mode, retrieval.citations)].join("\n\n"),
    warnings: unique([...baseWarnings, "app-explanation-not-scripture"]),
    citations: retrieval.citations,
    retrievedSegments: retrieval.segments,
    directExcerpts: retrieval.segments,
    fallbackUsed,
    groundingStatus: "grounded",
  };
}

function deterministicExplanation(
  question: string,
  language: SupportedLanguage,
  mode: Exclude<TeacherMode, "strict_source">,
  citations: GuideCitation[]
): string {
  const refs = Array.from(new Set(citations.map((citation) => citation.sourceRef))).join(", ");
  const citationRefs = new Set(citations.map((citation) => citation.sourceRef));
  const concepts = findConcepts(question).filter((concept) =>
    concept.sourceRefs.some((sourceRef) => citationRefs.has(sourceRef))
  );
  const explanation = concepts.length > 0
    ? concepts.map((concept) => {
        const text = concept.text[language];
        return mode === "dhamma_voice"
          ? `${text.shortExplanation} ${text.practicalExplanation}`
          : text.shortExplanation;
      }).join("\n\n")
    : copy[language].limited(refs);
  return `${copy[language].label}\n\n${explanation}\n\n${copy[language].sources(refs)}`;
}

function resolveLanguage(question: string, requested?: string): SupportedLanguage {
  if (requested) return normalizeLanguage(requested);
  return normalizeLanguage(detectLanguage(question));
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

const copy = {
  en: {
    unsupported: "I could not find sufficiently relevant imported source material, so I will not generate a doctrinal answer.",
    label: "App explanation (not scripture):",
    limited: (refs: string) => `The current corpus supports only a limited explanation from ${refs}. Read the verified excerpts below.`,
    sources: (refs: string) => `Grounded in retrieved sources: ${refs}.`,
  },
  ru: {
    unsupported: "В импортированном корпусе не найдено достаточно релевантных источников, поэтому приложение не будет генерировать доктринальный ответ.",
    label: "Объяснение приложения (не писание):",
    limited: (refs: string) => `Текущий корпус поддерживает только ограниченное объяснение по ${refs}. Ниже приведены проверенные выдержки.`,
    sources: (refs: string) => `Основано на найденных источниках: ${refs}.`,
  },
  id: {
    unsupported: "Tidak ditemukan sumber impor yang cukup relevan, sehingga aplikasi tidak akan menghasilkan jawaban doktrinal.",
    label: "Penjelasan aplikasi (bukan kitab suci):",
    limited: (refs: string) => `Korpus saat ini hanya mendukung penjelasan terbatas dari ${refs}. Baca kutipan terverifikasi di bawah.`,
    sources: (refs: string) => `Berpijak pada sumber yang ditemukan: ${refs}.`,
  },
} as const;

