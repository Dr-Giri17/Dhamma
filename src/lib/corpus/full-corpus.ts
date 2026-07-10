import "server-only";

import { headers } from "next/headers";
import readerIndexJson from "../../../data/corpus/vri-reader-index.json";
import coverageJson from "../../../data/corpus/full-canon-coverage.json";
import manifestJson from "../../../data/corpus/full-corpus-manifest.json";
import bilaraIndexJson from "../../../data/corpus/bilara-en-index.json";
import bilaraCoverageJson from "../../../data/corpus/bilara-en-coverage.json";
import theravadaIndexJson from "../../../data/corpus/theravada-ru-index.json";
import theravadaCoverageJson from "../../../data/corpus/theravada-ru-coverage.json";

const READER_PAGE_SIZE = 80;

export interface FullCorpusSegment {
  id: string;
  workId: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  language: "pli";
  text: string;
  canonicalStatus: "canonical" | "post-canonical";
  pitaka: "vinaya" | "sutta" | "abhidhamma" | "post-canonical";
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
  notes: Array<{ id: string; text: string; kind: string }>;
}

interface AssetPage {
  page: number;
  start: number;
  end: number;
  asset: string;
}

interface AssetIndex {
  title: string;
  workId: string;
  textId: string;
  canonicalStatus: "canonical" | "post-canonical";
  pitaka: FullCorpusSegment["pitaka"];
  collection: string;
  segmentCount: number;
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
  pages: AssetPage[];
  segments?: Array<FullCorpusSegment | TranslationCorpusSegment>;
}

interface ReaderRoute {
  asset?: string;
  assets?: string[];
  textId: string;
  workId: string;
  title: string;
  canonicalStatus: "canonical" | "post-canonical";
  start?: number;
  end?: number;
}

export interface FullCorpusReaderPage {
  slug: string;
  title: string;
  canonicalStatus: "canonical" | "post-canonical";
  pitaka: FullCorpusSegment["pitaka"];
  collection: string;
  page: number;
  pageCount: number;
  totalSegments: number;
  segments: FullCorpusSegment[];
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
}

export interface FullCorpusEditionSummary {
  workId: string;
  textId: string;
  title: string;
  canonicalStatus: "canonical" | "post-canonical";
  pitaka: FullCorpusSegment["pitaka"];
  collection: string;
  segmentCount: number;
  sourceFile: string;
}

export interface TranslationCorpusSegment {
  id: string;
  textId: string;
  segmentUid: string;
  sourceRef: string;
  language: "en" | "ru";
  text: string;
  translator: string;
  translationBasisLanguage: "pli" | "en" | "unknown";
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
  sha256: string;
  segmentOrder: number;
}

export interface TranslationReaderPage {
  canonicalId: string;
  language: "en" | "ru";
  translator: string;
  page: number;
  pageCount: number;
  totalSegments: number;
  segments: TranslationCorpusSegment[];
  sourceRevision: string;
  sourceFile: string;
  sourceUrl: string;
  licenseName: string;
  attribution: string;
}

async function publicJson<T>(asset: string): Promise<T> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("Cannot resolve corpus asset origin");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const response = await fetch(`${protocol}://${host}${asset}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Corpus asset request failed (${response.status}): ${asset}`);
  return response.json() as Promise<T>;
}

function normalizeSlug(slug: string): string {
  return decodeURIComponent(slug).toLowerCase().replace(/_/g, ".");
}

async function readAssetRange(index: AssetIndex, start: number, end: number): Promise<FullCorpusSegment[]> {
  if (index.segments) {
    return (index.segments as FullCorpusSegment[]).filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end);
  }
  const segments: FullCorpusSegment[] = [];
  for (const page of index.pages) {
    if (page.end < start || page.start > end) continue;
    const payload = await publicJson<{ segments: FullCorpusSegment[] }>(page.asset);
    segments.push(...payload.segments.filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end));
  }
  return segments;
}

export async function getFullCorpusReaderPage(slug: string, requestedPage = 1): Promise<FullCorpusReaderPage | undefined> {
  const key = normalizeSlug(slug);
  const route = (readerIndexJson as Record<string, ReaderRoute>)[key];
  if (!route) return undefined;
  const assetPaths = route.assets ?? (route.asset ? [route.asset] : []);
  if (assetPaths.length === 0) return undefined;
  const indexes = await Promise.all(assetPaths.map((asset) => publicJson<AssetIndex>(asset)));
  const totalSegments = route.start && route.end
    ? Math.max(0, route.end - route.start + 1)
    : indexes.reduce((sum, index) => sum + index.segmentCount, 0);
  const pageCount = Math.max(1, Math.ceil(totalSegments / READER_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);
  const logicalStart = (page - 1) * READER_PAGE_SIZE + 1;
  const logicalEnd = Math.min(totalSegments, logicalStart + READER_PAGE_SIZE - 1);
  const segments: FullCorpusSegment[] = [];
  if (route.start && route.end) {
    segments.push(...await readAssetRange(indexes[0], route.start + logicalStart - 1, route.start + logicalEnd - 1));
  } else {
    let offset = 0;
    for (const index of indexes) {
      const localStart = Math.max(1, logicalStart - offset);
      const localEnd = Math.min(index.segmentCount, logicalEnd - offset);
      if (localStart <= localEnd) segments.push(...await readAssetRange(index, localStart, localEnd));
      offset += index.segmentCount;
    }
  }
  const primary = indexes[0];
  return {
    slug: key,
    title: key === "visuddhimagga" ? "Visuddhimaggo" : route.title,
    canonicalStatus: route.canonicalStatus,
    pitaka: primary.pitaka,
    collection: primary.collection,
    page,
    pageCount,
    totalSegments,
    segments,
    sourceRevision: primary.sourceRevision,
    sourceFile: primary.sourceFile,
    sourceUrl: primary.sourceUrl,
    licenseName: primary.licenseName,
    attribution: primary.attribution,
  };
}

export async function getBilaraEnglishReaderPage(slug: string, requestedPage = 1): Promise<TranslationReaderPage | undefined> {
  const canonicalId = normalizeSlug(slug);
  const editions = (bilaraIndexJson as Record<string, Array<{
    canonicalId: string;
    translator: string;
    sourceFile: string;
    sourceRevision: string;
    sourceUrl: string;
    licenseName: string;
    segmentCount: number;
    asset: string;
  }>>)[canonicalId];
  const edition = editions?.[0];
  if (!edition) return undefined;
  const index = await publicJson<AssetIndex & { translator: string; pages: AssetPage[] }>(edition.asset);
  const totalSegments = edition.segmentCount;
  const pageCount = Math.max(1, Math.ceil(totalSegments / READER_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);
  const start = (page - 1) * READER_PAGE_SIZE + 1;
  const end = Math.min(totalSegments, start + READER_PAGE_SIZE - 1);
  const segments: TranslationCorpusSegment[] = [];
  if (index.segments) {
    segments.push(...(index.segments as TranslationCorpusSegment[]).filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end));
  }
  for (const assetPage of index.pages) {
    if (assetPage.end < start || assetPage.start > end) continue;
    const payload = await publicJson<{ segments: TranslationCorpusSegment[] }>(assetPage.asset);
    segments.push(...payload.segments.filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end));
  }
  return {
    canonicalId,
    language: "en",
    translator: edition.translator,
    page,
    pageCount,
    totalSegments,
    segments,
    sourceRevision: edition.sourceRevision,
    sourceFile: edition.sourceFile,
    sourceUrl: edition.sourceUrl,
    licenseName: edition.licenseName,
    attribution: "SuttaCentral Bilara",
  };
}

export async function getTheravadaRussianReaderPage(slug: string, requestedPage = 1): Promise<TranslationReaderPage | undefined> {
  const canonicalId = normalizeSlug(slug);
  const editions = (theravadaIndexJson as Record<string, Array<{
    canonicalId: string;
    translator: string;
    sourceUrl: string;
    htmlSha256: string;
    licenseName: string;
    segmentCount: number;
    asset: string;
  }>>)[canonicalId];
  const edition = editions?.[0];
  if (!edition) return undefined;
  const index = await publicJson<AssetIndex & { translator: string; pages: AssetPage[]; segments?: TranslationCorpusSegment[] }>(edition.asset);
  const totalSegments = edition.segmentCount;
  const pageCount = Math.max(1, Math.ceil(totalSegments / READER_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);
  const start = (page - 1) * READER_PAGE_SIZE + 1;
  const end = Math.min(totalSegments, start + READER_PAGE_SIZE - 1);
  const segments: TranslationCorpusSegment[] = [];
  if (index.segments) segments.push(...(index.segments as TranslationCorpusSegment[]).filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end));
  for (const assetPage of index.pages) {
    if (assetPage.end < start || assetPage.start > end) continue;
    const payload = await publicJson<{ segments: TranslationCorpusSegment[] }>(assetPage.asset);
    segments.push(...payload.segments.filter((segment) => segment.segmentOrder >= start && segment.segmentOrder <= end));
  }
  return {
    canonicalId,
    language: "ru",
    translator: edition.translator,
    page,
    pageCount,
    totalSegments,
    segments,
    sourceRevision: edition.htmlSha256,
    sourceFile: edition.sourceUrl,
    sourceUrl: edition.sourceUrl,
    licenseName: edition.licenseName,
    attribution: "Theravada.ru",
  };
}

export function fullCorpusSummary() {
  const editions = (manifestJson as { editions: Array<{ canonicalStatus: string; segmentCount: number }> }).editions;
  return {
    ...coverageJson,
    paliCanonicalWorks: editions.filter((edition) => edition.canonicalStatus === "canonical").length,
    paliPostCanonicalWorks: editions.filter((edition) => edition.canonicalStatus === "post-canonical").length,
    totalSegments: editions.reduce((sum, edition) => sum + edition.segmentCount, 0),
    englishTranslatedWorks: bilaraCoverageJson.importedWorks,
    englishSegments: bilaraCoverageJson.importedSegments,
    russianTranslatedWorks: theravadaCoverageJson.importedWorks,
    russianSegments: theravadaCoverageJson.importedSegments,
  };
}

export function fullCorpusEditions() {
  return (manifestJson as { editions: FullCorpusEditionSummary[] }).editions;
}
