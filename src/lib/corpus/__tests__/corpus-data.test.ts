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

import { describe, expect, it } from "vitest";
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
