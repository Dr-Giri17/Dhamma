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
  const languages = ["pli", "en", "ru", "id"].map((language) => ({
    language,
    importedEditions: CORPUS_EDITIONS.filter(
      (edition) => edition.imported && edition.language === language
    ).length,
    sourceGated:
      language === "id"
        ? ["No published CC0 Indonesian Theravāda Pāli edition matches the local seed works."]
        : [],
  }));
  const coverage = {
    generatedFrom: "src/lib/corpus/registry.ts",
    importedEditionCount: CORPUS_EDITIONS.filter((edition) => edition.imported).length,
    importedTextCount: new Set(CORPUS_EDITIONS.map((edition) => edition.textId)).size,
    languages,
    canonicalWorksImported: Array.from(new Set(CORPUS_EDITIONS.map((edition) => edition.workId))),
    sourceGatedWorks: [
      {
        workId: "work-vism",
        title: "Visuddhimagga",
        canonicalStatus: "post-canonical",
        reason: "BPS Ñāṇamoli edition is all rights reserved; metadata link only.",
      },
    ],
    claims: {
      fullTipitakaImported: false,
      structureAvailable: true,
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

