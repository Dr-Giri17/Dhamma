import { describe, expect, it } from "vitest";
import {
  BILARA_TARGETS,
  SUJATO_PROVENANCE,
  ROOT_EDITION,
  bilaraUrl,
  buildSegment,
  rootPath,
  segmentUidPrefix,
  segmentUidToId,
  translationPath,
  uidToSourceRef,
} from "../bilara";
import { KNOWN_LICENSES } from "../licenses";
import type { BilaraTarget } from "../bilara";

const target = (uid: string, collectionDir: string, workId = "work-x"): BilaraTarget => ({
  uid,
  workId,
  collectionDir,
});

describe("Bilara path resolver (OneShot §7 #1)", () => {
  it("resolves root + translation paths for mn10", () => {
    const t = target("mn10", "mn");
    expect(rootPath(t)).toBe("root/pli/ms/sutta/mn/mn10_root-pli-ms.json");
    expect(translationPath(t)).toBe(
      "translation/en/sujato/sutta/mn/mn10_translation-en-sujato.json"
    );
  });

  it("resolves paths for nested collections (an3.65, sn56.11, snp1.8)", () => {
    expect(rootPath(target("an3.65", "an/an3"))).toBe(
      "root/pli/ms/sutta/an/an3/an3.65_root-pli-ms.json"
    );
    expect(rootPath(target("sn56.11", "sn/sn56"))).toBe(
      "root/pli/ms/sutta/sn/sn56/sn56.11_root-pli-ms.json"
    );
    expect(translationPath(target("snp1.8", "kn/snp/vagga1"))).toBe(
      "translation/en/sujato/sutta/kn/snp/vagga1/snp1.8_translation-en-sujato.json"
    );
  });

  it("builds the full raw.githubusercontent URL on the published branch", () => {
    expect(bilaraUrl(rootPath(target("dn31", "dn")))).toBe(
      "https://raw.githubusercontent.com/suttacentral/bilara-data/published/root/pli/ms/sutta/dn/dn31_root-pli-ms.json"
    );
  });

  it("BILARA_TARGETS covers exactly the 8 seed suttas", () => {
    const uids = BILARA_TARGETS.map((t) => t.uid).sort();
    expect(uids).toEqual(
      ["an3.65", "dn31", "mn10", "mn118", "sn56.11", "snp1.8", "snp2.1", "snp2.4"].sort()
    );
  });
});

describe("UID prefix → sourceRef derivation (OneShot §7 #2, §6)", () => {
  it("derives all 8 target refs (ТЗ §11)", () => {
    const cases: Record<string, string> = {
      mn10: "MN 10",
      mn118: "MN 118",
      dn31: "DN 31",
      "an3.65": "AN 3.65",
      "sn56.11": "SN 56.11",
      "snp1.8": "Snp 1.8",
      "snp2.1": "Snp 2.1",
      "snp2.4": "Snp 2.4",
    };
    for (const [uid, ref] of Object.entries(cases)) {
      expect(uidToSourceRef(uid)).toBe(ref);
    }
  });

  it("works on full segment UIDs (prefix before colon)", () => {
    expect(uidToSourceRef("mn10:4.0.1")).toBe("MN 10");
    expect(uidToSourceRef("an3.65:1.1")).toBe("AN 3.65");
    expect(uidToSourceRef("snp1.8:0.1")).toBe("Snp 1.8");
  });

  it("segmentUidPrefix extracts the work prefix", () => {
    expect(segmentUidPrefix("mn10:18-23.1")).toBe("mn10");
    expect(segmentUidPrefix("sn56.11:0.1")).toBe("sn56.11");
  });
});

describe("Segment UID preservation (OneShot §7 #3)", () => {
  it("preserves three-level forms verbatim", () => {
    const seg = buildSegment({
      uid: "mn10",
      textId: "text-mn10",
      segmentUid: "mn10:4.0.1",
      segmentOrder: 1,
      rootText: "root",
      translationText: "trans",
    });
    expect(seg.segmentUid).toBe("mn10:4.0.1");
  });

  it("preserves range forms verbatim", () => {
    const seg = buildSegment({
      uid: "mn10",
      textId: "text-mn10",
      segmentUid: "mn10:18-23.1",
      segmentOrder: 1,
      translationText: "trans",
    });
    expect(seg.segmentUid).toBe("mn10:18-23.1");
  });

  it("segmentUidToId is stable and JSON-safe", () => {
    expect(segmentUidToId("mn10:4.0.1")).toBe("seg-mn10-4-0-1");
    expect(segmentUidToId("mn10:18-23.1")).toBe("seg-mn10-18-23-1");
    expect(segmentUidToId("an3.65:1.1")).toBe("seg-an3-65-1-1");
  });
});

describe("License/provenance on Bilara-origin segments (OneShot §7 #4, §4)", () => {
  it("translation segment carries CC0 + Sujato + bilara", () => {
    const seg = buildSegment({
      uid: "mn10",
      textId: "text-mn10",
      segmentUid: "mn10:1.1",
      segmentOrder: 1,
      rootText: "Pāli root",
      translationText: "English translation",
    });
    expect(seg.license).toBe(KNOWN_LICENSES.CC0);
    expect(seg.provider).toBe("bilara");
    expect(seg.translator).toBe("Bhikkhu Sujato");
    expect(seg.sourceRef).toBe("MN 10");
  });

  it("stores Pāli root provenance separately in metadata when both present", () => {
    const seg = buildSegment({
      uid: "sn56.11",
      textId: "text-sn56.11",
      segmentUid: "sn56.11:1.1",
      segmentOrder: 1,
      rootText: "Pāli",
      translationText: "English",
    });
    const meta = seg.metadata as Record<string, string>;
    expect(meta.rootLicense).toBe(KNOWN_LICENSES.PUBLIC_DOMAIN);
    expect(meta.rootProvider).toBe("bilara");
    expect(meta.rootEdition).toBe(ROOT_EDITION);
    expect(meta.translationLicense).toBe(KNOWN_LICENSES.CC0);
    expect(meta.translator).toBe("Bhikkhu Sujato");
    // top-level license is the TRANSLATION license when both present
    expect(seg.license).toBe(KNOWN_LICENSES.CC0);
  });

  it("root-only segment falls back to Public Domain license", () => {
    const seg = buildSegment({
      uid: "mn10",
      textId: "text-mn10",
      segmentUid: "mn10:99.9",
      segmentOrder: 1,
      rootText: "Pāli only",
    });
    expect(seg.license).toBe(KNOWN_LICENSES.PUBLIC_DOMAIN);
    expect(seg.translationText).toBeUndefined();
  });
});

describe("No non-CC0 translation accepted (OneShot §7 #5)", () => {
  it("the CC0 string matches the allow-list exactly", () => {
    expect(SUJATO_PROVENANCE.license).toBe(KNOWN_LICENSES.CC0);
    // searchableSegments only allows segments whose license is on the list —
    // covered in seed.test.ts; this asserts the constant wiring is correct.
  });
});
