import { describe, expect, it } from "vitest";
import { getDailyWisdom } from "../wisdom";
import type { Corpus, DhammaSegment } from "../../corpus/types";

const SOURCE_TEXT =
  "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts. If a man speaks or acts with an evil thought, pain follows him, as the wheel follows the foot of the ox that draws the carriage.";

const seg = (overrides: Partial<DhammaSegment> = {}): DhammaSegment => ({
  id: "s",
  textId: "t",
  segmentUid: "dhp:1",
  segmentOrder: 1,
  language: "en",
  translationText: SOURCE_TEXT,
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

describe("daily wisdom render layer", () => {
  it("always returns a sourced segment and source model", () => {
    const w = getDailyWisdom(corpusOf([seg()]), { date: "2026-07-07" });
    expect(w.segment.sourceRef).toBe("Dhp 1");
    expect(w.item.sourceRef).toBe("Dhp 1");
    expect(w.item.sourceLanguage).toBe("en");
  });

  it("is deterministic for a given date", () => {
    const corpus = corpusOf([
      seg({ id: "a", segmentUid: "dhp:1", translationText: SOURCE_TEXT }),
      seg({ id: "b", segmentUid: "dhp:2", translationText: "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts. If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him." }),
    ]);
    const a = getDailyWisdom(corpus, { date: "2026-07-07", language: "en" });
    const b = getDailyWisdom(corpus, { date: "2026-07-07", language: "ru" });
    expect(a.segment.segmentUid).toBe(b.segment.segmentUid);
  });

  it("changes across different days when multiple curated items are available", () => {
    const corpus = corpusOf([
      seg({ id: "a", segmentUid: "dhp:1", translationText: SOURCE_TEXT }),
      seg({ id: "b", segmentUid: "dhp:2", translationText: "All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts. If a man speaks or acts with a pure thought, happiness follows him, like a shadow that never leaves him." }),
      seg({ id: "c", segmentUid: "dhp:4", translationText: "\"He abused me, he beat me, he defeated me, he robbed me,\"--in those who do not harbour such thoughts hatred will cease." }),
      seg({ id: "d", segmentUid: "dhp:5", translationText: "For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule." }),
    ]);
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const day = `2026-07-${String(d).padStart(2, "0")}`;
      seen.add(getDailyWisdom(corpus, { date: day }).segment.segmentUid);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("renders Russian main wisdom text and disclaimer", () => {
    const w = getDailyWisdom(corpusOf([seg()]), {
      date: "2026-07-07",
      language: "ru",
    });
    expect(w.displayText).toMatch(/[А-Яа-я]/);
    expect(w.disclaimer).toBe("Смысловой перевод приложения. Не канонический текст.");
  });

  it("renders English main wisdom text and disclaimer", () => {
    const w = getDailyWisdom(corpusOf([seg()]), {
      date: "2026-07-07",
      language: "en",
    });
    expect(w.displayText).toContain("What the mind returns to");
    expect(w.disclaimer).toBe("App rendering. Not canonical scripture.");
  });

  it("renders Indonesian main wisdom text and disclaimer", () => {
    const w = getDailyWisdom(corpusOf([seg()]), {
      date: "2026-07-07",
      language: "id",
    });
    expect(w.displayText).toContain("batin");
    expect(w.disclaimer).toBe("Terjemahan makna oleh aplikasi. Bukan teks kanonis.");
  });

  it("keeps the source excerpt unchanged and verbatim", () => {
    const w = getDailyWisdom(corpusOf([seg()]), {
      date: "2026-07-07",
      language: "ru",
    });
    expect(w.item.sourceText).toBe(SOURCE_TEXT);
    expect(w.item.sourceText).toBe(w.segment.translationText);
    expect(w.displayText).not.toBe(SOURCE_TEXT);
  });

  it("homepage and /wisdom can use the same selected-language layer", () => {
    const corpus = corpusOf([seg()]);
    const home = getDailyWisdom(corpus, { date: "2026-07-07", language: "id" });
    const page = getDailyWisdom(corpus, { date: "2026-07-07", language: "id" });
    expect(home.displayText).toBe(page.displayText);
    expect(home.disclaimer).toBe(page.disclaimer);
  });

  it("throws when no curated sourced segment exists", () => {
    expect(() => getDailyWisdom(corpusOf([]), { date: "2026-07-07" })).toThrow();
  });
});
