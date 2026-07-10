import { promises as fs } from "node:fs";
import path from "node:path";
import { TIPITAKA_CATALOG, POST_CANONICAL_CATALOG } from "../../src/lib/corpus/catalog";
import { validateManifest } from "../../src/lib/corpus/manifest";
import { CORPUS_EDITIONS } from "../../src/lib/corpus/registry";

const OUT = path.resolve(process.cwd(), "data", "corpus");

async function write(name: string, value: unknown) {
  await fs.writeFile(path.join(OUT, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  validateManifest();
  const fullCoverage = JSON.parse(await fs.readFile(path.join(OUT, "full-canon-coverage.json"), "utf8")) as {
    importedWorks: number;
    fullTipitakaImported: boolean;
    canonicalSegmentCount: number;
    visuddhimagga: { importedVolumes: number; segmentCount: number };
  };
  const englishCoverage = JSON.parse(await fs.readFile(path.join(OUT, "bilara-en-coverage.json"), "utf8")) as {
    importedEditions: number;
    importedWorks: number;
    importedSegments: number;
  };
  const canonicalMap = JSON.parse(await fs.readFile(path.join(OUT, "full-canon-map.json"), "utf8")) as Array<{
    canonicalWorkId: string;
    canonicalStatus: string;
  }>;
  let russianCoverage = { importedEditions: 0, importedWorks: 0, importedSegments: 0 };
  try {
    russianCoverage = JSON.parse(await fs.readFile(path.join(OUT, "theravada-ru-coverage.json"), "utf8")) as typeof russianCoverage;
  } catch {
    // The Russian crawl is an independent reproducible ingestion step.
  }
  const languages = ["pli", "en", "ru", "id"].map((language) => ({
    language,
    importedEditions:
      language === "pli" ? fullCoverage.importedWorks + fullCoverage.visuddhimagga.importedVolumes :
      language === "en" ? englishCoverage.importedEditions :
      language === "ru" ? russianCoverage.importedEditions : 0,
    sourceGated:
      language === "id"
        ? ["No published CC0 Indonesian Theravāda Pāli edition matches the local seed works."]
        : [],
  }));
  const coverage = {
    generatedFrom: "src/lib/corpus/registry.ts",
    importedEditionCount: fullCoverage.importedWorks + fullCoverage.visuddhimagga.importedVolumes + englishCoverage.importedEditions + russianCoverage.importedEditions,
    importedTextCount: fullCoverage.importedWorks + englishCoverage.importedWorks + russianCoverage.importedWorks + 1,
    languages,
    canonicalWorksImported: canonicalMap.filter((entry) => entry.canonicalStatus === "canonical").map((entry) => entry.canonicalWorkId),
    sourceGatedWorks: [
      {
        workId: "work-vism",
        title: "Visuddhimagga",
        canonicalStatus: "post-canonical",
        reason: "VRI Pāli is imported as post-canonical; the BPS Ñāṇamoli English edition remains excluded as all rights reserved.",
      },
    ],
    claims: {
      fullTipitakaImported: fullCoverage.fullTipitakaImported,
      structureAvailable: true,
      canonicalSegmentCount: fullCoverage.canonicalSegmentCount,
      visuddhimaggaPaliImported: fullCoverage.visuddhimagga.segmentCount > 0,
    },
  };

  await fs.mkdir(OUT, { recursive: true });
  await write("manifest.json", CORPUS_EDITIONS);
  await write("catalog.json", {
    tipitaka: TIPITAKA_CATALOG,
    postCanonical: POST_CANONICAL_CATALOG,
  });
  await write("coverage.json", coverage);
  console.log(
    `[corpus-metadata] ${CORPUS_EDITIONS.length} editions; ${coverage.importedTextCount} imported texts`
  );
}

main().catch((error) => {
  console.error("[corpus-metadata] FAILED", error);
  process.exit(1);
});
