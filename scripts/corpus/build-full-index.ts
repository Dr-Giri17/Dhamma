import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { canonicalJson, deterministicGzip, sha256 } from "./deterministic";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const CORPUS_ROOT = join(REPOSITORY_ROOT, "public", "corpus");
const INDEX_ROOT = join(REPOSITORY_ROOT, "public", "corpus", "indexes");
const POSTING_LIMIT = 128;

interface SourceSegment {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  sourceUrl: string;
  text: string;
  language: "pli" | "en" | "ru";
  canonicalStatus: "canonical" | "tradition-dependent" | "post-canonical";
  collection?: string;
  translator?: string;
  attribution: string;
}

interface IndexedDocument {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  sourceUrl: string;
  excerpt: string;
  language: "pli" | "en" | "ru";
  canonicalStatus: "canonical" | "tradition-dependent" | "post-canonical";
  collection: string;
  translator?: string;
  attribution: string;
}

function filesUnder(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path));
    else if (entry.isFile() && /^(?:page-\d+|index)\.json(?:\.gz)?$/i.test(entry.name)) found.push(path);
  }
  return found;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 3 && token.length <= 40))];
}

function collectionFor(segment: SourceSegment): string {
  if (segment.collection === "kn") {
    const volume = /text-vri-(s05\d+[a-z0-9]*)/i.exec(segment.textId)?.[1];
    if (volume) return `kn-${volume.toLowerCase()}`;
  }
  if (segment.collection) return segment.collection.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const prefix = /^[a-z]+/i.exec(segment.segmentUid)?.[0]?.toLowerCase();
  return prefix || "other";
}

function evenlyBounded(documentIds: number[]): number[] {
  if (documentIds.length <= POSTING_LIMIT) return documentIds;
  const selected: number[] = [];
  for (let index = 0; index < POSTING_LIMIT; index++) {
    selected.push(documentIds[Math.floor(index * (documentIds.length - 1) / (POSTING_LIMIT - 1))]);
  }
  return [...new Set(selected)];
}

function addDocument(groups: Map<string, { documents: IndexedDocument[]; postings: Record<string, number[]> }>, segment: SourceSegment): void {
  const collection = collectionFor(segment);
  const key = `${segment.language}/${collection}`;
  const group = groups.get(key) ?? { documents: [], postings: {} };
  if (!groups.has(key)) groups.set(key, group);
  const documentId = group.documents.length;
  group.documents.push({
    id: segment.id,
    textId: segment.textId,
    segmentUid: segment.segmentUid,
    sourceRef: segment.sourceRef,
    sourceUrl: segment.sourceUrl,
    excerpt: segment.text.slice(0, 160),
    language: segment.language,
    canonicalStatus: segment.canonicalStatus,
    collection,
    translator: segment.translator,
    attribution: segment.attribution,
  });
  for (const token of tokens(segment.text)) (group.postings[token] ??= []).push(documentId);
}

function addSeedRussian(groups: Map<string, { documents: IndexedDocument[]; postings: Record<string, number[]> }>): void {
  const seed = JSON.parse(readFileSync(join(REPOSITORY_ROOT, "data", "corpus", "segments.json"), "utf8")) as Array<{
    id: string;
    textId: string;
    segmentUid: string;
    sourceRef: string;
    translations?: { ru?: { text: string; translator: string; sourcePath?: string } };
  }>;
  for (const segment of seed) {
    const russian = segment.translations?.ru;
    if (!russian?.text.trim()) continue;
    const sourcePath = russian.sourcePath ?? "";
    addDocument(groups, {
      id: `${segment.id}-ru`,
      textId: segment.textId,
      segmentUid: `${segment.segmentUid}:ru`,
      sourceRef: segment.sourceRef,
      sourceUrl: sourcePath ? `https://github.com/suttacentral/bilara-data/blob/ba752906b439d3c1abb870044c1b38e39f8cdb21/${sourcePath}` : "",
      text: russian.text.normalize("NFC"),
      language: "ru",
      canonicalStatus: "canonical",
      collection: /^[a-z]+/i.exec(segment.segmentUid)?.[0]?.toLowerCase(),
      translator: russian.translator,
      attribution: "SuttaCentral Bilara (CC0)",
    });
  }
}

function build(): void {
  const groups = new Map<string, { documents: IndexedDocument[]; postings: Record<string, number[]> }>();
  for (const language of ["pli", "en", "ru"] as const) {
    const root = join(CORPUS_ROOT, language);
    let files: string[] = [];
    try { files = filesUnder(root); } catch { continue; }
    for (const path of files) {
      const bytes = readFileSync(path);
      const decoded = path.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8");
      const payload = JSON.parse(decoded) as { segments?: SourceSegment[] };
      for (const segment of payload.segments ?? []) {
        addDocument(groups, { ...segment, language });
      }
    }
  }
  addSeedRussian(groups);
  const manifest: Array<Record<string, unknown>> = [];
  for (const [key, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const [language, collection] = key.split("/") as ["pli" | "en" | "ru", string];
    const { documents } = group;
    const postings = Object.fromEntries(Object.entries(group.postings).map(([term, ids]) => [term, evenlyBounded(ids)]));
    const outputRelative = `corpus/indexes/${language}/${collection}.json.gz`;
    const output = join(REPOSITORY_ROOT, "public", outputRelative);
    mkdirSync(dirname(output), { recursive: true });
    const payload = `${JSON.stringify({ schemaVersion: 1, language, collection, documentCount: documents.length, documents, postings })}\n`;
    const contentBytes = Buffer.from(payload, "utf8");
    const outputBytes = deterministicGzip(contentBytes);
    writeFileSync(output, outputBytes);
    manifest.push({ language, collection, documentCount: documents.length, termCount: Object.keys(postings).length, asset: `/${outputRelative}`, byteSize: outputBytes.length, contentSha256: sha256(contentBytes), compressedSha256: sha256(outputBytes) });
  }
  const manifestPath = join(REPOSITORY_ROOT, "data", "corpus", "full-search-manifest.json");
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, canonicalJson({ schemaVersion: 1, postingLimit: POSTING_LIMIT, postingSelection: "evenly-distributed-across-document-order", shards: manifest }, true), "utf8");
  console.log(`Built ${manifest.length} language/collection search shards.`);
}

build();
