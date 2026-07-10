import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const DEFAULT_CACHE = "D:/Work/Dhamma-corpus-inbox/theravada-cache/crawler";
const DEFAULT_BILARA = "D:/Work/Dhamma-corpus-inbox/upstream/bilara-data";
const BASE_URL = "https://www.theravada.ru/";
const INDEX_URL = `${BASE_URL}Teaching/Canon/Suttanta/all-suttas-list.htm`;
const ROBOTS_URL = `${BASE_URL}robots.txt`;
const USER_AGENT = "DhammaCorpusAudit/1.0 (+https://github.com/Dr-Giri17/Dhamma)";
const PAGE_SIZE = 100;

type Decision =
  | "allowed-with-direct-link"
  | "conflicting-notice"
  | "third-party-pdf"
  | "metadata-only"
  | "unmapped"
  | "excluded"
  | "excluded-robots";

interface CachedResponse {
  bytes: Buffer;
  retrievedAt: string;
  status: number;
  contentType: string;
}

interface InventoryRow {
  canonicalId: string | null;
  russianTitle: string;
  paliTitle: string;
  collection: string;
  translator: string;
  baseEnglishTranslator: string | null;
  translationChain: string;
  translationBasisLanguage: "pli" | "en" | "unknown";
  sourceUrl: string;
  pageTitle: string;
  retrievedAt: string;
  htmlSha256: string;
  copyrightNotice: string | null;
  importDecision: Decision;
  segmentCount: number;
  asset?: string;
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function decodeWindows1251(bytes: Buffer): string {
  return new TextDecoder("windows-1251").decode(bytes);
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    laquo: "«", raquo: "»", ndash: "–", mdash: "—", hellip: "…",
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => named[name.toLowerCase()] ?? whole);
}

function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<sup\b[\s\S]*?<\/sup>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .normalize("NFC")
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function filesUnder(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

function canonicalRoots(bilara: string): Set<string> {
  const root = join(bilara, "root", "pli", "ms");
  const ids = new Set<string>();
  for (const path of filesUnder(root)) {
    const match = /^(.*?)_root-pli-ms\.json$/i.exec(basename(path));
    if (match) ids.add(match[1].toLowerCase());
  }
  return ids;
}

function hasCanonicalRoot(canonicalId: string, roots: Set<string>): boolean {
  if (roots.has(canonicalId)) return true;
  const match = /^([a-z]+\d+)\.(\d+)$/i.exec(canonicalId);
  if (!match) return false;
  const number = Number(match[2]);
  for (const rootId of roots) {
    const range = new RegExp(`^${match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.(\\d+)-(\\d+)$`, "i").exec(rootId);
    if (range && number >= Number(range[1]) && number <= Number(range[2])) return true;
  }
  return false;
}

function cachePaths(cache: string, url: string): { body: string; meta: string } {
  const key = sha256(url);
  return { body: join(cache, "pages", `${key}.bin`), meta: join(cache, "pages", `${key}.meta.json`) };
}

async function cachedFetch(cache: string, url: string): Promise<CachedResponse> {
  const paths = cachePaths(cache, url);
  if (existsSync(paths.body) && existsSync(paths.meta)) {
    const meta = JSON.parse(readFileSync(paths.meta, "utf8")) as Omit<CachedResponse, "bytes">;
    return { ...meta, bytes: readFileSync(paths.body) };
  }
  mkdirSync(dirname(paths.body), { recursive: true });
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "user-agent": USER_AGENT }, redirect: "follow" });
      const bytes = Buffer.from(await response.arrayBuffer());
      const meta = {
        retrievedAt: new Date().toISOString(),
        status: response.status,
        contentType: response.headers.get("content-type") ?? "",
      };
      writeFileSync(paths.body, bytes);
      writeFileSync(paths.meta, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
      await sleep(75);
      return { ...meta, bytes };
    } catch (error) {
      lastError = error;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)].map((match) => match[1].trim());
}

function canonicalIdFromUrl(url: string): string | null {
  const file = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  const match = /^(dn\d+|mn\d+|sn\d+_\d+|an\d+_\d+|snp\d+_\d+|kp\d+|dhp\d+|ud\d+_\d+|iti\d+|vv\d+_\d+|pv\d+_\d+|thag\d+_\d+|thig\d+_\d+|ja\d+)/i.exec(file);
  return match ? match[1].toLowerCase().replace("_", ".") : null;
}

function collectionOf(canonicalId: string | null): string {
  return /^[a-z]+/i.exec(canonicalId ?? "")?.[0]?.toLowerCase() ?? "unknown";
}

function robotsDisallows(robots: string): string[] {
  const lines = robots.split(/\r?\n/);
  const disallow: string[] = [];
  let applies = false;
  for (const line of lines) {
    const clean = line.replace(/#.*/, "").trim();
    if (/^user-agent\s*:/i.test(clean)) applies = /^user-agent\s*:\s*\*/i.test(clean);
    else if (applies) {
      const match = /^disallow\s*:\s*(\S+)/i.exec(clean);
      if (match?.[1]) disallow.push(match[1]);
    }
  }
  return disallow;
}

function mainTextSegments(html: string): string[] {
  const cellMatch = /<td\b[^>]*style=["'][^"']*text-align\s*:\s*justify[^"']*["'][^>]*>/i.exec(html);
  if (!cellMatch || cellMatch.index === undefined) return [];
  const start = cellMatch.index + cellMatch[0].length;
  const end = html.indexOf("</td>", start);
  if (end < start) return [];
  const text = stripHtml(html.slice(start, end));
  return text
    .split(/\n+/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter((segment) => segment.length >= 2);
}

function metadataFromHtml(html: string) {
  const pageTitle = stripHtml(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const russianTitle = pageTitle.split("::")[0]?.trim() ?? pageTitle;
  const paliTitle = /(?:Пали|Pāli)\s*:\s*([^<\n]+)/i.exec(html)?.[1]?.trim() ?? "";
  const englishMatch = /Перевод\s+с\s+английского\s*:\s*([^<\n]+)/i.exec(html);
  const paliMatch = /Перевод\s+с\s+пали\s*:\s*([^<\n]+)/i.exec(html);
  const genericMatch = /Перевод(?:чик)?\s*:\s*([^<\n]+)/i.exec(html);
  const translator = stripHtml((englishMatch ?? paliMatch ?? genericMatch)?.[1] ?? "не указан") || "не указан";
  const translationBasisLanguage = englishMatch ? "en" : paliMatch ? "pli" : "unknown";
  const sourceMatch = /источник\s*:\s*(?:<br\s*\/?>)?([\s\S]{0,500}?)(?:<\/div>|<\/td>)/i.exec(html)?.[1];
  const translationChain = sourceMatch ? stripHtml(sourceMatch) : "не указана";
  const baseEnglishTranslator = translationBasisLanguage === "en" && translationChain !== "не указана" ? translationChain : null;
  const conflict = /(все\s+права\s+защищены|all\s+rights\s+reserved|копировани\w*\s+запрещено|запрещается\s+копировани)/i.exec(html);
  return {
    pageTitle,
    russianTitle,
    paliTitle,
    translator,
    translationBasisLanguage: translationBasisLanguage as "pli" | "en" | "unknown",
    translationChain,
    baseEnglishTranslator,
    copyrightNotice: conflict ? stripHtml(conflict[0]) : null,
  };
}

function writeJson(path: string, value: unknown, compact = false): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, compact ? undefined : 2)}\n`, "utf8");
}

async function crawl(): Promise<void> {
  const cache = resolve(argument("--cache") ?? DEFAULT_CACHE);
  const bilara = resolve(argument("--bilara") ?? DEFAULT_BILARA);
  const roots = canonicalRoots(bilara);
  const robotsResponse = await cachedFetch(cache, ROBOTS_URL);
  const disallowed = robotsDisallows(decodeWindows1251(robotsResponse.bytes));
  const indexResponse = await cachedFetch(cache, INDEX_URL);
  const indexHtml = decodeWindows1251(indexResponse.bytes);
  const candidates = [...new Set(hrefs(indexHtml)
    .filter((href) => /(?:^|\/)Texts\//i.test(href))
    .map((href) => new URL(href, INDEX_URL).href))]
    .sort((a, b) => a.localeCompare(b));
  const inventory: InventoryRow[] = [];
  const editionsByCanonicalId: Record<string, Array<Record<string, unknown>>> = {};
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
    const sourceUrl = candidates[candidateIndex];
    const url = new URL(sourceUrl);
    const canonicalId = canonicalIdFromUrl(sourceUrl);
    const collection = collectionOf(canonicalId);
    const blocked = disallowed.some((path) => url.pathname.startsWith(path));
    if (blocked) {
      inventory.push({ canonicalId, russianTitle: "", paliTitle: "", collection, translator: "не указан", baseEnglishTranslator: null, translationChain: "не указана", translationBasisLanguage: "unknown", sourceUrl, pageTitle: "", retrievedAt: robotsResponse.retrievedAt, htmlSha256: "", copyrightNotice: null, importDecision: "excluded-robots", segmentCount: 0 });
      continue;
    }
    if (/\.pdf(?:$|\?)/i.test(sourceUrl) || url.hostname !== "www.theravada.ru") {
      inventory.push({ canonicalId, russianTitle: "", paliTitle: "", collection, translator: "не указан", baseEnglishTranslator: null, translationChain: "не указана", translationBasisLanguage: "unknown", sourceUrl, pageTitle: "", retrievedAt: indexResponse.retrievedAt, htmlSha256: "", copyrightNotice: null, importDecision: "third-party-pdf", segmentCount: 0 });
      continue;
    }
    const response = await cachedFetch(cache, sourceUrl);
    const html = decodeWindows1251(response.bytes);
    const metadata = metadataFromHtml(html);
    const segments = mainTextSegments(html);
    let importDecision: Decision = "allowed-with-direct-link";
    if (response.status !== 200 || segments.length === 0) importDecision = "metadata-only";
    else if (!canonicalId || !hasCanonicalRoot(canonicalId, roots)) importDecision = "unmapped";
    else if (metadata.copyrightNotice) importDecision = "conflicting-notice";
    const row: InventoryRow = {
      canonicalId,
      russianTitle: metadata.russianTitle,
      paliTitle: metadata.paliTitle,
      collection,
      translator: metadata.translator,
      baseEnglishTranslator: metadata.baseEnglishTranslator,
      translationChain: metadata.translationChain,
      translationBasisLanguage: metadata.translationBasisLanguage,
      sourceUrl,
      pageTitle: metadata.pageTitle,
      retrievedAt: response.retrievedAt,
      htmlSha256: sha256(response.bytes),
      copyrightNotice: metadata.copyrightNotice,
      importDecision,
      segmentCount: importDecision === "allowed-with-direct-link" ? segments.length : 0,
    };
    if (importDecision === "allowed-with-direct-link" && canonicalId) {
      const editionId = sha256(sourceUrl).slice(0, 12);
      const directoryRelative = `public/corpus/ru/${canonicalId}/${editionId}`;
      const directory = join(REPOSITORY_ROOT, directoryRelative);
      mkdirSync(directory, { recursive: true });
      const normalizedSegments = segments.map((text, index) => {
        const segmentUid = `${canonicalId}:ru:${editionId}:${String(index + 1).padStart(4, "0")}`;
        return {
          id: `seg-${sha256(segmentUid).slice(0, 20)}`,
          workId: `work-theravada-${canonicalId}`,
          textId: `text-theravada-${canonicalId}-${editionId}`,
          segmentUid,
          sourceRef: `${sourceUrl}#segment-${index + 1}`,
          language: "ru",
          text,
          canonicalStatus: "canonical",
          translator: metadata.translator,
          translationBasisLanguage: metadata.translationBasisLanguage,
          translationChain: metadata.translationChain,
          sourceRevision: row.htmlSha256,
          sourceFile: sourceUrl,
          sourceUrl,
          licenseName: "Theravada.ru — copying with a direct site link",
          attribution: "Theravada.ru",
          sha256: sha256(text),
          segmentOrder: index + 1,
        };
      });
      const pages: Array<Record<string, unknown>> = [];
      const inlineSegments = normalizedSegments.length <= PAGE_SIZE ? normalizedSegments : undefined;
      if (!inlineSegments) {
        for (let offset = 0; offset < normalizedSegments.length; offset += PAGE_SIZE) {
          const page = pages.length + 1;
          const pageSegments = normalizedSegments.slice(offset, offset + PAGE_SIZE);
          const name = `page-${String(page).padStart(4, "0")}.json.gz`;
          const relativeAsset = `${directoryRelative}/${name}`;
          const payload = `${JSON.stringify({ schemaVersion: 1, canonicalId, editionId, language: "ru", page, segments: pageSegments })}\n`;
          const bytes = gzipSync(Buffer.from(payload), { level: 9 });
          writeFileSync(join(directory, name), bytes);
          pages.push({ page, start: offset + 1, end: offset + pageSegments.length, segmentCount: pageSegments.length, asset: `/${relativeAsset.replace(/^public\//, "")}`, sha256: sha256(bytes) });
        }
      }
      const indexRelative = `${directoryRelative}/index.json.gz`;
      const indexPayload = `${JSON.stringify({
        schemaVersion: 1,
        canonicalId,
        editionId,
        title: metadata.russianTitle,
        language: "ru",
        translator: metadata.translator,
        translationBasisLanguage: metadata.translationBasisLanguage,
        translationChain: metadata.translationChain,
        sourceUrl,
        retrievedAt: response.retrievedAt,
        htmlSha256: row.htmlSha256,
        licenseName: "Theravada.ru — copying with a direct site link",
        attribution: "Theravada.ru",
        segmentCount: normalizedSegments.length,
        pageSize: PAGE_SIZE,
        pageCount: pages.length,
        pages,
        segments: inlineSegments,
      })}\n`;
      const indexBytes = gzipSync(Buffer.from(indexPayload), { level: 9 });
      writeFileSync(join(directory, "index.json.gz"), indexBytes);
      row.asset = `/${indexRelative.replace(/^public\//, "")}`;
      (editionsByCanonicalId[canonicalId] ??= []).push({ canonicalId, editionId, title: metadata.russianTitle, translator: metadata.translator, translationBasisLanguage: metadata.translationBasisLanguage, translationChain: metadata.translationChain, sourceUrl, retrievedAt: response.retrievedAt, htmlSha256: row.htmlSha256, licenseName: "Theravada.ru — copying with a direct site link", segmentCount: normalizedSegments.length, asset: row.asset, sha256: sha256(indexBytes) });
    }
    inventory.push(row);
    if ((candidateIndex + 1) % 100 === 0) console.log(`Theravada crawl ${candidateIndex + 1}/${candidates.length}`);
  }
  for (const editions of Object.values(editionsByCanonicalId)) editions.sort((a, b) => String(a.sourceUrl).localeCompare(String(b.sourceUrl)));
  const imported = inventory.filter((row) => row.importDecision === "allowed-with-direct-link");
  const coverage = {
    crawlDate: inventory.map((row) => row.retrievedAt).filter(Boolean).sort().at(-1) ?? indexResponse.retrievedAt,
    robotsUrl: ROBOTS_URL,
    indexUrl: INDEX_URL,
    inventoryPages: inventory.length,
    importedEditions: imported.length,
    importedWorks: new Set(imported.map((row) => row.canonicalId)).size,
    importedSegments: imported.reduce((sum, row) => sum + row.segmentCount, 0),
    excludedPages: inventory.length - imported.length,
    decisions: Object.fromEntries([...new Set(inventory.map((row) => row.importDecision))].sort().map((decision) => [decision, inventory.filter((row) => row.importDecision === decision).length])),
    directAttributionLinks: imported.filter((row) => /^https:\/\/www\.theravada\.ru\//.test(row.sourceUrl)).length,
  };
  writeJson(join(REPOSITORY_ROOT, "data/corpus/upstream/theravada-ru-inventory.json"), { source: BASE_URL, crawlPolicy: { concurrency: 1, userAgent: USER_AGENT, robotsUrl: ROBOTS_URL, cache: "external-not-committed" }, rows: inventory }, true);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/theravada-ru-index.json"), editionsByCanonicalId, true);
  writeJson(join(REPOSITORY_ROOT, "data/corpus/theravada-ru-coverage.json"), coverage);
  const doc = [
    "# Theravada.ru Russian corpus inventory",
    "",
    `Crawl date: ${coverage.crawlDate}`,
    "",
    `Discovery: [canonical all-suttas list](${INDEX_URL}); robots policy checked at [robots.txt](${ROBOTS_URL}).`,
    "",
    "The crawler uses one request at a time, a descriptive user-agent, retry with backoff, and an external byte cache. Disallowed paths are inventoried but never fetched.",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Inventory pages | ${coverage.inventoryPages} |`,
    `| Imported attributed editions | ${coverage.importedEditions} |`,
    `| Unique canonical works | ${coverage.importedWorks} |`,
    `| Russian segments | ${coverage.importedSegments} |`,
    `| Excluded pages | ${coverage.excludedPages} |`,
    `| Direct Theravada.ru links | ${coverage.directAttributionLinks} |`,
    "",
    "## Decisions",
    "",
    ...Object.entries(coverage.decisions).map(([decision, count]) => `- ${decision}: ${count}`),
    "",
    "Translator and translation-basis fields are extracted from the page. Missing values remain explicit; they are never inferred from English or from filenames.",
    "",
  ].join("\n");
  writeFileSync(join(REPOSITORY_ROOT, "docs/THERAVADA_RU_INVENTORY.md"), doc, "utf8");
  console.log(JSON.stringify(coverage, null, 2));
}

const command = process.argv[2] ?? "ingest";
if (command !== "inventory" && command !== "ingest") throw new Error(`Unknown Theravada command: ${command}`);
void crawl().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
