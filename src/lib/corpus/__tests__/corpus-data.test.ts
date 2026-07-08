/**
 * Corpus-integration tests against the regenerated data/corpus/*.json.
 *
 * These load the ACTUAL committed corpus (the output of `npm run ingest:bilara`)
 * and assert the OneShot §7 invariants that depend on real ingested data:
 *   #6 Visuddhimagga still absent
 *   #7 temporary SN 56.11 working explanation fully removed
 *   #8 search returns results for the key Pāli terms
 * These run without network — they read JSON from disk.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Corpus,
  DhammaSegment,
  DhammaText,
  SourceWork,
} from "../../corpus/types";
import { search, isDhammaTerm } from "../search";

const CORPUS_DIR = path.resolve(process.cwd(), "data", "corpus");

async function loadCorpus(): Promise<Corpus> {
  const [works, texts, segments] = await Promise.all([
    fs.readFile(path.join(CORPUS_DIR, "works.json"), "utf8"),
    fs.readFile(path.join(CORPUS_DIR, "texts.json"), "utf8"),
    fs.readFile(path.join(CORPUS_DIR, "segments.json"), "utf8"),
  ]);
  return {
    works: JSON.parse(works) as SourceWork[],
    texts: JSON.parse(texts) as DhammaText[],
    segments: JSON.parse(segments) as DhammaSegment[],
  };
}

describe("regenerated corpus (OneShot §7 #6, #7)", () => {
  let corpus: Corpus;
  it("loads from disk", async () => {
    corpus = await loadCorpus();
    expect(corpus.segments.length).toBeGreaterThan(100);
  });

  it("#6 Visuddhimagga is schema-only — no segments (OneShot §7 #6)", async () => {
    corpus = await loadCorpus();
    const vismWorks = new Set(
      corpus.works
        .filter((w) => w.slug === "visuddhimagga" || w.slug === "vism")
        .map((w) => w.id)
    );
    const vismTextIds = new Set(
      corpus.texts.filter((t) => vismWorks.has(t.workId)).map((t) => t.id)
    );
    const vismSegs = corpus.segments.filter((s) => vismTextIds.has(s.textId));
    expect(vismSegs.length).toBe(0);
  });

  it("#7 no segment references the old SN 56.11 working explanation", async () => {
    corpus = await loadCorpus();
    const offending = corpus.segments.filter(
      (s) =>
        typeof s.translator === "string" &&
        s.translator.toLowerCase().includes("working explanation")
    );
    expect(offending).toEqual([]);
  });

  it("SN 56.11 translated segments are real Sujato CC0", async () => {
    corpus = await loadCorpus();
    const sn = corpus.segments.filter((s) => s.textId === "text-sn56.11");
    expect(sn.length).toBeGreaterThan(0);
    // segments that carry a translation MUST be CC0/Sujato/bilara.
    // Pāli-root-only segments legitimately fall back to Public Domain.
    const translated = sn.filter((s) => typeof s.translationText === "string");
    expect(translated.length).toBeGreaterThan(0);
    for (const s of translated) {
      expect(s.license).toBe("CC0 1.0 Universal (CC0 1.0)");
      expect(s.translator).toBe("Bhikkhu Sujato");
      expect(s.provider).toBe("bilara");
    }
    // any non-translated segment is Public Domain root-only
    for (const s of sn.filter((s) => !s.translationText)) {
      expect(s.license).toBe("Public Domain");
    }
  });

  it("all 8 target texts are present", async () => {
    corpus = await loadCorpus();
    const uids = new Set(corpus.texts.map((t) => t.uid));
    const targets = ["mn10", "mn118", "dn31", "an3.65", "sn56.11", "snp1.8", "snp2.1", "snp2.4"];
    for (const u of targets) expect(uids.has(u)).toBe(true);
  });

  it("imports only the five verified published CC0 Russian translations", async () => {
    corpus = await loadCorpus();
    const expected = new Set(["mn10", "mn118", "dn31", "sn56.11", "snp1.8"]);
    for (const text of corpus.texts) {
      const segments = corpus.segments.filter((segment) => segment.textId === text.id);
      const russian = segments.flatMap((segment) => segment.translations?.ru ?? []);
      if (expected.has(text.uid)) {
        expect(russian.length).toBeGreaterThan(0);
        for (const translation of russian) {
          expect(translation.language).toBe("ru");
          expect(translation.license).toBe("CC0 1.0 Universal (CC0 1.0)");
          expect(translation.provider).toBe("bilara");
          expect(translation.published).toBe(true);
          expect(translation.sourcePath).toMatch(/^translation\/ru\//);
        }
      } else {
        expect(russian).toEqual([]);
      }
    }
  });

  it("does not fabricate or import unavailable Indonesian translations", async () => {
    corpus = await loadCorpus();
    expect(corpus.segments.some((segment) => segment.translations?.id)).toBe(false);
  });
});

describe("search returns results for key Pāli terms (OneShot §7 #8)", () => {
  let corpus: Corpus;
  it("loads", async () => {
    corpus = await loadCorpus();
  });

  const terms = ["dukkha", "anicca", "anatta", "metta", "sati", "tanha"];
  for (const term of terms) {
    it(`finds results for "${term}"`, async () => {
      corpus = await loadCorpus();
      expect(isDhammaTerm(term)).toBe(true);
      const results = search(corpus, term, { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      // every result carries a real sourceRef
      for (const r of results) {
        expect(r.sourceRef.length).toBeGreaterThan(0);
      }
    });
  }

  it("does not throw on an unmatched query", async () => {
    corpus = await loadCorpus();
    expect(search(corpus, "supercalifragilisticexpialidocious")).toEqual([]);
  });

  it("returns NO results for an off-topic question (anti-hallucination guard)", async () => {
    // A question the corpus cannot support must retrieve nothing, so that
    // askDhamma fails closed rather than matching on filler words like
    // "buddha"/"said" ubiquitous in framing segments.
    corpus = await loadCorpus();
    expect(
      search(corpus, "What did the Buddha say about cryptocurrency portfolio allocation?")
    ).toEqual([]);
    expect(search(corpus, "alien invasion mars negotiation tactics")).toEqual([]);
  });
});

describe("Pass #2 Dhammapada integration (OneShot #6-#10)", () => {
  let corpus: Corpus;
  beforeAll(async () => {
    corpus = await loadCorpus();
  });

  it("#6 Reader can load Dhammapada (text + ≥423 verses present)", () => {
    const dhpText = corpus.texts.find((t) => t.id === "text-dhp");
    expect(dhpText).toBeDefined();
    const dhpSegs = corpus.segments.filter((s) => s.textId === "text-dhp");
    expect(dhpSegs.length).toBe(423);
  });

  it("#7 search returns Dhammapada results for common terms", () => {
    // "hatred" appears in Dhp 1-5 (Yamaka-vagga); a classic Dhammapada topic.
    const results = search(corpus, "hatred", { limit: 20 });
    const dhpHits = results.filter((r) => r.textId === "text-dhp");
    expect(dhpHits.length).toBeGreaterThan(0);
  });

  it("search returns Dhammapada results for 'mind' / 'thought'", () => {
    const mind = search(corpus, "mind", { limit: 20 }).filter((r) => r.textId === "text-dhp");
    expect(mind.length).toBeGreaterThan(0);
  });

  it("#8 daily wisdom can select from Dhammapada", async () => {
    const { getDailyWisdom } = await import("../wisdom");
    // sample several days to find one that lands on a Dhammapada verse
    const picked = new Set<string>();
    for (let d = 1; d <= 60; d++) {
      const day = `2026-07-${String(d).padStart(2, "0")}`;
      const w = getDailyWisdom(corpus, { date: day });
      picked.add(w.segment.textId);
    }
    expect(picked.has("text-dhp")).toBe(true);
  });

  it("#9 Ask Dhamma cites sources for a supported question", async () => {
    const { askDhamma } = await import("../../ai/ask-dhamma");
    const ans = await askDhamma(corpus, "What does the Dhammapada say about hatred and mind?");
    expect(ans.sources.length).toBeGreaterThan(0);
    expect(/\[.*\]/.test(ans.answer)).toBe(true);
  });

  it("#10 unsupported questions still fail closed", async () => {
    const { askDhamma } = await import("../../ai/ask-dhamma");
    // Use a query with NO content overlap with the corpus (no shared
    // content-bearing tokens), so retrieval returns nothing. Note: common
    // English words like "best"/"buy" legitimately appear in Müller's verses,
    // so those would be real lexical hits, not a fail-closed violation.
    const ans = await askDhamma(corpus, "supercalifragilistic quantum blockchain portfolio");
    expect(ans.sources).toEqual([]);
    expect(ans.confidence).toBe("low");
    expect(ans.warnings).toContain("refused-to-fabricate");
  });
});
