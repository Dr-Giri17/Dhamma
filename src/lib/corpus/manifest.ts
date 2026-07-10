import type { CorpusEditionManifest } from "./types";
import { CORPUS_EDITIONS } from "./registry";

const SHA256 = /^[a-f0-9]{64}$/;

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestValidationError";
  }
}

export function validateManifest(
  editions: readonly CorpusEditionManifest[] = CORPUS_EDITIONS
): void {
  const seen = new Set<string>();
  for (const edition of editions) {
    const key = `${edition.textId}:${edition.language}`;
    if (seen.has(key)) throw new ManifestValidationError(`Duplicate edition ${key}`);
    seen.add(key);

    const required: Array<keyof CorpusEditionManifest> = [
      "workId", "textId", "segmentIdFormat", "title", "basket",
      "collection", "canonicalStatus", "language", "translator", "publisher",
      "sourceRepository", "sourceUrl", "sourceRevision", "sourceFile",
      "licenseName", "licenseUrl", "retrievedAt", "sha256", "notes",
    ];
    for (const field of required) {
      if (!edition[field]) {
        throw new ManifestValidationError(`${key} missing ${field}`);
      }
    }
    if (edition.imported && !edition.redistributionAllowed) {
      throw new ManifestValidationError(`${key} blocks redistribution`);
    }
    if (edition.imported && !SHA256.test(edition.sha256)) {
      throw new ManifestValidationError(`${key} has invalid SHA-256`);
    }
    if (edition.canonicalStatus !== "canonical" && edition.basket !== "post_canonical") {
      throw new ManifestValidationError(`${key} has inconsistent canonical status`);
    }
  }
}

export function manifestEdition(
  textId: string,
  language: string
): CorpusEditionManifest | undefined {
  return CORPUS_EDITIONS.find(
    (edition) => edition.textId === textId && edition.language === language
  );
}
