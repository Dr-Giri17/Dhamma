import type { Corpus, DhammaSegment } from "../corpus/types";
import { DHAMMA_TERMS, search } from "../corpus/search";
import { selectTranslation } from "../corpus/translations";
import { manifestEdition } from "../corpus/manifest";
import { tokenize } from "../corpus/normalize";
import type { SupportedLanguage } from "../i18n/language";
import { buildEditionHref } from "../reader/navigation";
import type { GuideCitation, GuideRetrievedSegment } from "./types";

const MAX_CONTEXT = 5;

export interface GuideRetrieval {
  segments: GuideRetrievedSegment[];
  citations: GuideCitation[];
}

export function looksLikeKeywordStuffing(question: string): boolean {
  const terms = tokenize(question);
  const dhammaTerms = new Set(terms.filter((term) => term in DHAMMA_TERMS));
  return question.length > 100 && dhammaTerms.size >= 6;
}

export function retrieveGuide(
  corpus: Corpus,
  question: string,
  language: SupportedLanguage,
  options: { canonicalStatus?: "canonical" | "post-canonical" | "commentarial" } = {}
): GuideRetrieval {
  if (looksLikeKeywordStuffing(question)) return { segments: [], citations: [] };

  const textById = new Map(corpus.texts.map((text) => [text.id, text]));
  const workById = new Map(corpus.works.map((work) => [work.id, work]));
  const hits = search(corpus, question, {
    limit: MAX_CONTEXT,
    filters: {
      includeCommentarial: options.canonicalStatus !== "canonical",
      canonicalStatus: options.canonicalStatus,
    },
  });

  const segments: GuideRetrievedSegment[] = [];
  const citations: GuideCitation[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    if (seen.has(hit.segmentUid)) continue;
    seen.add(hit.segmentUid);
    const text = textById.get(hit.textId);
    if (!text) continue;
    const work = workById.get(text.workId);
    if (!work) continue;
    const selection = preferredText(hit, language);
    if (!selection.text) continue;
    const canonicalStatus = work.pitaka === "post_canonical"
      ? "post-canonical"
      : work.category === "canonical"
        ? "canonical"
        : "commentarial";
    const edition = manifestEdition(hit.textId, selection.language);
    if (!edition) continue;
    const route = buildEditionHref({
      slug: text.slug,
      edition: selection.language === "pli" ? "pli" : selection.language as SupportedLanguage,
      segmentUid: hit.segmentUid,
    });
    const retrieved: GuideRetrievedSegment = {
      id: hit.id,
      segmentUid: hit.segmentUid,
      sourceRef: hit.sourceRef,
      route,
      language: selection.language,
      text: selection.text,
      score: hit.score,
      canonicalStatus,
      fallbackUsed: selection.fallback,
    };
    segments.push(retrieved);
    citations.push({
      id: hit.id,
      segmentUid: hit.segmentUid,
      sourceRef: hit.sourceRef,
      route,
      language: selection.language,
      translator: edition.translator,
      publisher: edition.publisher,
      licenseName: edition.licenseName,
      canonicalStatus,
    });
  }

  return { segments, citations };
}

function preferredText(
  segment: DhammaSegment,
  language: SupportedLanguage
): { text?: string; language: "pli" | SupportedLanguage; fallback: boolean } {
  const selected = selectTranslation(segment, language);
  if (selected.translation) {
    return {
      text: selected.translation.text,
      language: selected.translation.language as SupportedLanguage,
      fallback: selected.isFallback,
    };
  }
  if (segment.rootText) return { text: segment.rootText, language: "pli", fallback: true };
  return { language, fallback: false };
}

