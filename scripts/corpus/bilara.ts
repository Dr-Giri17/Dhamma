import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { canonicalJson, deterministicGzip, sha256 } from "./deterministic";
import { normalizeBilaraText } from "./text-normalization";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const DEFAULT_SOURCE = "../Dhamma-corpus-inbox/upstream/bilara-data";
const SOURCE_REPOSITORY = "https://github.com/suttacentral/bilara-data";
const LICENSE_NAME = "CC0 1.0 Universal (CC0 1.0)";
const PAGE_SIZE = 200;

interface InventoryRow {
  canonicalId: string;
  translatorId: string;
  sourceFile: string;
  rootFile: string;
  sourceRevision: string;
  translationSegments: number;
  rootSegments: number;
  alignedSegments: number;
  unmatchedSegmentIds: string[];
  sha256: string;
  rootSha256: string;
  importDecision: "imported-cc0-aligned" | "excluded-missing-root" | "excluded-segment-mismatch";
  asset?: string;
}

function git(source: string, args: string[]): string {
  return execFileSync("git", ["-c", `safe.directory=${source.replace(/\\/g, "/")}`, ...args], {
    cwd: source,
    encoding: "utf8",
  }).trim();
}

function filesUnder(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path));
    else if (entry.isFile() && entry.name.endsWith(".json")) found.push(path);
  }
  return found;
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function jsonObject(path: string): Record<string, string> {
  const value = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error(`Expected object in ${path}`);
  for (const [key, text] of Object.entries(value)) {
    if (typeof text !== "string") throw new Error(`Expected string at ${path}:${key}`);
  }
  return value as Record<string, string>;
}

function writeJson(path: string, value: unknown, compact = false): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonicalJson(value, !compact), "utf8");
}


function candidateMetadata(path: string, source: string): { canonicalId: string; translatorId: string; sourceFile: string; rootFile: string; rootPath: string } | undefined {
  const translationRoot = join(source, "translation", "en");
  const rel = relative(translationRoot, path);
  const parts = rel.split(sep);
  if (parts.length < 4) return undefined;
  const translatorId = parts.shift()!;
  const category = parts[0];
  if (category !== "sutta" && category !== "vinaya" && category !== "abhidhamma") return undefined;
  const filename = parts.at(-1)!;
  const suffix = `_translation-en-${translatorId}.json`;
  if (!filename.endsWith(suffix)) return undefined;
  const canonicalId = filename.slice(0, -suffix.length);
  const rootFilename = `${canonicalId}_root-pli-ms.json`;
  const rootRelative = join("root", "pli", "ms", ...parts.slice(0, -1), rootFilename).replace(/\\/g, "/");
  return {
    canonicalId,
    translatorId,
    sourceFile: relative(source, path).replace(/\\/g, "/"),
    rootFile: rootRelative,
    rootPath: join(source, rootRelative),
  };
}

function buildInventory(source: string): { rows: InventoryRow[]; revision: string; sourceDate: string } {
  const revision = git(source, ["rev-parse", "HEAD"]);
  // Do not ask a partial clone for ancillary commit data: Git may contact the
  // promisor remote. The revision is the deterministic generation boundary.
  const sourceDate = `revision:${revision}`;
  const translationRoot = join(source, "translation", "en");
  const rows: InventoryRow[] = [];
  for (const path of filesUnder(translationRoot).sort((a, b) => a.localeCompare(b))) {
    const metadata = candidateMetadata(path, source);
    if (!metadata) continue;
    const translationBytes = readFileSync(path);
    const { rootPath, ...portableMetadata } = metadata;
    if (!existsSync(rootPath)) {
      rows.push({
        ...portableMetadata,
        sourceRevision: revision,
        translationSegments: 0,
        rootSegments: 0,
        alignedSegments: 0,
        unmatchedSegmentIds: [],
        sha256: sha256(translationBytes),
        rootSha256: "",
        importDecision: "excluded-missing-root",
      });
      continue;
    }
    const translation = jsonObject(path);
    const root = jsonObject(rootPath);
    const ids = Object.keys(translation);
    const unmatchedSegmentIds = ids.filter((id) => !(id in root));
    rows.push({
      ...portableMetadata,
      sourceRevision: revision,
      translationSegments: ids.length,
      rootSegments: Object.keys(root).length,
      alignedSegments: ids.length - unmatchedSegmentIds.length,
      unmatchedSegmentIds,
      sha256: sha256(translationBytes),
      rootSha256: sha256(readFileSync(rootPath)),
      importDecision: unmatchedSegmentIds.length ? "excluded-segment-mismatch" : "imported-cc0-aligned",
    });
  }
  return { rows, revision, sourceDate };
}

function importEnglish(source: string): void {
  const { rows, revision, sourceDate } = buildInventory(source);
  const imported = rows.filter((row) => row.importDecision === "imported-cc0-aligned");
  const editions: Array<Record<string, unknown>> = [];
  const canonicalIndex: Record<string, Array<Record<string, unknown>>> = {};
  for (const row of imported) {
    const translation = jsonObject(join(source, row.sourceFile));
    const segments = Object.entries(translation)
      .map(([segmentUid, text]) => [segmentUid, normalizeBilaraText(text)] as const)
      .filter(([, text]) => text.trim().length > 0)
      .map(([segmentUid, text], index) => ({
      id: `seg-${sha256(`en:${row.translatorId}:${segmentUid}`).slice(0, 20)}`,
      workId: `work-bilara-${row.canonicalId}`,
      textId: `text-bilara-${row.canonicalId}-${row.translatorId}`,
      segmentUid,
      sourceRef: `${row.sourceFile}#${segmentUid}`,
      language: "en",
      text,
      canonicalStatus: "canonical",
      translator: row.translatorId,
      translationBasisLanguage: "pli",
      sourceRevision: revision,
      sourceFile: row.sourceFile,
      sourceUrl: `${SOURCE_REPOSITORY}/blob/${revision}/${row.sourceFile}`,
      licenseName: LICENSE_NAME,
      attribution: "SuttaCentral Bilara",
      sha256: sha256(text),
      segmentOrder: index + 1,
    }));
    const directoryRelative = `public/corpus/en/${row.translatorId}/${row.canonicalId}`;
    const directory = join(REPOSITORY_ROOT, directoryRelative);
    mkdirSync(directory, { recursive: true });
    const pages: Array<Record<string, unknown>> = [];
    const inlineSegments = segments.length <= PAGE_SIZE ? segments : undefined;
    if (!inlineSegments) {
      for (let offset = 0; offset < segments.length; offset += PAGE_SIZE) {
        const page = pages.length + 1;
        const pageSegments = segments.slice(offset, offset + PAGE_SIZE);
        const filename = `page-${String(page).padStart(4, "0")}.json.gz`;
        const relativeAsset = `${directoryRelative}/${filename}`;
        const payload = `${JSON.stringify({ schemaVersion: 1, canonicalId: row.canonicalId, translator: row.translatorId, language: "en", page, segments: pageSegments })}\n`;
        const contentBytes = Buffer.from(payload, "utf8");
        const bytes = deterministicGzip(contentBytes);
        writeFileSync(join(directory, filename), bytes);
        pages.push({ page, start: offset + 1, end: offset + pageSegments.length, segmentCount: pageSegments.length, asset: `/${relativeAsset.replace(/^public\//, "")}`, sha256: sha256(bytes), compressedSha256: sha256(bytes), contentSha256: sha256(contentBytes) });
      }
    }
    const indexRelative = `${directoryRelative}/index.json.gz`;
    const indexPayload = `${JSON.stringify({
      schemaVersion: 1,
      canonicalId: row.canonicalId,
      workId: `work-bilara-${row.canonicalId}`,
      textId: `text-bilara-${row.canonicalId}-${row.translatorId}`,
      language: "en",
      translator: row.translatorId,
      edition: "Bilara published",
      sourceFile: row.sourceFile,
      sourceRevision: revision,
      sourceUrl: `${SOURCE_REPOSITORY}/blob/${revision}/${row.sourceFile}`,
      licenseName: LICENSE_NAME,
      attribution: "SuttaCentral Bilara",
      segmentCount: segments.length,
      pageSize: PAGE_SIZE,
      pageCount: pages.length,
      pages,
      segments: inlineSegments,
    })}\n`;
    const indexContentBytes = Buffer.from(indexPayload, "utf8");
    const indexBytes = deterministicGzip(indexContentBytes);
    writeFileSync(join(directory, "index.json.gz"), indexBytes);
    row.asset = `/${indexRelative.replace(/^public\//, "")}`;
    const edition = {
      canonicalId: row.canonicalId,
      language: "en",
      translator: row.translatorId,
      edition: "Bilara published",
      sourceFile: row.sourceFile,
      sourceRevision: revision,
      sourceUrl: `${SOURCE_REPOSITORY}/blob/${revision}/${row.sourceFile}`,
      licenseName: LICENSE_NAME,
      segmentCount: segments.length,
      asset: row.asset,
      sha256: sha256(indexBytes),
      compressedSha256: sha256(indexBytes),
      contentSha256: sha256(indexContentBytes),
    };
    editions.push(edition);
    (canonicalIndex[row.canonicalId] ??= []).push(edition);
  }
  for (const values of Object.values(canonicalIndex)) {
    values.sort((a, b) => {
      const left = String(a.translator);
      const right = String(b.translator);
      if (left === "sujato") return -1;
      if (right === "sujato") return 1;
      return left.localeCompare(right);
    });
  }
  const excluded = rows.filter((row) => row.importDecision !== "imported-cc0-aligned");
  const coverage = {
    sourceRevision: revision,
    inventoryEditions: rows.length,
    importedEditions: imported.length,
    importedWorks: new Set(imported.map((row) => row.canonicalId)).size,
    importedSegments: editions.reduce((sum, edition) => sum + Number(edition.segmentCount), 0),
    translators: [...new Set(imported.map((row) => row.translatorId))].sort(),
    excludedEditions: excluded.length,
    exclusions: Object.fromEntries([...new Set(excluded.map((row) => row.importDecision))].map((decision) => [decision, excluded.filter((row) => row.importDecision === decision).length])),
    licenseName: LICENSE_NAME,
  };
  writeJson(join(REPOSITORY_ROOT, "data/corpus/upstream/bilara-en-inventory.json"), { sourceRepository: SOURCE_REPOSITORY, sourceRevision: revision, sourceDate, rows }, true);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/bilara-en-manifest.json"), { schemaVersion: 1, sourceRevision: revision, sourceDate, licenseName: LICENSE_NAME, editions }, true);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/bilara-en-index.json"), canonicalIndex, true);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/bilara-en-coverage.json"), coverage);
  const doc = [
    "# Bilara English corpus inventory",
    "",
    `Pinned published-branch revision: \`${revision}\``,
    "",
    "The repository LICENSE.md dedicates Bilara-created, SuttaCentral-supported translations to CC0. Import requires an exact matching Pāli root file and complete segment-key alignment.",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Candidate editions | ${coverage.inventoryEditions} |`,
    `| Imported aligned editions | ${coverage.importedEditions} |`,
    `| Unique translated works | ${coverage.importedWorks} |`,
    `| English segments | ${coverage.importedSegments} |`,
    `| Excluded editions | ${coverage.excludedEditions} |`,
    "",
    `Translator identifiers (from Bilara paths): ${coverage.translators.join(", ")}.`,
    "",
    "No English text is used as an unlabeled replacement for a missing Russian edition.",
    "",
  ].join("\n");
  writeFileSync(join(REPOSITORY_ROOT, "docs/BILARA_ENGLISH_COVERAGE.md"), doc, "utf8");
  console.log(JSON.stringify(coverage, null, 2));
}

const command = process.argv[2] ?? "ingest";
const source = resolve(argument("--source") ?? DEFAULT_SOURCE);
if (!existsSync(join(source, "translation", "en"))) throw new Error(`Bilara source not found: ${source}`);
if (command === "inventory" || command === "ingest") importEnglish(source);
else throw new Error(`Unknown Bilara command: ${command}`);
