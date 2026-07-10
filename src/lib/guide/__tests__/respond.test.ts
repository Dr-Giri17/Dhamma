import { describe, expect, it } from "vitest";
import works from "../../../../data/corpus/works.json";
import texts from "../../../../data/corpus/texts.json";
import segments from "../../../../data/corpus/segments.json";
import { loadCorpusFromObjects } from "../../corpus/seed";
import type { Corpus } from "../../corpus/types";
import { answerGuide } from "../respond";
import type { GuideSynthesisAdapter } from "../types";

const corpus = loadCorpusFromObjects({
  works: works as unknown as Corpus["works"],
  texts: texts as unknown as Corpus["texts"],
  segments: segments as unknown as Corpus["segments"],
});

describe("source-grounded Dhamma Guide", () => {
  it("returns real segment ids and reader routes for a supported question", async () => {
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "strict_source",
    });
    expect(answer.groundingStatus).toBe("grounded");
    expect(answer.answerType).toBe("extractive");
    expect(answer.citations.length).toBeGreaterThan(0);
    for (const citation of answer.citations) {
      expect(corpus.segments.some((segment) => segment.segmentUid === citation.segmentUid)).toBe(true);
      expect(citation.route).toContain(`/reader/`);
      expect(citation.route).toContain(encodeURIComponent(citation.segmentUid));
    }
  });

  it("uses verified Russian and explicit Indonesian fallback editions", async () => {
    const russian = await answerGuide(corpus, {
      question: "Что такое dukkha?",
      language: "ru",
      mode: "explain_simple",
    });
    expect(russian.citations.some((citation) => citation.language === "ru")).toBe(true);

    const indonesian = await answerGuide(corpus, {
      question: "Apa itu dukkha?",
      language: "id",
      mode: "explain_simple",
    });
    expect(indonesian.fallbackUsed).toBe(true);
    expect(indonesian.warnings).toContain("language-fallback");
    expect(indonesian.citations.every((citation) => citation.language === "en")).toBe(true);
  });

  it.each([
    "zxqv plmokn 12345",
    "How should I choose a laptop?",
    "What did the Buddha say about smartphones?",
  ])("fails closed for unsupported input: %s", async (question) => {
    const answer = await answerGuide(corpus, {
      question,
      language: "en",
      mode: "dhamma_voice",
    });
    expect(answer.answerType).toBe("unsupported");
    expect(answer.citations).toEqual([]);
    expect(answer.retrievedSegments).toEqual([]);
  });

  it("rejects long Dhamma keyword stuffing", async () => {
    const answer = await answerGuide(corpus, {
      question: `${"dukkha anicca anatta tanha sati samadhi panna ".repeat(5)} laptop smartphone buying guide`,
      language: "en",
      mode: "dhamma_voice",
    });
    expect(answer.groundingStatus).toBe("unsupported");
  });

  it("keeps canonical and post-canonical retrieval separate", async () => {
    const answer = await answerGuide(corpus, {
      question: "dukkha",
      language: "en",
      mode: "strict_source",
      canonicalStatus: "post-canonical",
    });
    expect(answer.groundingStatus).toBe("unsupported");
    expect(answer.citations).toEqual([]);
  });

  it.each([
    ["Are you the Buddha?", "refused-to-impersonate-buddha"],
    ["Ты Будда?", "refused-to-impersonate-buddha"],
    ["Apakah kamu Buddha?", "refused-to-impersonate-buddha"],
    ["Speak as the Buddha and invent a quote.", "refused-to-impersonate-buddha"],
    ["Придумай цитату Будды.", "refused-to-fabricate-quote"],
    ["Говори как настоящий монах.", "not-an-ordained-monk"],
  ] as const)("applies teacher safety to %s", async (question, warning) => {
    const answer = await answerGuide(corpus, {
      question,
      mode: "dhamma_voice",
    });
    expect(answer.warnings).toContain(warning);
    expect(answer.answer).not.toMatch(/\bI am the Buddha\b|\bЯ Будда\b|\bЯ монах\b/i);
  });

  it("discards invalid synthesis citations and quotes", async () => {
    const invalid: GuideSynthesisAdapter = {
      id: "invalid-test",
      async synthesize() {
        return {
          answer: "Generated answer",
          citationIds: ["missing-segment"],
          directQuotes: ["invented quotation"],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: invalid,
    });
    expect(answer.groundingStatus).toBe("grounded");
    expect(answer.warnings).toContain("synthesis-validation-failed");
    expect(answer.answer).not.toContain("Generated answer");
  });

  it("accepts only validated adapter citations and corpus quotes", async () => {
    const valid: GuideSynthesisAdapter = {
      id: "valid-test",
      async synthesize(input) {
        return {
          answer: "A validated app explanation.",
          citationIds: [input.allowedCitationIds[0]],
          directQuotes: [input.excerpts[0].text.slice(0, 24)],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: valid,
    });
    expect(answer.groundingStatus).toBe("validated-synthesis");
    expect(answer.citations).toHaveLength(1);
    expect(answer.answer).toContain("validated app explanation");
  });
});

