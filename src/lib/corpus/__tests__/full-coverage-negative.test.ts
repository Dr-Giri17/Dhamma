import { describe, expect, it } from "vitest";
import {
  validateCoverageAssetGraph,
  validateCoverageRecords,
  type CoverageAssetEdition,
  type CoverageInventoryRow,
  type CoverageManifestEdition,
  type CoverageMapping,
  type ExpectedCoverageSource,
} from "../coverage-validation";

function records() {
  const expected: ExpectedCoverageSource[] = [{
    sourceFile: "s0101m.mul.xml",
    pitaka: "sutta",
    collection: "dn",
    workIdentity: "s0101m",
    expectedSegmentPresence: true,
    canonicalScope: "universally-canonical",
  }];
  const inventory: CoverageInventoryRow[] = [{
    filename: "s0101m.mul.xml",
    includedInVriMulaNavigation: true,
    pitaka: "sutta",
    collection: "dn",
    canonicalScope: "universally-canonical",
  }];
  const mappings: CoverageMapping[] = [{
    upstreamFile: "s0101m.mul.xml",
    canonicalWorkId: "work-vri-s0101m",
    pitaka: "sutta",
    collection: "dn",
    segmentCount: 10,
    checksum: "index-a",
    canonicalStatus: "canonical",
  }];
  const manifest: CoverageManifestEdition[] = [{
    sourceFile: "romn/s0101m.mul.xml",
    workId: "work-vri-s0101m",
    pitaka: "sutta",
    collection: "dn",
    segmentCount: 10,
    sha256: "index-a",
    canonicalStatus: "canonical",
  }];
  return { expected, inventory, mappings, manifest };
}

function assets(): { editions: CoverageAssetEdition[]; physicalAssets: string[] } {
  return {
    editions: [{
      asset: "/corpus/pli/dn/index.json.gz",
      expectedSha256: "index-a",
      actualSha256: "index-a",
      segmentCount: 2,
      pageCount: 1,
      pages: [{
        asset: "/corpus/pli/dn/page-0001.json.gz",
        expectedSha256: "page-a",
        actualSha256: "page-a",
        segmentIds: ["seg-1", "seg-2"],
        segmentCount: 2,
      }],
    }],
    physicalAssets: ["/corpus/pli/dn/index.json.gz", "/corpus/pli/dn/page-0001.json.gz"],
  };
}

describe("full coverage fails closed", () => {
  it("rejects a missing expected VRI root", () => {
    const value = records();
    value.inventory = [];
    expect(() => validateCoverageRecords(value)).toThrow(/Missing expected VRI root/);
  });

  it("rejects an unexpected root source", () => {
    const value = records();
    value.inventory.push({ ...value.inventory[0], filename: "unexpected.mul.xml" });
    expect(() => validateCoverageRecords(value)).toThrow(/Unexpected VRI root source/);
  });

  it("rejects duplicate source mappings", () => {
    const value = records();
    value.mappings.push({ ...value.mappings[0], canonicalWorkId: "other" });
    expect(() => validateCoverageRecords(value)).toThrow(/Duplicate source mapping/);
  });

  it("rejects two sources mapped to one target", () => {
    const value = records();
    value.expected.push({ ...value.expected[0], sourceFile: "s0102m.mul.xml", workIdentity: "s0102m" });
    value.inventory.push({ ...value.inventory[0], filename: "s0102m.mul.xml" });
    value.mappings.push({ ...value.mappings[0], upstreamFile: "s0102m.mul.xml" });
    value.manifest.push({ ...value.manifest[0], sourceFile: "romn/s0102m.mul.xml" });
    expect(() => validateCoverageRecords(value)).toThrow(/Multiple sources mapped to one target/);
  });

  it("rejects a zero-segment volume", () => {
    const value = records();
    value.mappings[0].segmentCount = 0;
    expect(() => validateCoverageRecords(value)).toThrow(/Zero-segment imported volume/);
  });

  it("rejects a wrong Piṭaka or collection", () => {
    const value = records();
    value.mappings[0].pitaka = "vinaya";
    expect(() => validateCoverageRecords(value)).toThrow(/Wrong Piṭaka mapping/);
  });

  it("rejects tradition-dependent content marked universally canonical", () => {
    const value = records();
    value.expected[0].canonicalScope = "tradition-dependent";
    expect(() => validateCoverageRecords(value)).toThrow(/Wrong canonical classification/);
  });

  it("rejects an empty expected inventory", () => {
    const value = records();
    value.expected = [];
    expect(() => validateCoverageRecords(value)).toThrow(/inventory is empty/);
  });

  it("rejects manifest and page checksum mismatches", () => {
    const value = assets();
    value.editions[0].pages[0].actualSha256 = "corrupt";
    expect(() => validateCoverageAssetGraph(value)).toThrow(/Page checksum mismatch/);
  });

  it("rejects a manifest entry without a physical asset", () => {
    const value = assets();
    value.physicalAssets.pop();
    expect(() => validateCoverageAssetGraph(value)).toThrow(/without physical asset/);
  });

  it("rejects an orphan generated page", () => {
    const value = assets();
    value.physicalAssets.push("/corpus/pli/orphan.json.gz");
    expect(() => validateCoverageAssetGraph(value)).toThrow(/without manifest entry/);
  });

  it("rejects duplicated segment IDs", () => {
    const value = assets();
    value.editions[0].pages[0].segmentIds = ["seg-1", "seg-1"];
    expect(() => validateCoverageAssetGraph(value)).toThrow(/Duplicated segment ID/);
  });

  it("recalculates page and segment counts", () => {
    const value = assets();
    value.editions[0].segmentCount = 3;
    expect(() => validateCoverageAssetGraph(value)).toThrow(/Segment count mismatch/);
  });
});
