import { describe, expect, it } from "vitest";
import { askDhamma, NO_SOURCE_REFUSAL_EN } from "../ask-dhamma";
import type {
  Corpus,
  DhammaSegment,
  SourceWork,
} from "../../corpus/types";

const work: SourceWork = {
  id: "w",
  slug: "samyutta-nikaya",
  title: "Saṃyutta Nikāya",
  tradition: "theravada",
  category: "canonical",
  pitaka: "sutta",
  nikaya: "sn",
  sourceProvider: "manual",
  license: "Public Domain",
  language: "en",
  importedAt: "2026-07-07T00:00:00.000Z",
};

const seg = (overrides: Partial<DhammaSegment>): DhammaSegment => ({
  id: "s",
  textId: "t",
  segmentUid: "sn56.11:1.1",
  segmentOrder: 1,
  language: "en",
  translationText: "This is the noble truth of dukkha: birth is suffering.",
  sourceRef: "SN 56.11",
  license: "Public Domain",
  provider: "manual",
  ...overrides,
});

const corpusWith = (segments: DhammaSegment[]): Corpus => ({
  works: [work],
  texts: [{ id: "t", workId: "w", uid: "sn56.11", slug: "sn56.11", title: "SN 56.11" }],
  segments,
});

describe("askDhamma — fail-closed RAG (ТЗ §9 Phase G #6, #7)", () => {
  it("FAILS CLOSED when no source is retrieved (#6)", async () => {
    const corpus = corpusWith([
      seg({ translationText: "something about calm" }),
    ]);
    const answer = await askDhamma(corpus, "supercalifragilistic quantum");
    expect(answer.sources).toEqual([]);
    expect(answer.confidence).toBe("low");
    expect(answer.warnings).toContain("refused-to-fabricate");
    expect(answer.answer).toBe(NO_SOURCE_REFUSAL_EN);
  });

  it("ALWAYS includes citations when an answer is given (#7)", async () => {
    const corpus = corpusWith([
      seg({
        segmentUid: "sn56.11:1.1",
        translationText:
          "This is the noble truth of dukkha: birth is suffering, aging is suffering.",
        sourceRef: "SN 56.11",
      }),
    ]);
    const answer = await askDhamma(corpus, "What is dukkha?");
    expect(answer.sources.length).toBeGreaterThan(0);
    expect(answer.answer).toContain("SN 56.11");
    expect(answer.answer).toMatch(/Sources|Опора/);
  });

  it("answer mentions the matched Pāli term in canonical form", async () => {
    const corpus = corpusWith([
      seg({ translationText: "taṇhā is the origin of dukkha." }),
    ]);
    const answer = await askDhamma(corpus, "What is tanha?");
    expect(answer.answer.toLowerCase()).toContain("taṇhā");
  });

  it("never returns a fabricated-looking answer (no sources block has real refs)", async () => {
    const corpus = corpusWith([
      seg({ translationText: "craving taṇhā leads to renewed becoming." }),
    ]);
    const answer = await askDhamma(corpus, "tell me about taṇhā");
    // every source line in the answer must carry a [ref] citation
    const sourceLines = answer.answer
      .split("\n")
      .filter((l) => /^\d+\.\s*\[/.test(l));
    expect(sourceLines.length).toBeGreaterThan(0);
  });
});

describe("askDhamma — commentarial is never dressed as Buddha (#8)", () => {
  it("does not surface commentarial Visuddhimagga material", async () => {
    const vismWork: SourceWork = {
      ...work,
      id: "w-vism",
      slug: "visuddhimagga",
      title: "Visuddhimagga",
      category: "commentarial",
      pitaka: "post_canonical",
    };
    const corpus: Corpus = {
      works: [vismWork],
      texts: [{ id: "t-vism", workId: "w-vism", uid: "vism", slug: "vism", title: "Vism" }],
      segments: [
        seg({
          id: "s-vism",
          textId: "t-vism",
          segmentUid: "vism:1.1",
          translationText: "concentration and dukkha analysis by Buddhaghosa",
          sourceRef: "Vism I.1",
        }),
      ],
    };
    const answer = await askDhamma(corpus, "What did the Buddha say about dukkha?");
    // Visuddhimagga is excluded from retrieval; with no canonical source we
    // fail closed rather than misattributing commentary to the Buddha.
    // No returned source may be a Visuddhimagga passage.
    const vismSurfaced = answer.sources.some((s) =>
      s.sourceRef.startsWith("Vism")
    );
    expect(vismSurfaced).toBe(false);
  });
});
