import { describe, expect, it } from "vitest";
import { POST_CANONICAL_CATALOG } from "../catalog";
import { validateEditionForIngestion } from "../integrity";
import { ManifestValidationError, validateManifest } from "../manifest";
import { CORPUS_EDITIONS } from "../registry";
import { searchIndexInfo } from "../search-index";

describe("corpus edition manifest", () => {
  it("validates every imported edition and provenance field", () => {
    expect(() => validateManifest()).not.toThrow();
    expect(CORPUS_EDITIONS).toHaveLength(22);
    expect(CORPUS_EDITIONS.every((edition) => edition.imported)).toBe(true);
    expect(CORPUS_EDITIONS.some((edition) => edition.language === "ru")).toBe(true);
    expect(CORPUS_EDITIONS.some((edition) => edition.language === "id")).toBe(false);
    expect(CORPUS_EDITIONS.some((edition) => /all rights reserved/i.test(edition.licenseName))).toBe(false);
  });

  it("blocks missing licenses and redistribution=false", () => {
    const missingLicense = { ...CORPUS_EDITIONS[0], licenseName: "" };
    expect(() => validateManifest([missingLicense])).toThrow(ManifestValidationError);

    const blocked = { ...CORPUS_EDITIONS[0], redistributionAllowed: false };
    expect(() => validateManifest([blocked])).toThrow("blocks redistribution");
  });

  it("blocks checksum mismatch before ingestion", () => {
    const edition = { ...CORPUS_EDITIONS[0], sha256: "0".repeat(64) };
    expect(() => validateEditionForIngestion(edition, new TextEncoder().encode("changed")))
      .toThrow("Checksum mismatch");
  });

  it("keeps Visuddhimagga post-canonical and source-gated", () => {
    const vism = POST_CANONICAL_CATALOG.find((node) => node.id === "visuddhimagga");
    expect(vism?.canonicalStatus).toBe("post-canonical");
    expect(vism?.capabilities).not.toContain("translation_available");
  });

  it("ships a deterministic build-time index", () => {
    const info = searchIndexInfo();
    expect(info.schemaVersion).toBe(1);
    expect(info.documentCount).toBeGreaterThan(1_000);
    expect(info.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
  });
});
