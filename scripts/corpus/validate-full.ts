import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

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

function validatePagedEdition(edition: { asset: string; sha256: string; segmentCount: number }, expectedLanguage: string, expectedStatus?: string): number {
  const indexFile = assetPath(edition.asset);
  assert(existsSync(indexFile), `Missing edition index ${edition.asset}`);
  const indexBytes = readFileSync(indexFile);
  assert(sha256(indexBytes) === edition.sha256, `Index checksum mismatch ${edition.asset}`);
  const index = decodedJson<{ pages: Array<{ asset: string; sha256: string }>; segmentCount: number; segments?: Array<Record<string, unknown>> }>(edition.asset, indexBytes);
  assert(index.segmentCount === edition.segmentCount, `Segment count mismatch ${edition.asset}`);
  let count = 0;
  const validateSegments = (segments: Array<Record<string, unknown>>, source: string) => {
    for (const segment of segments) {
      for (const field of REQUIRED_SEGMENT_FIELDS) assert(segment[field] !== undefined && segment[field] !== "", `${source} segment missing ${field}`);
      assert(segment.language === expectedLanguage, `${source} language mismatch`);
      if (expectedStatus) assert(segment.canonicalStatus === expectedStatus, `${source} canonical status mismatch`);
      assert(sha256(String(segment.text)) === segment.sha256, `${source} text checksum mismatch`);
    }
    count += segments.length;
  };
  if (index.segments) validateSegments(index.segments, edition.asset);
  for (const page of index.pages) {
    const pageFile = assetPath(page.asset);
    assert(existsSync(pageFile), `Missing page ${page.asset}`);
    const bytes = readFileSync(pageFile);
    assert(sha256(bytes) === page.sha256, `Page checksum mismatch ${page.asset}`);
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
  fullTipitakaImported: boolean;
  visuddhimagga: { importedVolumes: number; segmentCount: number; canonicalStatus: string };
}>("data/corpus/full-canon-coverage.json");
assert(coverage.expectedWorks === 59, "Expected canonical boundary changed without review");
assert(coverage.mappedWorks === coverage.expectedWorks && coverage.importedWorks === coverage.expectedWorks, "Not all canonical volumes are mapped/imported");
assert(coverage.missingWorks.length === 0, "Canonical volumes are missing");
assert(coverage.duplicateMappings.length === 0, "Duplicate canonical mappings exist");
assert(coverage.unknownFiles.length === 0, "Unknown .mul files block coverage");
assert(Object.values(coverage.pitakaSegmentCounts).every((count) => count > 0), "Every Piṭaka must contain text");
assert(coverage.fullTipitakaImported, "fullTipitakaImported may only be true after the full gate passes");

const vriManifest = json<{ editions: Array<{ asset: string; sha256: string; segmentCount: number; canonicalStatus: string; language: string }> }>("data/corpus/full-corpus-manifest.json");
let canonicalSegments = 0;
let vismSegments = 0;
for (const edition of vriManifest.editions) {
  assert(edition.language === "pli", "VRI assets must contain Pāli only");
  const count = validatePagedEdition(edition, "pli", edition.canonicalStatus);
  if (edition.canonicalStatus === "canonical") canonicalSegments += count;
  else {
    assert(edition.canonicalStatus === "post-canonical", "Visuddhimagga must be post-canonical");
    vismSegments += count;
  }
}
assert(canonicalSegments === coverage.canonicalSegmentCount, "Canonical segment count does not match coverage");
assert(vismSegments === coverage.visuddhimagga.segmentCount && vismSegments > 0, "Visuddhimagga Pāli import is incomplete");

const bilara = json<{ licenseName: string; editions: Array<{ asset: string; sha256: string; segmentCount: number; licenseName: string }> }>("data/corpus/bilara-en-manifest.json");
assert(/CC0/.test(bilara.licenseName), "Bilara manifest must be CC0");
for (const edition of bilara.editions) {
  assert(/CC0/.test(edition.licenseName), `Non-CC0 English edition ${edition.asset}`);
  validatePagedEdition(edition, "en", "canonical");
}

const russianCoveragePath = join(ROOT, "data/corpus/theravada-ru-coverage.json");
if (existsSync(russianCoveragePath)) {
  const russianCoverage = json<{ importedEditions: number; importedSegments: number; directAttributionLinks: number }>("data/corpus/theravada-ru-coverage.json");
  const inventory = json<{ rows: Array<{ importDecision: string; sourceUrl: string; translator: string; translationBasisLanguage: string; asset?: string }> }>("data/corpus/upstream/theravada-ru-inventory.json");
  const russianIndex = json<Record<string, Array<{ asset: string; sha256: string; segmentCount: number }>>>("data/corpus/theravada-ru-index.json");
  const imported = inventory.rows.filter((row) => row.importDecision === "allowed-with-direct-link");
  assert(imported.length === russianCoverage.importedEditions, "Russian edition count mismatch");
  assert(imported.every((row) => /^https:\/\/www\.theravada\.ru\//.test(row.sourceUrl)), "Every Russian edition needs a direct Theravada.ru URL");
  assert(imported.every((row) => Boolean(row.translator)), "Every Russian edition needs translator or explicit unknown");
  assert(imported.every((row) => ["pli", "en", "unknown"].includes(row.translationBasisLanguage)), "Fabricated Russian translation basis");
  assert(russianCoverage.directAttributionLinks === imported.length, "Russian attribution links are incomplete");
  for (const edition of Object.values(russianIndex).flat()) validatePagedEdition(edition, "ru", "canonical");
  assert(inventory.rows.filter((row) => row.importDecision === "conflicting-notice" || row.importDecision === "excluded-robots").every((row) => !row.asset), "Blocked Russian page was imported");
}

const corpusFiles = allFiles(join(ROOT, "public", "corpus"));
const readerPayloads = corpusFiles.filter((path) => !/[\\/]indexes[\\/]/i.test(path));
const searchPayloads = corpusFiles.filter((path) => /[\\/]indexes[\\/]/i.test(path));
const largestPayload = Math.max(...readerPayloads.map((path) => statSync(path).size));
assert(largestPayload <= 500_000, `Corpus asset exceeds 500 KB bound: ${largestPayload}`);
const sourceFiles = allFiles(join(ROOT, "src")).filter((path) => /\.[tj]sx?$/.test(path));
for (const path of sourceFiles) {
  const source = readFileSync(path, "utf8");
  assert(!/import\s+.*public[\\/]corpus/i.test(source), `Client/server source statically imports a full corpus asset: ${path}`);
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
  fullTipitakaImported: coverage.fullTipitakaImported,
  canonicalVolumes: coverage.importedWorks,
  canonicalSegments,
  visuddhimaggaSegments: vismSegments,
  englishEditions: bilara.editions.length,
  ...storageReport,
}, null, 2));
