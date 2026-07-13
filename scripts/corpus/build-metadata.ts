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
    fullVriMulaNavigationImported: boolean;
    universallyCanonicalWorks: number;
    traditionDependentWorks: number;
    traditionDependentSegmentCount: number;
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
  const seedSegments = JSON.parse(await fs.readFile(path.join(OUT, "segments.json"), "utf8")) as Array<{
    textId: string;
    translations?: { ru?: { text?: string } };
  }>;
  const russianSeed = seedSegments.filter((segment) => Boolean(segment.translations?.ru?.text?.trim()));
  const russianCoverage = {
    importedEditions: new Set(russianSeed.map((segment) => segment.textId)).size,
    importedWorks: new Set(russianSeed.map((segment) => segment.textId)).size,
    importedSegments: russianSeed.length,
  };
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
      {
        workId: "work-vri-s0518m",
        title: "Milindapañhapāḷi",
        canonicalStatus: "tradition-dependent",
        reason: "Included in VRI Mūla navigation; canonical classification varies between traditional editions and classification systems.",
      },
      {
        workId: "work-vri-s0520m",
        title: "Peṭakopadesapāḷi",
        canonicalStatus: "tradition-dependent",
        reason: "Included in VRI Mūla navigation; canonical classification varies between traditional editions and classification systems.",
      },
    ],
    claims: {
      fullVriMulaNavigationImported: fullCoverage.fullVriMulaNavigationImported,
      universalTipitakaCompletenessClaim: false,
      structureAvailable: true,
      canonicalSegmentCount: fullCoverage.canonicalSegmentCount,
      traditionDependentSegmentCount: fullCoverage.traditionDependentSegmentCount,
      visuddhimaggaPaliImported: fullCoverage.visuddhimagga.segmentCount > 0,
      russianCoverage: "partial-seed-only",
      russianSeedEditions: russianCoverage.importedEditions,
      russianSeedSegments: russianCoverage.importedSegments,
      russianBulkImport: "excluded-unresolved-rights-and-mutable-provenance",
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
