import { createHash } from "node:crypto";
import type { CorpusEditionManifest } from "./types";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateEditionForIngestion(
  edition: CorpusEditionManifest,
  bytes: Uint8Array
): void {
  if (!edition.imported) throw new Error(`${edition.textId}:${edition.language} is source-gated`);
  if (!edition.redistributionAllowed) {
    throw new Error(`${edition.textId}:${edition.language} does not allow redistribution`);
  }
  if (!edition.licenseName || !edition.licenseUrl) {
    throw new Error(`${edition.textId}:${edition.language} has no verified license`);
  }
  const actual = sha256Hex(bytes);
  if (actual !== edition.sha256) {
    throw new Error(
      `Checksum mismatch for ${edition.sourceFile}: expected ${edition.sha256}, received ${actual}`
    );
  }
}
