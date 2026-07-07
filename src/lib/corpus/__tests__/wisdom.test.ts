import { describe, expect, it } from "vitest";
import { getDailyWisdom } from "../wisdom";
import type { Corpus, DhammaSegment } from "../../corpus/types";

const seg = (overrides: Partial<DhammaSegment> = {}): DhammaSegment => ({
  id: "s",
  textId: "t",
  segmentUid: "dhp:1.1",
  segmentOrder: 1,
  language: "en",
  translationText: "All that we are is the result of what we have thought.",
  sourceRef: "Dhp 1",
  license: "Public Domain",
  provider: "manual",
  ...overrides,
});

const corpusOf = (segments: DhammaSegment[]): Corpus => ({
  works: [
    {
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
    },
  ],
  texts: [{ id: "t", workId: "w", uid: "dhp", slug: "dhammapada", title: "Dhammapada" }],
  segments,
});

describe("daily wisdom (ТЗ §9 Phase G #9)", () => {
  it("ALWAYS returns a sourced segment", () => {
    const corpus = corpusOf([seg()]);
    const w = getDailyWisdom(corpus, { date: "2026-07-07" });
    expect(w.segment.sourceRef).toBeTruthy();
    expect(w.segment.sourceRef.length).toBeGreaterThan(0);
  });

  it("is deterministic for a given (date, language)", () => {
    const corpus = corpusOf([
      seg({ id: "a", segmentUid: "dhp:1.1", translationText: "verse one is short" }),
      seg({ id: "b", segmentUid: "dhp:1.2", translationText: "verse two is short" }),
    ]);
    const a = getDailyWisdom(corpus, { date: "2026-07-07" });
    const b = getDailyWisdom(corpus, { date: "2026-07-07" });
    expect(a.segment.segmentUid).toBe(b.segment.segmentUid);
  });

  it("changes across different days", () => {
    const corpus = corpusOf([
      seg({ id: "a", segmentUid: "dhp:1.1", translationText: "verse one" }),
      seg({ id: "b", segmentUid: "dhp:1.2", translationText: "verse two" }),
      seg({ id: "c", segmentUid: "dhp:1.3", translationText: "verse three" }),
      seg({ id: "d", segmentUid: "dhp:1.4", translationText: "verse four" }),
    ]);
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const day = `2026-07-${String(d).padStart(2, "0")}`;
      seen.add(getDailyWisdom(corpus, { date: day }).segment.segmentUid);
    }
    // over a month we should hit more than one verse
    expect(seen.size).toBeGreaterThan(1);
  });

  it("reflection is explicitly marked as not scripture", () => {
    const corpus = corpusOf([seg()]);
    const w = getDailyWisdom(corpus, { date: "2026-07-07" });
    expect(w.shortReflection.toLowerCase()).toContain("not scripture");
  });

  it("throws when no eligible segment exists (never ships unsourced wisdom)", () => {
    const corpus = corpusOf([]);
    expect(() => getDailyWisdom(corpus, { date: "2026-07-07" })).toThrow();
  });
});
