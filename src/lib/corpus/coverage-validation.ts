export interface ExpectedCoverageSource {
  sourceFile: string;
  pitaka: string;
  collection: string;
  workIdentity: string;
  expectedSegmentPresence: boolean;
  canonicalScope: "universally-canonical" | "tradition-dependent";
}

export interface CoverageInventoryRow {
  filename: string;
  includedInVriMulaNavigation: boolean;
  pitaka: string;
  collection: string;
  canonicalScope?: string;
}

export interface CoverageMapping {
  upstreamFile: string;
  canonicalWorkId: string;
  pitaka: string;
  collection: string;
  segmentCount: number;
  checksum: string;
  canonicalStatus: string;
}

export interface CoverageManifestEdition {
  sourceFile: string;
  workId: string;
  pitaka: string;
  collection: string;
  segmentCount: number;
  sha256: string;
  canonicalStatus: string;
}

function fail(message: string): never {
  throw new Error(message);
}

function duplicates(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export function validateCoverageRecords(input: {
  expected: readonly ExpectedCoverageSource[];
  inventory: readonly CoverageInventoryRow[];
  mappings: readonly CoverageMapping[];
  manifest: readonly CoverageManifestEdition[];
}): void {
  const { expected, inventory, mappings, manifest } = input;
  if (!expected.length) fail("Expected VRI Mūla inventory is empty");

  const duplicateExpected = duplicates(expected.map((row) => row.sourceFile));
  if (duplicateExpected.length) fail(`Duplicate expected source: ${duplicateExpected.join(", ")}`);

  const navigationSources = inventory.filter((row) => row.includedInVriMulaNavigation).map((row) => row.filename);
  const expectedNames = new Set(expected.map((row) => row.sourceFile));
  const navigationNames = new Set(navigationSources);
  const missing = expected.filter((row) => !navigationNames.has(row.sourceFile)).map((row) => row.sourceFile);
  if (missing.length) fail(`Missing expected VRI root: ${missing.join(", ")}`);
  const unexpected = navigationSources.filter((source) => !expectedNames.has(source));
  if (unexpected.length) fail(`Unexpected VRI root source: ${unexpected.join(", ")}`);

  const duplicateSources = duplicates(mappings.map((row) => row.upstreamFile));
  if (duplicateSources.length) fail(`Duplicate source mapping: ${duplicateSources.join(", ")}`);
  const duplicateTargets = duplicates(mappings.map((row) => row.canonicalWorkId));
  if (duplicateTargets.length) fail(`Multiple sources mapped to one target: ${duplicateTargets.join(", ")}`);

  for (const expectedRow of expected) {
    const mapping = mappings.find((row) => row.upstreamFile === expectedRow.sourceFile);
    if (!mapping) fail(`Missing source mapping: ${expectedRow.sourceFile}`);
    if (mapping.segmentCount <= 0 && expectedRow.expectedSegmentPresence) fail(`Zero-segment imported volume: ${expectedRow.sourceFile}`);
    if (mapping.pitaka !== expectedRow.pitaka) fail(`Wrong Piṭaka mapping: ${expectedRow.sourceFile}`);
    if (mapping.collection !== expectedRow.collection) fail(`Wrong collection mapping: ${expectedRow.sourceFile}`);
    const expectedStatus = expectedRow.canonicalScope === "tradition-dependent" ? "tradition-dependent" : "canonical";
    if (mapping.canonicalStatus !== expectedStatus) fail(`Wrong canonical classification: ${expectedRow.sourceFile}`);

    const edition = manifest.find((row) => row.sourceFile === `romn/${expectedRow.sourceFile}`);
    if (!edition) fail(`Manifest entry missing for source: ${expectedRow.sourceFile}`);
    if (edition.workId !== mapping.canonicalWorkId) fail(`Manifest target mismatch: ${expectedRow.sourceFile}`);
    if (edition.segmentCount !== mapping.segmentCount) fail(`Manifest segment count mismatch: ${expectedRow.sourceFile}`);
    if (edition.sha256 !== mapping.checksum) fail(`Manifest checksum mismatch: ${expectedRow.sourceFile}`);
    if (edition.pitaka !== mapping.pitaka || edition.collection !== mapping.collection) fail(`Manifest classification mismatch: ${expectedRow.sourceFile}`);
    if (edition.canonicalStatus !== mapping.canonicalStatus) fail(`Manifest canonical status mismatch: ${expectedRow.sourceFile}`);
  }

  const extraMappings = mappings.filter((row) => !expectedNames.has(row.upstreamFile));
  if (extraMappings.length) fail(`Unexpected mapping: ${extraMappings.map((row) => row.upstreamFile).join(", ")}`);
  const expectedManifestSources = new Set(expected.map((row) => `romn/${row.sourceFile}`));
  const extraManifest = manifest.filter((row) => row.canonicalStatus !== "post-canonical" && !expectedManifestSources.has(row.sourceFile));
  if (extraManifest.length) fail(`Unexpected manifest source: ${extraManifest.map((row) => row.sourceFile).join(", ")}`);
}

export interface CoverageAssetPage {
  asset: string;
  expectedSha256: string;
  actualSha256: string;
  segmentIds: string[];
  segmentCount: number;
}

export interface CoverageAssetEdition {
  asset: string;
  expectedSha256: string;
  actualSha256: string;
  segmentCount: number;
  pageCount: number;
  pages: CoverageAssetPage[];
}

export function validateCoverageAssetGraph(input: {
  editions: readonly CoverageAssetEdition[];
  physicalAssets: readonly string[];
}): void {
  const referenced = new Set<string>();
  const segmentIds = new Set<string>();
  for (const edition of input.editions) {
    referenced.add(edition.asset);
    if (!input.physicalAssets.includes(edition.asset)) fail(`Manifest entry without physical asset: ${edition.asset}`);
    if (edition.expectedSha256 !== edition.actualSha256) fail(`Manifest checksum mismatch: ${edition.asset}`);
    if (edition.pageCount !== edition.pages.length) fail(`Page count mismatch: ${edition.asset}`);
    let segmentCount = 0;
    for (const page of edition.pages) {
      referenced.add(page.asset);
      if (!input.physicalAssets.includes(page.asset)) fail(`Manifest entry without physical asset: ${page.asset}`);
      if (page.expectedSha256 !== page.actualSha256) fail(`Page checksum mismatch: ${page.asset}`);
      segmentCount += page.segmentCount;
      for (const id of page.segmentIds) {
        if (segmentIds.has(id)) fail(`Duplicated segment ID: ${id}`);
        segmentIds.add(id);
      }
    }
    if (segmentCount !== edition.segmentCount) fail(`Segment count mismatch: ${edition.asset}`);
  }
  const orphan = input.physicalAssets.find((asset) => !referenced.has(asset));
  if (orphan) fail(`Generated page without manifest entry: ${orphan}`);
}
