import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { EXPECTED_VRI_MULA_SOURCES } from "./vri-expected";
import { validateCoverageRecords, type CoverageMapping, type CoverageManifestEdition, type CoverageInventoryRow } from "../../src/lib/corpus/coverage-validation";

const ROOT = resolve(import.meta.dirname, "../..");
const REQUIRED_SEGMENT_FIELDS = [
  "id", "workId", "textId", "segmentUid", "sourceRef", "language", "text",
  "canonicalStatus", "sourceRevision", "sourceFile", "sourceUrl", "licenseName",
  "attribution", "sha256",
] as const;

function json<T>(relative: string): T {
  return JSON.parse(readFileSync(join(ROOT, relative), "utf8")) as T;
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assetPath(asset: string): string {
  return join(ROOT, "public", asset.replace(/^\//, ""));
}

function decodedJson<T>(asset: string, bytes: Buffer): T {
  const decoded = asset.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8");
  return JSON.parse(decoded) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function allFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...allFiles(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

const referencedAssets = new Set<string>();
const globalSegmentIds = new Set<string>();

function validatePagedEdition(edition: { asset: string; sha256: string; contentSha256?: string; segmentCount: number }, expectedLanguage: string, expectedStatus?: string): number {
  const indexFile = assetPath(edition.asset);
  referencedAssets.add(indexFile);
  assert(existsSync(indexFile), `Missing edition index ${edition.asset}`);
  const indexBytes = readFileSync(indexFile);
  assert(sha256(indexBytes) === edition.sha256, `Index checksum mismatch ${edition.asset}`);
  const indexContent = gunzipSync(indexBytes);
  if (edition.contentSha256) assert(sha256(indexContent) === edition.contentSha256, `Index content checksum mismatch ${edition.asset}`);
  const index = decodedJson<{ pages: Array<{ asset: string; sha256: string; contentSha256?: string }>; pageCount: number; segmentCount: number; segments?: Array<Record<string, unknown>> }>(edition.asset, indexBytes);
  assert(index.segmentCount === edition.segmentCount, `Segment count mismatch ${edition.asset}`);
  assert(index.pageCount === index.pages.length, `Page count mismatch ${edition.asset}`);
  let count = 0;
  const validateSegments = (segments: Array<Record<string, unknown>>, source: string) => {
    for (const segment of segments) {
      for (const field of REQUIRED_SEGMENT_FIELDS) assert(segment[field] !== undefined && segment[field] !== "", `${source} segment missing ${field}`);
      assert(segment.language === expectedLanguage, `${source} language mismatch`);
      if (expectedStatus) assert(segment.canonicalStatus === expectedStatus, `${source} canonical status mismatch`);
      assert(sha256(String(segment.text)) === segment.sha256, `${source} text checksum mismatch`);
      const segmentId = String(segment.id);
      assert(!globalSegmentIds.has(segmentId), `Duplicated segment ID ${segmentId}`);
      globalSegmentIds.add(segmentId);
      if (expectedLanguage === "en") assert(!/<\/?[a-z][^>]*>/i.test(String(segment.text)), `${source} contains literal HTML`);
    }
    count += segments.length;
  };
  if (index.segments) validateSegments(index.segments, edition.asset);
  for (const page of index.pages) {
    const pageFile = assetPath(page.asset);
    referencedAssets.add(pageFile);
    assert(existsSync(pageFile), `Missing page ${page.asset}`);
    const bytes = readFileSync(pageFile);
    assert(sha256(bytes) === page.sha256, `Page checksum mismatch ${page.asset}`);
    if (page.contentSha256) assert(sha256(gunzipSync(bytes)) === page.contentSha256, `Page content checksum mismatch ${page.asset}`);
    const payload = decodedJson<{ segments: Array<Record<string, unknown>> }>(page.asset, bytes);
    validateSegments(payload.segments, page.asset);
  }
  assert(count === edition.segmentCount, `Paged segment total mismatch ${edition.asset}`);
  return count;
}

const coverage = json<{
  expectedWorks: number;
  mappedWorks: number;
  importedWorks: number;
  missingWorks: string[];
  duplicateMappings: string[];
  unknownFiles: string[];
  canonicalSegmentCount: number;
  pitakaSegmentCounts: Record<string, number>;
  visuddhimagga: { importedVolumes: number; segmentCount: number; canonicalStatus: string };
  universallyCanonicalWorks: number;
  traditionDependentWorks: number;
  traditionDependentSegmentCount: number;
  fullVriMulaNavigationImported: boolean;
  universalTipitakaCompletenessClaim: boolean;
}>("data/corpus/full-canon-coverage.json");
assert(coverage.expectedWorks === EXPECTED_VRI_MULA_SOURCES.length, "Expected VRI Mūla boundary changed without review");
assert(coverage.mappedWorks === coverage.expectedWorks && coverage.importedWorks === coverage.expectedWorks, "Not all canonical volumes are mapped/imported");
assert(coverage.missingWorks.length === 0, "Canonical volumes are missing");
assert(coverage.duplicateMappings.length === 0, "Duplicate canonical mappings exist");
assert(coverage.unknownFiles.length === 0, "Unknown .mul files block coverage");
assert(Object.values(coverage.pitakaSegmentCounts).every((count) => count > 0), "Every Piṭaka must contain text");
assert(coverage.fullVriMulaNavigationImported, "fullVriMulaNavigationImported may only be true after the full gate passes");
assert(coverage.universalTipitakaCompletenessClaim === false, "Universal Tipiṭaka completeness must not be claimed");

const vriInventory = json<{ rows: CoverageInventoryRow[] }>("data/corpus/upstream/vri-inventory.json");
const vriMappings = json<CoverageMapping[]>("data/corpus/full-canon-map.json");
const vriManifest = json<{ editions: Array<CoverageManifestEdition & { asset: string; contentSha256?: string; language: string }> }>("data/corpus/full-corpus-manifest.json");
validateCoverageRecords({
  expected: EXPECTED_VRI_MULA_SOURCES,
  inventory: vriInventory.rows,
  mappings: vriMappings.filter((row) => row.canonicalStatus !== "post-canonical"),
  manifest: vriManifest.editions,
});
let canonicalSegments = 0;
let traditionDependentSegments = 0;
let vismSegments = 0;
for (const edition of vriManifest.editions) {
  assert(edition.language === "pli", "VRI assets must contain Pāli only");
  const count = validatePagedEdition(edition, "pli", edition.canonicalStatus);
  if (edition.canonicalStatus === "canonical") canonicalSegments += count;
  else if (edition.canonicalStatus === "tradition-dependent") traditionDependentSegments += count;
  else {
    assert(edition.canonicalStatus === "post-canonical", "Visuddhimagga must be post-canonical");
    vismSegments += count;
  }
}
assert(canonicalSegments === coverage.canonicalSegmentCount, "Canonical segment count does not match coverage");
assert(traditionDependentSegments === coverage.traditionDependentSegmentCount, "Tradition-dependent segment count does not match coverage");
assert(vismSegments === coverage.visuddhimagga.segmentCount && vismSegments > 0, "Visuddhimagga Pāli import is incomplete");

const bilara = json<{ licenseName: string; editions: Array<{ asset: string; sha256: string; segmentCount: number; licenseName: string }> }>("data/corpus/bilara-en-manifest.json");
assert(/CC0/.test(bilara.licenseName), "Bilara manifest must be CC0");
for (const edition of bilara.editions) {
  assert(/CC0/.test(edition.licenseName), `Non-CC0 English edition ${edition.asset}`);
  validatePagedEdition(edition, "en", "canonical");
}

const corpusFiles = allFiles(join(ROOT, "public", "corpus"));
const readerPayloads = corpusFiles.filter((path) => !/[\\/]indexes[\\/]/i.test(path));
const searchPayloads = corpusFiles.filter((path) => /[\\/]indexes[\\/]/i.test(path));
const largestPayload = Math.max(...readerPayloads.map((path) => statSync(path).size));
assert(largestPayload <= 500_000, `Corpus asset exceeds 500 KB bound: ${largestPayload}`);
const orphanReaderAssets = readerPayloads.filter((path) => !referencedAssets.has(path));
assert(orphanReaderAssets.length === 0, `Generated page without manifest entry: ${orphanReaderAssets[0] ?? "unknown"}`);
assert(!existsSync(join(ROOT, "public", "corpus", "ru")), "Theravada.ru generated corpus remains");
assert(!existsSync(join(ROOT, "data", "corpus", "theravada-ru-index.json")), "Theravada.ru index remains");
const sourceFiles = allFiles(join(ROOT, "src")).filter((path) => /\.[tj]sx?$/.test(path));
for (const path of sourceFiles) {
  const source = readFileSync(path, "utf8");
  assert(!/import\s+.*public[\\/]corpus/i.test(source), `Client/server source statically imports a full corpus asset: ${path}`);
}

for (const relativePath of [
  "data/corpus/upstream/bilara-en-inventory.json",
  "data/corpus/upstream/vri-inventory.json",
  "data/corpus/bilara-en-manifest.json",
  "data/corpus/full-corpus-manifest.json",
]) {
  const content = readFileSync(join(ROOT, relativePath), "utf8");
  assert(!/[A-Za-z]:\\|\/Users\/|\/home\/|\/workspace\//.test(content), `Absolute local path in generated provenance: ${relativePath}`);
}

const storageReport = {
  corpusAssetFiles: corpusFiles.length,
  corpusAssetBytes: corpusFiles.reduce((sum, path) => sum + statSync(path).size, 0),
  readerAssetFiles: readerPayloads.length,
  readerAssetBytes: readerPayloads.reduce((sum, path) => sum + statSync(path).size, 0),
  searchShardFiles: searchPayloads.length,
  searchShardBytes: searchPayloads.reduce((sum, path) => sum + statSync(path).size, 0),
  largestReaderAssetBytes: largestPayload,
  largestSearchShardBytes: Math.max(...searchPayloads.map((path) => statSync(path).size)),
  decodedReaderPageSegmentLimit: 200,
  renderedReaderPageSegmentLimit: 80,
};
writeFileSync(join(ROOT, "data/corpus/storage-report.json"), `${JSON.stringify(storageReport, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  fullVriMulaNavigationImported: coverage.fullVriMulaNavigationImported,
  importedMulaSources: coverage.importedWorks,
  canonicalSegments,
  traditionDependentSegments,
  visuddhimaggaSegments: vismSegments,
  englishEditions: bilara.editions.length,
  ...storageReport,
}, null, 2));
