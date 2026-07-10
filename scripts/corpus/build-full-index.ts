import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const CORPUS_ROOT = join(REPOSITORY_ROOT, "public", "corpus");
const INDEX_ROOT = join(REPOSITORY_ROOT, "public", "corpus", "indexes");
const POSTING_LIMIT = 40;

interface SourceSegment {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  sourceUrl: string;
  text: string;
  language: "pli" | "en" | "ru";
  canonicalStatus: "canonical" | "post-canonical";
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
  canonicalStatus: "canonical" | "post-canonical";
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
        const collection = collectionFor(segment);
        const key = `${language}/${collection}`;
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
          language,
          canonicalStatus: segment.canonicalStatus,
          collection,
          translator: segment.translator,
          attribution: segment.attribution,
        });
        for (const token of tokens(segment.text)) {
          const values = (group.postings[token] ??= []);
          if (values.length < POSTING_LIMIT) values.push(documentId);
        }
      }
    }
  }
  const manifest: Array<Record<string, unknown>> = [];
  for (const [key, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const [language, collection] = key.split("/") as ["pli" | "en" | "ru", string];
    const { documents, postings } = group;
    const outputRelative = `corpus/indexes/${language}/${collection}.json.gz`;
    const output = join(REPOSITORY_ROOT, "public", outputRelative);
    mkdirSync(dirname(output), { recursive: true });
    const payload = `${JSON.stringify({ schemaVersion: 1, language, collection, documentCount: documents.length, documents, postings })}\n`;
    const outputBytes = gzipSync(Buffer.from(payload), { level: 9 });
    writeFileSync(output, outputBytes);
    manifest.push({ language, collection, documentCount: documents.length, termCount: Object.keys(postings).length, asset: `/${outputRelative}`, byteSize: outputBytes.length });
  }
  const manifestPath = join(REPOSITORY_ROOT, "data", "corpus", "full-search-manifest.json");
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify({ schemaVersion: 1, postingLimit: POSTING_LIMIT, shards: manifest }, null, 2)}\n`, "utf8");
  console.log(`Built ${manifest.length} language/collection search shards.`);
}

build();
