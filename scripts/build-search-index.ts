import { promises as fs } from "node:fs";
import path from "node:path";
import { BILARA_REVISION } from "../src/lib/corpus/bilara";
import { normalizeForSearch, tokenize } from "../src/lib/corpus/normalize";
import { loadCorpus } from "../src/lib/corpus/seed";

async function main() {
  const corpus = await loadCorpus();
  const textById = new Map(corpus.texts.map((text) => [text.id, text]));
  const workById = new Map(corpus.works.map((work) => [work.id, work]));
  const documents = corpus.segments.map((segment) => {
    const text = textById.get(segment.textId);
    const work = text ? workById.get(text.workId) : undefined;
    const localized = {
      pli: segment.rootText ?? "",
      en: segment.translationText ?? "",
      ru: segment.translations?.ru?.text ?? "",
      id: segment.translations?.id?.text ?? "",
    };
    const tokens = Array.from(
      new Set(Object.values(localized).flatMap((value) => tokenize(value)))
    ).slice(0, 96);
    return {
      segmentUid: segment.segmentUid,
      textId: segment.textId,
      workId: text?.workId ?? "unknown",
      canonicalStatus:
        work?.pitaka === "post_canonical"
          ? "post-canonical"
          : work?.category === "canonical"
            ? "canonical"
            : "commentarial",
      tokens,
      normalized: Object.fromEntries(
        Object.entries(localized)
          .filter(([, value]) => Boolean(value))
          .map(([language, value]) => [language, normalizeForSearch(value)])
      ),
    };
  });
  const index = {
    schemaVersion: 1,
    generatedAt: "2026-07-10",
    sourceRevision: BILARA_REVISION,
    documentCount: documents.length,
    documents,
  };
  const output = path.resolve(process.cwd(), "data", "corpus", "search-index.json");
  await fs.writeFile(output, `${JSON.stringify(index)}\n`, "utf8");
  console.log(
    `[build-index] wrote ${documents.length} deterministic documents to data/corpus/search-index.json`
  );
}

main().catch((error) => {
  console.error("[build-index] FAILED", error);
  process.exit(1);
});
