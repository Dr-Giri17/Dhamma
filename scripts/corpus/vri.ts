import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import {
  EXPECTED_TRADITION_DEPENDENT_FILES,
  EXPECTED_VRI_MULA_SOURCES,
  EXPECTED_VISUDDHIMAGGA_FILES,
  type VriCanonicalScope,
} from "./vri-expected";
import { canonicalJson, deterministicGzip, sha256 } from "./deterministic";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const DEFAULT_SOURCE = "../Dhamma-corpus-inbox/upstream/tipitaka-xml";
const SOURCE_URL = "https://github.com/VipassanaTech/tipitaka-xml";
const TEXT_SOURCE_URL = "https://tipitaka.org/romn/";
const LICENSE_NAME = "VRI non-commercial use with attribution";
const ATTRIBUTION = "Vipassana Research Institute";
const SEGMENTS_PER_PAGE = 200;

type Classification = "canonical-root" | "tradition-dependent-root" | "atthakatha" | "tika" | "post-canonical" | "other" | "unknown";
type Pitaka = "vinaya" | "sutta" | "abhidhamma" | "post-canonical" | "unknown";

interface InventoryRow {
  filename: string;
  suffix: string;
  internalTitle: string;
  internalBookHeading: string;
  pitaka: Pitaka;
  collection: string;
  canonicalStatus: "canonical" | "tradition-dependent" | "post-canonical" | "commentarial" | "unknown";
  canonicalScope?: VriCanonicalScope;
  includedInVriMulaNavigation: boolean;
  workType: Classification;
  language: "pli";
  script: "Latn";
  chapterStructure: { divs: number; heads: number };
  paragraphCount: number;
  sourceRevision: string;
  sha256: string;
  byteSize: number;
}

interface NormalizedNote {
  id: string;
  text: string;
  kind: "variant-reading-or-source-note";
}

interface NavigationNode {
  text?: string;
  children?: NavigationNode[];
  a_attr?: { href?: string };
}

export interface NormalizedCorpusSegment {
  id: string;
  workId: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  language: "pli";
  text: string;
  canonicalStatus: "canonical" | "tradition-dependent" | "post-canonical";
  pitaka: Pitaka;
  collection: string;
  book: string;
  chapter: string;
  parentHeading: string;
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
  sha256: string;
  segmentOrder: number;
  anchors: string[];
  notes: NormalizedNote[];
}

interface Asset {
  schemaVersion: 1;
  workId: string;
  textId: string;
  title: string;
  language: "pli";
  canonicalStatus: "canonical" | "tradition-dependent" | "post-canonical";
  pitaka: Pitaka;
  collection: string;
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
  segmentCount: number;
  segments: NormalizedCorpusSegment[];
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function git(source: string, args: string[]): string {
  return execFileSync("git", ["-c", `safe.directory=${source.replace(/\\/g, "/")}`, ...args], {
    cwd: source,
    encoding: "utf8",
  }).trim();
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function plainText(value: string): string {
  return decodeXml(
    value
      .replace(/<pb\b[^>]*\/?\s*>/gi, " ")
      .replace(/<lb\b[^>]*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .normalize("NFC")
    .replace(/[\t\r\n ]+/g, " ")
    .trim();
}

function attribute(tag: string, name: string): string {
  return decodeXml(new RegExp(`\\b${name}="([^"]*)"`, "i").exec(tag)?.[1] ?? "");
}

function readXml(path: string): string {
  const bytes = readFileSync(path);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return bytes.subarray(2).toString("utf16le");
  }
  return bytes.toString("utf16le").replace(/^\uFEFF/, "");
}

function vriMulaNavigationFiles(source: string): Set<string> {
  const treePath = join(source, "tipitaka.org", "romn", "tree.json");
  if (!existsSync(treePath)) throw new Error(`VRI Roman navigation not found: ${treePath}`);
  const bytes = readFileSync(treePath);
  const text = bytes[0] === 0xff && bytes[1] === 0xfe
    ? bytes.subarray(2).toString("utf16le")
    : bytes.toString("utf8").replace(/^\uFEFF/, "");
  const roots = JSON.parse(text) as NavigationNode[];
  const tipitaka = roots.find((node) => node.text === "Tipiṭaka");
  const mula = tipitaka?.children?.find((node) => node.text === "Tipiṭaka (Mūla)");
  if (!mula) throw new Error("VRI Tipiṭaka (Mūla) navigation section not found");
  const files = new Set<string>();
  const visit = (node: NavigationNode) => {
    const href = node.a_attr?.href;
    if (href) {
      const filename = basename(href).replace(/\.(mul|nrf)\d+\.xml$/i, ".$1.xml");
      if (/\.(?:mul|nrf)\.xml$/i.test(filename)) files.add(filename);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(mula);
  if (!files.size) throw new Error("VRI Mūla navigation produced no source files");
  return files;
}

function suffixOf(filename: string): string {
  return /\.([^.]+)\.xml$/i.exec(filename)?.[1]?.toLowerCase() ?? "unknown";
}

function pitakaOf(filename: string): Pitaka {
  const expected = EXPECTED_VRI_MULA_SOURCES.find((row) => row.sourceFile === filename);
  if (expected) return expected.pitaka;
  if (/^vin/i.test(filename)) return "vinaya";
  if (/^s\d/i.test(filename)) return "sutta";
  if (/^abh/i.test(filename)) return "abhidhamma";
  if (/^e010[12]n\.mul\.xml$/i.test(filename)) return "post-canonical";
  return "unknown";
}

function collectionOf(filename: string, pitaka: Pitaka): string {
  const expected = EXPECTED_VRI_MULA_SOURCES.find((row) => row.sourceFile === filename);
  if (expected) return expected.collection;
  if (pitaka === "vinaya") return "vinaya";
  if (pitaka === "abhidhamma") return "abhidhamma";
  if (pitaka === "post-canonical") return "visuddhimagga";
  const code = /^s(\d{2})/i.exec(filename)?.[1];
  return ({ "01": "dn", "02": "mn", "03": "sn", "04": "an", "05": "kn" } as Record<string, string>)[code ?? ""] ?? "sutta";
}

function classificationOf(filename: string): Classification {
  const expected = EXPECTED_VRI_MULA_SOURCES.find((row) => row.sourceFile === filename);
  if (expected?.canonicalScope === "universally-canonical") return "canonical-root";
  if (expected?.canonicalScope === "tradition-dependent") return "tradition-dependent-root";
  if ((EXPECTED_VISUDDHIMAGGA_FILES as readonly string[]).includes(filename)) return "post-canonical";
  const suffix = suffixOf(filename);
  if (suffix === "att") return "atthakatha";
  if (suffix === "tik") return "tika";
  if (suffix === "nrf") return "other";
  return "unknown";
}

function titleFrom(xml: string): string {
  const book = /<(?:head|p)\b[^>]*rend="book"[^>]*>([\s\S]*?)<\/(?:head|p)>/i.exec(xml)?.[1];
  return plainText(book ?? "");
}

function inventory(source: string): { rows: InventoryRow[]; revision: string; sourceDate: string } {
  const revision = git(source, ["rev-parse", "HEAD"]);
  const sourceDate = git(source, ["show", "-s", "--format=%cI", "HEAD"]);
  const romn = join(source, "romn");
  const navigationFiles = vriMulaNavigationFiles(source);
  const rows = readdirSync(romn)
    .filter((filename) => filename.endsWith(".xml"))
    .sort((a, b) => a.localeCompare(b))
    .map((filename): InventoryRow => {
      const path = join(romn, filename);
      const bytes = readFileSync(path);
      const xml = readXml(path);
      const workType = classificationOf(filename);
      const expected = EXPECTED_VRI_MULA_SOURCES.find((row) => row.sourceFile === filename);
      const pitaka = pitakaOf(filename);
      const nikaya = /<p\b[^>]*rend="nikaya"[^>]*>([\s\S]*?)<\/p>/i.exec(xml)?.[1];
      return {
        filename,
        suffix: suffixOf(filename),
        internalTitle: plainText(nikaya ?? ""),
        internalBookHeading: titleFrom(xml),
        pitaka,
        collection: collectionOf(filename, pitaka),
        canonicalStatus:
          workType === "canonical-root" ? "canonical" :
          workType === "tradition-dependent-root" ? "tradition-dependent" :
          workType === "post-canonical" ? "post-canonical" :
          workType === "atthakatha" || workType === "tika" ? "commentarial" : "unknown",
        workType,
        canonicalScope: expected?.canonicalScope,
        includedInVriMulaNavigation: navigationFiles.has(filename),
        language: "pli",
        script: "Latn",
        chapterStructure: {
          divs: (xml.match(/<div\b/gi) ?? []).length,
          heads: (xml.match(/<(?:head|p)\b[^>]*rend="(?:book|chapter|title|subhead|subsubhead)"/gi) ?? []).length,
        },
        paragraphCount: (xml.match(/<p\b/gi) ?? []).length,
        sourceRevision: revision,
        sha256: sha256(bytes),
        byteSize: statSync(path).size,
      };
    });
  return { rows, revision, sourceDate };
}

function writeJson(path: string, value: unknown, compact = false): void {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, canonicalJson(value, !compact), "utf8");
}

function inventoryMarkdown(rows: InventoryRow[], revision: string): string {
  const groups = new Map<string, number>();
  for (const row of rows) groups.set(row.workType, (groups.get(row.workType) ?? 0) + 1);
  const lines = [
    "# VRI corpus inventory",
    "",
    `Pinned revision: \`${revision}\``,
    "",
    "Source: VipassanaTech/tipitaka-xml, attributed to Vipassana Research Institute.",
    "Use condition: non-commercial with attribution. These corpus files are not MIT-licensed.",
    "",
    "## Classification summary",
    "",
    "| Class | Files |",
    "| --- | ---: |",
    ...[...groups.entries()].sort().map(([key, count]) => `| ${key} | ${count} |`),
    "",
    "## Canonical and post-canonical root volumes",
    "",
    "| File | Classification | Piṭaka | Collection | Internal book heading | Paragraphs | SHA-256 |",
    "| --- | --- | --- | --- | --- | ---: | --- |",
    ...rows
      .filter((row) => row.workType === "canonical-root" || row.workType === "tradition-dependent-root" || row.workType === "post-canonical")
      .map((row) => `| ${row.filename} | ${row.workType} | ${row.pitaka} | ${row.collection} | ${row.internalBookHeading || "—"} | ${row.paragraphCount} | \`${row.sha256}\` |`),
    "",
    "The filename suffix is only the first classification signal. The generated inventory also records internal headings, structure, hashes, and the pinned source revision.",
    "",
  ];
  return lines.join("\n");
}

function extractSegments(row: InventoryRow, source: string, revision: string): { asset: Asset; routes: Record<string, { start: number; end: number; title?: string }> } {
  const path = join(source, "romn", row.filename);
  const xml = readXml(path);
  const base = row.filename.replace(/\.(?:mul|nrf)\.xml$/i, "");
  const workId = row.workType === "post-canonical" ? "work-vism" : `work-vri-${base}`;
  const textId = row.workType === "post-canonical" ? `text-vism-${base}` : `text-vri-${base}`;
  const canonicalStatus = row.workType === "post-canonical"
    ? "post-canonical"
    : row.workType === "tradition-dependent-root"
      ? "tradition-dependent"
      : "canonical";
  const sourceFile = `romn/${row.filename}`;
  const sourceUrl = `${SOURCE_URL}/blob/${revision}/${sourceFile}`;
  const title = row.internalBookHeading || (row.workType === "post-canonical" ? "Visuddhimaggo" : base);
  const stack: string[] = [];
  const routes: Record<string, { start: number; end: number; title?: string }> = {};
  const segments: NormalizedCorpusSegment[] = [];
  let chapter = "";
  let parentHeading = title;
  let currentNumberedTextRoute = "";
  let numberedTextCount = 0;
  const token = /<div\b[^>]*>|<\/div\s*>|<(head|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = token.exec(xml))) {
    const full = match[0];
    if (/^<div\b/i.test(full)) {
      const id = attribute(full, "id") || attribute(full, "n");
      if (id) stack.push(id);
      continue;
    }
    if (/^<\/div/i.test(full)) {
      stack.pop();
      continue;
    }
    const element = match[1].toLowerCase();
    const attrs = match[2];
    let inner = match[3];
    const rend = attribute(attrs, "rend").toLowerCase();
    const headingText = plainText(inner);
    if (element === "head" || ["book", "chapter", "title", "subhead", "subsubhead", "nikaya", "centre"].includes(rend)) {
      if (headingText) {
        if (rend === "book") parentHeading = headingText;
        else if (rend !== "centre" && rend !== "nikaya") {
          chapter = headingText;
          const headingNumber = Number(/^(\d+)\s*[.\s]/.exec(headingText)?.[1] ?? 0);
          const isDnTextHeading = row.collection === "dn" && rend === "chapter";
          const isMnTextHeading = row.collection === "mn" && rend === "subhead" && /sutta(?:ṃ|m)?/i.test(headingText);
          if ((isDnTextHeading || isMnTextHeading) && headingNumber) {
            let canonicalNumber = headingNumber;
            if (isDnTextHeading) {
              numberedTextCount += 1;
              const volumeOffset = row.filename.startsWith("s0102") ? 13 : row.filename.startsWith("s0103") ? 23 : 0;
              canonicalNumber = volumeOffset + numberedTextCount;
            }
            if (isMnTextHeading) {
              numberedTextCount += 1;
              const volumeOffset = row.filename.startsWith("s0202") ? 50 : row.filename.startsWith("s0203") ? 100 : 0;
              canonicalNumber = volumeOffset + numberedTextCount;
            }
            if (canonicalNumber) {
              currentNumberedTextRoute = `${row.collection}${canonicalNumber}`;
              routes[currentNumberedTextRoute] = {
                start: segments.length + 1,
                end: segments.length,
                title: headingText,
              };
            }
          }
        }
      }
      continue;
    }
    if (element !== "p") continue;
    const notes: NormalizedNote[] = [];
    inner = inner.replace(/<note\b[^>]*>([\s\S]*?)<\/note>/gi, (_whole, noteBody: string) => {
      const text = plainText(noteBody);
      if (text) notes.push({ id: "", text, kind: "variant-reading-or-source-note" });
      return " ";
    });
    const text = plainText(inner);
    if (!text) continue;
    const segmentOrder = segments.length + 1;
    const suffix = String(segmentOrder).padStart(6, "0");
    const segmentUid = `${textId}:${suffix}`;
    for (let index = 0; index < notes.length; index++) notes[index].id = `${segmentUid}:note-${index + 1}`;
    const anchors = [...stack];
    for (const anchor of anchors) {
      if ((row.collection === "dn" || row.collection === "mn") && new RegExp(`^${row.collection}\\d$`, "i").test(anchor)) {
        continue;
      }
      const existing = routes[anchor];
      if (existing) existing.end = segmentOrder;
      else routes[anchor] = { start: segmentOrder, end: segmentOrder };
    }
    if (currentNumberedTextRoute) {
      routes[currentNumberedTextRoute].end = segmentOrder;
    }
    segments.push({
      id: `seg-${sha256(segmentUid).slice(0, 20)}`,
      workId,
      textId,
      segmentUid,
      sourceRef: `${sourceFile}#p-${suffix}`,
      language: "pli",
      text,
      canonicalStatus,
      pitaka: row.pitaka,
      collection: row.collection,
      book: title,
      chapter,
      parentHeading,
      sourceRevision: revision,
      sourceFile,
      sourceUrl,
      licenseName: LICENSE_NAME,
      attribution: ATTRIBUTION,
      sha256: sha256(text),
      segmentOrder,
      anchors,
      notes,
    });
  }
  return {
    asset: {
      schemaVersion: 1,
      workId,
      textId,
      title,
      language: "pli",
      canonicalStatus,
      pitaka: row.pitaka,
      collection: row.collection,
      sourceRevision: revision,
      sourceFile,
      sourceUrl,
      licenseName: LICENSE_NAME,
      attribution: ATTRIBUTION,
      segmentCount: segments.length,
      segments,
    },
    routes,
  };
}

function expectedCoverage(rows: InventoryRow[]): { missing: string[]; unexpectedRoots: string[]; mula: InventoryRow[]; vism: InventoryRow[] } {
  const names = new Set(rows.map((row) => row.filename));
  const expectedMula = new Set<string>(EXPECTED_VRI_MULA_SOURCES.map((row) => row.sourceFile));
  const expected = new Set<string>([...expectedMula, ...EXPECTED_VISUDDHIMAGGA_FILES]);
  return {
    missing: [...expected].filter((name) => !names.has(name)).sort(),
    unexpectedRoots: rows
      .filter((row) => row.includedInVriMulaNavigation && !expectedMula.has(row.filename))
      .map((row) => row.filename)
      .sort(),
    mula: rows.filter((row) => expectedMula.has(row.filename)),
    vism: rows.filter((row) => (EXPECTED_VISUDDHIMAGGA_FILES as readonly string[]).includes(row.filename)),
  };
}

function ingest(source: string): void {
  const { rows, revision, sourceDate } = inventory(source);
  const gate = expectedCoverage(rows);
  if (gate.missing.length || gate.unexpectedRoots.length) {
    throw new Error(`VRI coverage boundary failed. Missing: ${gate.missing.join(", ") || "none"}; unexpected roots: ${gate.unexpectedRoots.join(", ") || "none"}`);
  }
  const manifest: Array<Record<string, unknown>> = [];
  const canonMap: Array<Record<string, unknown>> = [];
  const routeIndex: Record<string, Record<string, unknown>> = {};
  const importedRows = [...gate.mula, ...gate.vism];
  for (const row of importedRows) {
    const { asset, routes } = extractSegments(row, source, revision);
    if (asset.segmentCount === 0) throw new Error(`${row.filename} produced no segments`);
    const base = row.filename.replace(/\.(?:mul|nrf)\.xml$/i, "");
    const folder = asset.canonicalStatus === "post-canonical" ? "post-canonical" : asset.pitaka;
    const outputDirectoryRelative = `public/corpus/pli/${folder}/${base}`;
    const outputDirectory = join(REPOSITORY_ROOT, outputDirectoryRelative);
    mkdirSync(outputDirectory, { recursive: true });
    const pages: Array<{ page: number; start: number; end: number; segmentCount: number; asset: string; sha256: string; compressedSha256: string; contentSha256: string }> = [];
    for (let offset = 0; offset < asset.segments.length; offset += SEGMENTS_PER_PAGE) {
      const page = pages.length + 1;
      const pageSegments = asset.segments.slice(offset, offset + SEGMENTS_PER_PAGE);
      const pageName = `page-${String(page).padStart(4, "0")}.json.gz`;
      const pageRelative = `${outputDirectoryRelative}/${pageName}`;
      const pagePayload = `${JSON.stringify({
        schemaVersion: 1,
        workId: asset.workId,
        textId: asset.textId,
        title: asset.title,
        language: asset.language,
        canonicalStatus: asset.canonicalStatus,
        page,
        pageSize: SEGMENTS_PER_PAGE,
        segmentCount: pageSegments.length,
        segments: pageSegments,
      })}\n`;
      const pageContentBytes = Buffer.from(pagePayload, "utf8");
      const pageBytes = deterministicGzip(pageContentBytes);
      writeFileSync(join(outputDirectory, pageName), pageBytes);
      pages.push({
        page,
        start: offset + 1,
        end: offset + pageSegments.length,
        segmentCount: pageSegments.length,
        asset: `/${pageRelative.replace(/^public\//, "")}`,
        sha256: sha256(pageBytes),
        compressedSha256: sha256(pageBytes),
        contentSha256: sha256(pageContentBytes),
      });
    }
    const indexRelative = `${outputDirectoryRelative}/index.json.gz`;
    const indexPath = join(REPOSITORY_ROOT, indexRelative);
    const indexPayload = `${JSON.stringify({
      ...asset,
      segments: undefined,
      pageSize: SEGMENTS_PER_PAGE,
      pageCount: pages.length,
      pages,
    })}\n`;
    const indexContentBytes = Buffer.from(indexPayload, "utf8");
    const indexBytes = deterministicGzip(indexContentBytes);
    writeFileSync(indexPath, indexBytes);
    const assetHash = sha256(indexBytes);
    manifest.push({
      workId: asset.workId,
      textId: asset.textId,
      title: asset.title,
      language: asset.language,
      canonicalStatus: asset.canonicalStatus,
      pitaka: asset.pitaka,
      collection: asset.collection,
      segmentCount: asset.segmentCount,
      asset: `/${indexRelative.replace(/^public\//, "")}`,
      pageCount: pages.length,
      pages,
      sha256: assetHash,
      compressedSha256: assetHash,
      contentSha256: sha256(indexContentBytes),
      sourceRevision: revision,
      sourceFile: asset.sourceFile,
      sourceUrl: asset.sourceUrl,
      licenseName: asset.licenseName,
      attribution: asset.attribution,
    });
    canonMap.push({
      upstreamFile: row.filename,
      canonicalWorkId: asset.workId,
      pitaka: asset.pitaka,
      collection: asset.collection,
      volume: base,
      internalTitle: asset.title,
      segmentCount: asset.segmentCount,
      checksum: assetHash,
      importStatus: "imported",
      canonicalStatus: asset.canonicalStatus,
      canonicalScope: row.canonicalScope,
      navigationSection: EXPECTED_VRI_MULA_SOURCES.find((entry) => entry.sourceFile === row.filename)?.navigationSection,
    });
    for (const [anchor, range] of Object.entries(routes)) {
      const normalized = anchor.toLowerCase().replace(/_/g, ".");
      if (!routeIndex[normalized]) {
        routeIndex[normalized] = {
          asset: `/${indexRelative.replace(/^public\//, "")}`,
          textId: asset.textId,
          workId: asset.workId,
          title: range.title || asset.title,
          canonicalStatus: asset.canonicalStatus,
          ...range,
        };
      }
    }
    routeIndex[base] = {
      asset: `/${indexRelative.replace(/^public\//, "")}`,
      textId: asset.textId,
      workId: asset.workId,
      title: asset.title,
      canonicalStatus: asset.canonicalStatus,
      start: 1,
      end: asset.segmentCount,
    };
  }
  routeIndex.visuddhimagga = {
    assets: manifest.filter((entry) => entry.canonicalStatus === "post-canonical").map((entry) => entry.asset),
    textId: "text-vism",
    workId: "work-vism",
    title: "Visuddhimaggo",
    canonicalStatus: "post-canonical",
  };
  const canonicalManifest = manifest.filter((entry) => entry.canonicalStatus === "canonical");
  const traditionDependentManifest = manifest.filter((entry) => entry.canonicalStatus === "tradition-dependent");
  const mulaManifest = [...canonicalManifest, ...traditionDependentManifest];
  const pitakaCounts = Object.fromEntries(["vinaya", "sutta", "abhidhamma"].map((pitaka) => [pitaka, canonicalManifest.filter((entry) => entry.pitaka === pitaka).reduce((sum, entry) => sum + Number(entry.segmentCount), 0)]));
  const sourceCounts = new Map<string, number>();
  const targetCounts = new Map<string, number>();
  for (const mapping of canonMap.filter((entry) => entry.canonicalStatus !== "post-canonical")) {
    const source = String(mapping.upstreamFile);
    const target = String(mapping.canonicalWorkId);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    targetCounts.set(target, (targetCounts.get(target) ?? 0) + 1);
  }
  const duplicateMappings = [
    ...[...sourceCounts].filter(([, count]) => count > 1).map(([source]) => `source:${source}`),
    ...[...targetCounts].filter(([, count]) => count > 1).map(([target]) => `target:${target}`),
  ].sort();
  const blockers = [
    ...(gate.missing.length ? [`Missing expected files: ${gate.missing.join(", ")}`] : []),
    ...(gate.unexpectedRoots.length ? [`Unexpected root files: ${gate.unexpectedRoots.join(", ")}`] : []),
    ...(duplicateMappings.length ? [`Duplicate mappings: ${duplicateMappings.join(", ")}`] : []),
    ...mulaManifest.filter((entry) => Number(entry.segmentCount) === 0).map((entry) => `Zero-segment import: ${entry.sourceFile}`),
    ...Object.entries(pitakaCounts).filter(([, count]) => count === 0).map(([pitaka]) => `${pitaka} has no imported content`),
  ];
  const coverage = {
    edition: "Reviewed VRI Mūla navigation scope",
    sourceRevision: revision,
    expectedWorks: EXPECTED_VRI_MULA_SOURCES.length,
    mappedWorks: mulaManifest.length,
    importedWorks: mulaManifest.length,
    universallyCanonicalWorks: canonicalManifest.length,
    traditionDependentWorks: traditionDependentManifest.length,
    traditionDependentSources: EXPECTED_TRADITION_DEPENDENT_FILES,
    missingWorks: gate.missing.filter((name) => EXPECTED_VRI_MULA_SOURCES.some((row) => row.sourceFile === name)),
    duplicateMappings,
    unknownFiles: gate.unexpectedRoots,
    canonicalSegmentCount: canonicalManifest.reduce((sum, entry) => sum + Number(entry.segmentCount), 0),
    traditionDependentSegmentCount: traditionDependentManifest.reduce((sum, entry) => sum + Number(entry.segmentCount), 0),
    pitakaSegmentCounts: pitakaCounts,
    visuddhimagga: {
      expectedVolumes: EXPECTED_VISUDDHIMAGGA_FILES.length,
      importedVolumes: manifest.filter((entry) => entry.canonicalStatus === "post-canonical").length,
      segmentCount: manifest.filter((entry) => entry.canonicalStatus === "post-canonical").reduce((sum, entry) => sum + Number(entry.segmentCount), 0),
      canonicalStatus: "post-canonical",
    },
    blockers,
    fullVriMulaNavigationImported: blockers.length === 0 && mulaManifest.length === EXPECTED_VRI_MULA_SOURCES.length,
    universalTipitakaCompletenessClaim: false,
  };
  writeJson(join(REPOSITORY_ROOT, "data/corpus/upstream/vri-inventory.json"), { sourceRepository: SOURCE_URL, sourceRevision: revision, sourceDate, rows });
  writeFileSync(join(REPOSITORY_ROOT, "docs/VRI_CORPUS_INVENTORY.md"), inventoryMarkdown(rows, revision), "utf8");
  writeJson(join(REPOSITORY_ROOT, "data/corpus/full-canon-map.json"), canonMap);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/full-canon-coverage.json"), coverage);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/full-corpus-manifest.json"), { schemaVersion: 1, generatedFromRevision: revision, generatedAt: sourceDate, editions: manifest });
  writeJson(join(REPOSITORY_ROOT, "data/corpus/vri-reader-index.json"), routeIndex);
  const coverageDoc = [
    "# VRI Mūla navigation coverage",
    "",
    `Edition boundary: **${coverage.edition}**`,
    "",
    `Pinned VRI revision: \`${revision}\``,
    "",
    "| Gate | Value |",
    "| --- | ---: |",
    `| Expected VRI Mūla sources | ${coverage.expectedWorks} |`,
    `| Mapped volumes | ${coverage.mappedWorks} |`,
    `| Imported volumes | ${coverage.importedWorks} |`,
    `| Universally canonical roots | ${coverage.universallyCanonicalWorks} |`,
    `| Tradition-dependent roots | ${coverage.traditionDependentWorks} |`,
    `| Universally canonical segments | ${coverage.canonicalSegmentCount} |`,
    `| Tradition-dependent segments | ${coverage.traditionDependentSegmentCount} |`,
    `| Missing volumes | ${coverage.missingWorks.length} |`,
    `| Unexpected root files | ${coverage.unknownFiles.length} |`,
    `| Duplicate mappings | ${coverage.duplicateMappings.length} |`,
    `| fullVriMulaNavigationImported | ${coverage.fullVriMulaNavigationImported} |`,
    `| Universal Tipiṭaka completeness claimed | ${coverage.universalTipitakaCompletenessClaim} |`,
    "",
    "## Piṭaka content",
    "",
    ...Object.entries(pitakaCounts).map(([key, value]) => `- ${key}: ${value} segments`),
    "",
    "Milindapañha and Peṭakopadesa are imported because they occur in the pinned VRI Mūla navigation. Their canonical classification is tradition-dependent and they are excluded from canonical-only filtering.",
    "",
    "## Visuddhimagga",
    "",
    `Imported separately as post-canonical: ${coverage.visuddhimagga.importedVolumes} volumes, ${coverage.visuddhimagga.segmentCount} segments.`,
    "",
    "## Blockers",
    "",
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ["None."]),
    "",
  ].join("\n");
  writeFileSync(join(REPOSITORY_ROOT, "docs/FULL_TIPITAKA_COVERAGE.md"), coverageDoc, "utf8");
  console.log(JSON.stringify(coverage, null, 2));
}

function writeInventoryOnly(source: string): void {
  const { rows, revision, sourceDate } = inventory(source);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/upstream/vri-inventory.json"), { sourceRepository: SOURCE_URL, sourceRevision: revision, sourceDate, rows });
  writeFileSync(join(REPOSITORY_ROOT, "docs/VRI_CORPUS_INVENTORY.md"), inventoryMarkdown(rows, revision), "utf8");
  console.log(`Inventoried ${rows.length} VRI XML files at ${revision}.`);
}

const command = process.argv[2] ?? "ingest";
const source = resolve(argument("--source") ?? DEFAULT_SOURCE);
if (!existsSync(join(source, "romn"))) throw new Error(`VRI source not found: ${source}`);
if (command === "inventory") writeInventoryOnly(source);
else if (command === "ingest" || command === "coverage") ingest(source);
else throw new Error(`Unknown VRI command: ${command}`);
