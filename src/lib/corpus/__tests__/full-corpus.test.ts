import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../../../..");

function json<T>(relative: string): T {
  return JSON.parse(readFileSync(join(ROOT, relative), "utf8")) as T;
}

describe("full Chaṭṭha Saṅgāyana corpus gates", () => {
  const coverage = json<{
    expectedWorks: number;
    importedWorks: number;
    missingWorks: string[];
    duplicateMappings: string[];
    unknownFiles: string[];
    canonicalSegmentCount: number;
    pitakaSegmentCounts: Record<string, number>;
    fullVriMulaNavigationImported: boolean;
    universalTipitakaCompletenessClaim: boolean;
    universallyCanonicalWorks: number;
    traditionDependentWorks: number;
    visuddhimagga: { importedVolumes: number; segmentCount: number; canonicalStatus: string };
  }>("data/corpus/full-canon-coverage.json");

  it("proves every expected VRI Mūla source without claiming universal completeness", () => {
    expect(coverage.expectedWorks).toBe(61);
    expect(coverage.importedWorks).toBe(coverage.expectedWorks);
    expect(coverage.missingWorks).toEqual([]);
    expect(coverage.duplicateMappings).toEqual([]);
    expect(coverage.unknownFiles).toEqual([]);
    expect(coverage.universallyCanonicalWorks).toBe(59);
    expect(coverage.traditionDependentWorks).toBe(2);
    expect(coverage.fullVriMulaNavigationImported).toBe(true);
    expect(coverage.universalTipitakaCompletenessClaim).toBe(false);
  });

  it("contains substantial text in Vinaya, Sutta, and Abhidhamma", () => {
    expect(coverage.canonicalSegmentCount).toBeGreaterThan(1_000);
    expect(coverage.pitakaSegmentCounts.vinaya).toBeGreaterThan(0);
    expect(coverage.pitakaSegmentCounts.sutta).toBeGreaterThan(0);
    expect(coverage.pitakaSegmentCounts.abhidhamma).toBeGreaterThan(0);
  });

  it("keeps Visuddhimagga imported and post-canonical", () => {
    expect(coverage.visuddhimagga.importedVolumes).toBe(2);
    expect(coverage.visuddhimagga.segmentCount).toBeGreaterThan(0);
    expect(coverage.visuddhimagga.canonicalStatus).toBe("post-canonical");
  });
});

describe("multilingual corpus provenance", () => {
  it("expands English far beyond the seed corpus with aligned CC0 editions", () => {
    const coverage = json<{ importedWorks: number; importedSegments: number; licenseName: string }>("data/corpus/bilara-en-coverage.json");
    expect(coverage.importedWorks).toBeGreaterThan(8);
    expect(coverage.importedSegments).toBeGreaterThan(1_000);
    expect(coverage.licenseName).toContain("CC0");
  });

  it("retains only the five verified Russian seed editions", () => {
    const metadata = json<{ claims: { russianSeedEditions: number; russianSeedSegments: number; russianBulkImport: string } }>("data/corpus/coverage.json");
    expect(metadata.claims.russianSeedEditions).toBe(5);
    expect(metadata.claims.russianSeedSegments).toBeGreaterThan(0);
    expect(metadata.claims.russianBulkImport).toContain("excluded");
    expect(() => readFileSync(join(ROOT, "data/corpus/theravada-ru-coverage.json"), "utf8")).toThrow();
  });
});

describe("reader and search boundaries", () => {
  it("indexes the required reader routes and the real Visuddhimagga assets", () => {
    const routes = json<Record<string, { canonicalStatus: string; asset?: string; assets?: string[] }>>("data/corpus/vri-reader-index.json");
    for (const route of ["mn1", "mn10", "mn152", "dn1", "dn34", "visuddhimagga"]) expect(routes[route]).toBeDefined();
    expect(routes.visuddhimagga.canonicalStatus).toBe("post-canonical");
    expect(routes.visuddhimagga.assets).toHaveLength(2);
    expect(routes.s0518m.canonicalStatus).toBe("tradition-dependent");
    expect(routes.s0520m.canonicalStatus).toBe("tradition-dependent");
  });

  it("keeps the protected BPS English Visuddhimagga out of corpus manifests", () => {
    const pali = readFileSync(join(ROOT, "data/corpus/full-corpus-manifest.json"), "utf8");
    const english = readFileSync(join(ROOT, "data/corpus/bilara-en-manifest.json"), "utf8");
    expect(`${pali}\n${english}`).not.toMatch(/Ñāṇamoli.*BPS|BPS.*Ñāṇamoli/i);
  });

  it("builds language-specific search shards", () => {
    const manifest = json<{ shards: Array<{ language: string; collection: string }> }>("data/corpus/full-search-manifest.json");
    expect(manifest.shards.some((shard) => shard.language === "pli")).toBe(true);
    expect(manifest.shards.some((shard) => shard.language === "en")).toBe(true);
    expect(manifest.shards.some((shard) => shard.language === "ru")).toBe(true);
  });
});
