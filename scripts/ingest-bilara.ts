/**
 * Bilara seed-sutta ingestion (OneShot §3, §4, §5).
 *
 * Fetches Pāli root + Sujato CC0 English translation for the 8 target texts
 * from `suttacentral/bilara-data` (branch `published`), then regenerates the
 * three corpus JSON files deterministically and in place.
 *
 * Network is required at GENERATION TIME only. Runtime reads the checked-in
 * JSON, so the app works fully offline.
 *
 * Merge strategy (OneShot §5):
 *   - keep existing Dhammapada public-domain work + its segments;
 *   - keep existing SN work, but DROP the temporary SN 56.11 "working
 *     explanation" segments and replace them with real Bilara/Sujato CC0 data;
 *   - add MN / DN / AN / Snp works with CC0/Sujato metadata if missing;
 *   - add all 8 target text records;
 *   - de-duplicate by segmentUid on every run (idempotent);
 *   - output is deterministic (sorted, stable key order).
 *
 * Run:  npm run ingest:bilara
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  BILARA_TARGETS,
  BILARA_ADDITIONAL_TRANSLATIONS,
  SUJATO_PROVENANCE,
  ROOT_EDITION,
  bilaraUrl,
  additionalTranslationPath,
  additionalTranslationRecord,
  buildSegment,
  rootPath,
  translationPath,
  uidToSourceRef,
} from "../src/lib/corpus/bilara";
import { KNOWN_LICENSES } from "../src/lib/corpus/licenses";
import type {
  DhammaSegment,
  DhammaText,
  SourceWork,
} from "../src/lib/corpus/types";

const CORPUS_DIR = path.resolve(process.cwd(), "data", "corpus");
const FILES = {
  works: path.join(CORPUS_DIR, "works.json"),
  texts: path.join(CORPUS_DIR, "texts.json"),
  segments: path.join(CORPUS_DIR, "segments.json"),
} as const;

// --- works to keep or create -------------------------------------------------

/** MN / DN / AN / Snp works — CC0/Sujato. */
const NEW_WORKS: SourceWork[] = [
  work("work-mn", "majjhima-nikaya", "Majjhima Nikāya", "Majjhima Nikāya", "mn", "sutta"),
  work("work-dn", "digha-nikaya", "Dīgha Nikāya", "Dīgha Nikāya", "dn", "sutta"),
  work("work-an", "anguttara-nikaya", "Aṅguttara Nikāya", "Aṅguttara Nikāya", "an", "sutta"),
  work("work-snp", "sutta-nipata", "Sutta Nipāta", "Sutta Nipāta", "kn", "sutta"),
];

function work(
  id: string,
  slug: string,
  title: string,
  titlePali: string,
  nikaya: string,
  pitaka: "sutta"
): SourceWork {
  return {
    id,
    slug,
    title,
    titlePali,
    tradition: "theravada",
    category: "canonical",
    pitaka,
    nikaya: nikaya as SourceWork["nikaya"],
    sourceProvider: "bilara",
    license: SUJATO_PROVENANCE.license,
    licenseNote:
      "Bhikkhu Sujato translation, CC0, via SuttaCentral/Bilara (bilara-data branch `published`). Pāli root (Mahāsaṅgīti) is public domain.",
    translator: SUJATO_PROVENANCE.translator,
    language: "en",
    version: "bilara-published",
    importedAt: "2026-07-07T00:00:00.000Z",
  };
}

// --- fetch helpers -----------------------------------------------------------

async function fetchJson(url: string): Promise<Record<string, string>> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

/**
 * Merge two Bilara segment maps (root + translation) by segmentUid, preserving
 * insertion order of the UNION. Translation order is the dominant ordering
 * because it is the reading order the user sees; root-only segments are
 * appended in their own order. This keeps `segmentOrder` stable across runs.
 */
function mergeSegmentMaps(
  root: Record<string, string>,
  translation: Record<string, string>
): Array<{ uid: string; root?: string; translation?: string }> {
  const seen = new Set<string>();
  const out: Array<{ uid: string; root?: string; translation?: string }> = [];

  // 1) translation order first
  for (const uid of Object.keys(translation)) {
    out.push({ uid, root: root[uid], translation: translation[uid] });
    seen.add(uid);
  }
  // 2) any root-only segments
  for (const uid of Object.keys(root)) {
    if (!seen.has(uid)) {
      out.push({ uid, root: root[uid] });
      seen.add(uid);
    }
  }
  return out;
}

// --- main --------------------------------------------------------------------

async function main() {
  console.log("[bilara-ingest] fetching seed suttas from bilara-data/published ...");

  // Fetch all targets.
  const perTarget = await Promise.all(
    BILARA_TARGETS.map(async (t) => {
      const rootUrl = bilaraUrl(rootPath(t));
      const transUrl = bilaraUrl(translationPath(t));
      console.log(`  • ${t.uid}: root + translation`);
      const additionalTargets = BILARA_ADDITIONAL_TRANSLATIONS.filter(
        (candidate) => candidate.uid === t.uid
      );
      const [root, translation, ...additionalMaps] = await Promise.all([
        fetchJson(rootUrl),
        fetchJson(transUrl),
        ...additionalTargets.map((candidate) =>
          fetchJson(bilaraUrl(additionalTranslationPath(candidate)))
        ),
      ]);
      const additional = additionalTargets.map((candidate, index) => ({
        target: candidate,
        segments: additionalMaps[index],
      }));
      return { target: t, root, translation, additional };
    })
  );

  console.log("[bilara-ingest] building texts + segments ...");

  const newTexts: DhammaText[] = [];
  const newSegments: DhammaSegment[] = [];
  for (const { target, root, translation, additional } of perTarget) {
    const sourceRef = uidToSourceRef(target.uid);
    newTexts.push({
      id: `text-${target.uid.replace(/\W/g, "")}`,
      workId: target.workId,
      uid: target.uid,
      slug: target.uid,
      title: sourceRef,
      titlePali: sourceRef,
      collection: sourceRef.split(" ")[0],
      orderIndex: 0,
      metadata: { ingestedFrom: "bilara-data/published", rootEdition: ROOT_EDITION },
    });

    const merged = mergeSegmentMaps(root, translation);
    merged.forEach((entry, idx) => {
      newSegments.push(
        buildSegment({
          uid: target.uid,
          textId: `text-${target.uid.replace(/\W/g, "")}`,
          segmentUid: entry.uid,
          segmentOrder: idx + 1,
          rootText: entry.root,
          translationText: entry.translation,
          translationSourcePath: translationPath(target),
          translations: Object.fromEntries(
            additional.flatMap(({ target: translationTarget, segments }) => {
              const translated = segments[entry.uid];
              return translated
                ? [
                    [
                      translationTarget.language,
                      additionalTranslationRecord(translationTarget, translated),
                    ],
                  ]
                : [];
            })
          ),
        })
      );
    });
  }

  // --- Load existing corpus and merge ---------------------------------------
  console.log("[bilara-ingest] merging with existing corpus ...");
  const [existingWorks, existingTexts, existingSegments] = await Promise.all([
    readJson<SourceWork[]>(FILES.works),
    readJson<DhammaText[]>(FILES.texts),
    readJson<DhammaSegment[]>(FILES.segments),
  ]);

  // Works: keep Dhammapada + Visuddhimagga(schema-only) + SN; add the new ones.
  const keepWorkIds = new Set(["work-dhp", "work-sn", "work-vism"]);
  const keptWorks = existingWorks.filter((w) => keepWorkIds.has(w.id));
  const works = dedupeById([...keptWorks, ...NEW_WORKS]);

  // The SN work gets refreshed metadata to reflect real Bilara ingestion now.
  const sn = works.find((w) => w.id === "work-sn");
  if (sn) {
    sn.sourceProvider = "bilara";
    sn.license = SUJATO_PROVENANCE.license;
    sn.translator = SUJATO_PROVENANCE.translator;
    sn.licenseNote =
      "Bhikkhu Sujato translation, CC0, via SuttaCentral/Bilara (bilara-data branch `published`). Pāli root (Mahāsaṅgīti) is public domain.";
    sn.version = "bilara-published";
  }

  // Texts: keep Dhammapada text; SN 56.11 text record reused (updated slug).
  const keepTextIds = new Set(["text-dhp", "text-sn56.11"]);
  const keptTexts = existingTexts
    .filter((t) => keepTextIds.has(t.id))
    .map((t) =>
      t.id === "text-sn56.11"
        ? {
            ...t,
            workId: "work-sn",
            uid: "sn56.11",
            slug: "sn56.11",
            title: "SN 56.11 — Dhammacakkappavattana Sutta",
            titlePali: "Dhammacakkappavattana Sutta",
            metadata: { ingestedFrom: "bilara-data/published", rootEdition: ROOT_EDITION },
          }
        : t
    );
  // point the SN 56.11 target textId at the existing id "text-sn56.11"
  for (const t of newTexts) {
    if (t.uid === "sn56.11") t.id = "text-sn56.11";
  }
  for (const s of newSegments) {
    if (s.textId === "text-sn5611") s.textId = "text-sn56.11";
  }
  const texts = dedupeById([...keptTexts, ...newTexts]);

  // Segments: keep Dhammapada segments; DROP all old SN 56.11 working-explanation
  // segments; add the freshly-ingested Bilara segments. De-dupe by segmentUid.
  const dhpSegments = existingSegments.filter(
    (s) => s.textId === "text-dhp" && s.segmentUid.startsWith("dhp:")
  );
  const segmentsByUid = new Map<string, DhammaSegment>();
  for (const s of dhpSegments) segmentsByUid.set(s.segmentUid, s);
  for (const s of newSegments) segmentsByUid.set(s.segmentUid, s);
  const segments = [...segmentsByUid.values()].sort(compareSegment);

  // --- Write deterministic JSON ---------------------------------------------
  console.log("[bilara-ingest] writing corpus JSON ...");
  await fs.mkdir(CORPUS_DIR, { recursive: true });
  await writeJson(FILES.works, works);
  await writeJson(FILES.texts, texts);
  await writeJson(FILES.segments, segments);

  console.log(
    `[bilara-ingest] done: ${works.length} works, ${texts.length} texts, ${segments.length} segments.`
  );
}

// --- utils -------------------------------------------------------------------

async function readJson<T>(file: string): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return [] as unknown as T;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  const sorted = sortForOutput(data);
  await fs.writeFile(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

/** Deterministic key ordering: top-level arrays sorted by a stable key. */
function sortForOutput(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  const arr = data as Array<Record<string, unknown>>;
  const byId = arr.every((x) => x && typeof x.id === "string");
  if (byId) return [...arr].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return arr;
}

function compareSegment(a: DhammaSegment, b: DhammaSegment): number {
  // textId then segmentOrder for readability
  if (a.textId !== b.textId) return a.textId.localeCompare(b.textId);
  return a.segmentOrder - b.segmentOrder;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}

void KNOWN_LICENSES; // referenced for clarity; values used via SUJATO_PROVENANCE

main().catch((err) => {
  console.error("[bilara-ingest] FAILED:", err);
  process.exit(1);
});
