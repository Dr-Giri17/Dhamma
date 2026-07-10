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

  it("strict_source returns exactly one excerpt and its matching citation", async () => {
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "strict_source",
    });
    expect(answer.citations).toHaveLength(1);
    expect(answer.retrievedSegments).toHaveLength(1);
    expect(answer.directExcerpts).toHaveLength(1);
    expect(answer.answer).toBe(answer.retrievedSegments[0].text);
    expect(answer.citations[0].id).toBe(answer.retrievedSegments[0].id);
    expect(answer.directExcerpts[0].id).toBe(answer.retrievedSegments[0].id);
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

  it.each([
    'The source says "this fabricated quotation is not in the retrieved corpus".',
    "The source says “this fabricated quotation is not in the retrieved corpus”.",
    "The source says «this fabricated quotation is not in the retrieved corpus».",
    "The source says „this fabricated quotation is not in the retrieved corpus“.",
  ])("rejects a fabricated quote hidden in the synthesized answer: %s", async (generated) => {
    const invalid: GuideSynthesisAdapter = {
      id: "hidden-quote-test",
      async synthesize(input) {
        return {
          answer: generated,
          citationIds: [input.allowedCitationIds[0]],
          directQuotes: [],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: invalid,
    });
    expect(answer.warnings).toContain("synthesis-validation-failed");
    expect(answer.answer).not.toContain("fabricated quotation");
  });

  it("does not treat a short quoted term as a direct quotation", async () => {
    const valid: GuideSynthesisAdapter = {
      id: "short-term-test",
      async synthesize(input) {
        return {
          answer: "The term “dukkha” is discussed in the retrieved source.",
          citationIds: [input.allowedCitationIds[0]],
          directQuotes: [],
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
  });

  it("rejects an unknown citation ID even without direct quotes", async () => {
    const invalid: GuideSynthesisAdapter = {
      id: "unknown-citation-test",
      async synthesize() {
        return {
          answer: "Generated app explanation.",
          citationIds: ["missing-segment"],
          directQuotes: [],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: invalid,
    });
    expect(answer.warnings).toContain("synthesis-validation-failed");
  });

  it("rejects a quote formed by concatenating two retrieved segments", async () => {
    const invalid: GuideSynthesisAdapter = {
      id: "cross-segment-quote-test",
      async synthesize(input) {
        const quote = `${input.excerpts[0].text.slice(-24)}\n${input.excerpts[1].text.slice(0, 24)}`;
        return {
          answer: "Generated app explanation.",
          citationIds: input.allowedCitationIds.slice(0, 2),
          directQuotes: [quote],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: invalid,
    });
    expect(answer.warnings).toContain("synthesis-validation-failed");
  });

  it("accepts a declared quote contained in one retrieved segment", async () => {
    const valid: GuideSynthesisAdapter = {
      id: "single-segment-quote-test",
      async synthesize(input) {
        const quote = input.excerpts[0].text.slice(0, 40);
        return {
          answer: `The retrieved passage says “${quote}”.`,
          citationIds: [input.allowedCitationIds[0]],
          directQuotes: [quote],
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
  });

  it("rejects an empty synthesized answer even with a valid citation", async () => {
    const invalid: GuideSynthesisAdapter = {
      id: "empty-answer-test",
      async synthesize(input) {
        return {
          answer: "   ",
          citationIds: [input.allowedCitationIds[0]],
          directQuotes: [],
        };
      },
    };
    const answer = await answerGuide(corpus, {
      question: "What is dukkha?",
      language: "en",
      mode: "explain_simple",
      adapter: invalid,
    });
    expect(answer.warnings).toContain("synthesis-validation-failed");
  });
});
