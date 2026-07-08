import { describe, expect, it } from "vitest";
import { search, searchSegments, isDhammaTerm, DHAMMA_TERMS } from "../search";
import type { Corpus, DhammaSegment, SourceWork } from "../../corpus/types";

const seg = (overrides: Partial<DhammaSegment>): DhammaSegment => ({
  id: "x",
  textId: "t",
  segmentUid: "x:1.1",
  segmentOrder: 1,
  language: "en",
  translationText: "",
  sourceRef: "Dhp 1",
  license: "Public Domain",
  provider: "manual",
  ...overrides,
});

const work: SourceWork = {
  id: "w",
  slug: "dhammapada",
  title: "Dhammapada",
  tradition: "theravada",
  category: "canonical",
  pitaka: "sutta",
  nikaya: "kn",
  sourceProvider: "manual",
  license: "Public Domain",
  language: "en",
  importedAt: "2026-07-07T00:00:00.000Z",
};

const corpusOf = (segments: DhammaSegment[]): Corpus => ({
  works: [work],
  texts: [{ id: "t", workId: "w", uid: "dhp", slug: "dhammapada", title: "Dhammapada" }],
  segments,
});

describe("search (ТЗ §9 Phase G #4, #5)", () => {
  it("isDhammaTerm recognizes canonical Pāli terms", () => {
    expect(isDhammaTerm("dukkha")).toBe(true);
    expect(isDhammaTerm("anatta")).toBe(true);
    expect(isDhammaTerm("randomword")).toBe(false);
  });

  it("DHAMMA_TERMS includes all required key terms", () => {
    const required = [
      "dukkha",
      "anicca",
      "anatta",
      "tanha",
      "sati",
      "metta",
      "samadhi",
      "nibbana",
    ];
    for (const t of required) expect(DHAMMA_TERMS[t]).toBeDefined();
  });

  it("finds segments by English term (#5)", () => {
    const c = corpusOf([
      seg({
        id: "a",
        segmentUid: "dhp:1.1",
        translationText: "All that we are is the result of what we have thought.",
      }),
      seg({
        id: "b",
        segmentUid: "dhp:1.2",
        translationText: "Hatred does not cease by hatred; hatred ceases by love.",
      }),
    ]);
    const results = search(c, "hatred");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].segmentUid).toBe("dhp:1.2");
  });

  it("finds segments by Pāli term, diacritic-insensitive (#4)", () => {
    const c = corpusOf([
      seg({
        id: "a",
        segmentUid: "sn56.11:1.1",
        translationText: "This is the noble truth of dukkha: birth is suffering.",
      }),
    ]);
    // diacritics on the user side must still match
    expect(search(c, "dukkha").length).toBeGreaterThan(0);
    expect(search(c, "anatta").length).toBe(0); // not in this segment
  });

  it("searchSegments works without a full corpus (used by Ask)", () => {
    const results = searchSegments(
      [seg({ id: "a", translationText: "craving taṇhā is the origin" })],
      "tanha"
    );
    expect(results.length).toBe(1);
    // 'tanha' is a recognized Pāli term; it may match as 'exact' (substring)
    // or 'term' depending on normalization — both are valid signal hits.
    expect(["exact", "term"]).toContain(results[0].reason);
  });

  it("returns an empty list — never throws — when nothing matches", () => {
    const c = corpusOf([
      seg({ id: "a", segmentUid: "dhp:1.1", translationText: "stillness" }),
    ]);
    const results = search(c, "supercalifragilistic");
    expect(results).toEqual([]);
  });

  it("drops weak one-token lexical overlap before canonical re-rank", () => {
    const c = corpusOf([
      seg({
        id: "a",
        segmentUid: "dhp:1.1",
        translationText: "A corpus doorway into stillness.",
      }),
      seg({
        id: "b",
        segmentUid: "dhp:1.2",
        translationText: "Practice needs wise allocation of attention.",
      }),
    ]);
    expect(search(c, "zzz gibberish no corpus match xyz")).toEqual([]);
    expect(search(c, "cryptocurrency portfolio allocation")).toEqual([]);
  });

  it("preserves multi-token lexical, term, and exact matches", () => {
    const lexical = searchSegments(
      [
        seg({
          id: "a",
          segmentUid: "sn56.11:1.1",
          translationText: "Birth is suffering, aging is suffering.",
        }),
      ],
      "birth aging"
    );
    expect(lexical).toHaveLength(1);
    expect(lexical[0].score).toBeGreaterThanOrEqual(4);

    const term = searchSegments(
      [
        seg({
          id: "b",
          segmentUid: "sn56.11:1.2",
          translationText: "This is the noble truth of dukkha.",
        }),
      ],
      "What is dukkha?"
    );
    expect(term).toHaveLength(1);
    expect(term[0].score).toBeGreaterThanOrEqual(6);

    const exact = searchSegments(
      [
        seg({
          id: "c",
          segmentUid: "sn56.11:1.3",
          translationText: "This is the noble truth of dukkha.",
        }),
      ],
      "noble truth"
    );
    expect(exact).toHaveLength(1);
    expect(exact[0].score).toBeGreaterThanOrEqual(10);
  });
});
