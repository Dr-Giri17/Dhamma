import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  MULLER_PROVENANCE,
  VAGGAS,
  vaggaForVerse,
  parseGutenbergDhammapada,
  verseToSegment,
} from "../dhammapada";
import { KNOWN_LICENSES } from "../licenses";
import type { DhammaSegment } from "../types";

const CORPUS_DIR = path.resolve(process.cwd(), "data", "corpus");

async function loadDhpSegments(): Promise<DhammaSegment[]> {
  const raw = await fs.readFile(path.join(CORPUS_DIR, "segments.json"), "utf8");
  const all = JSON.parse(raw) as DhammaSegment[];
  return all.filter((s) => s.textId === "text-dhp");
}

describe("Dhammapada corpus — required end-to-end tests (Pass #2 #1-#5)", () => {
  let dhp: DhammaSegment[];
  it("loads from disk", async () => {
    dhp = await loadDhpSegments();
    expect(dhp.length).toBeGreaterThan(0);
  });

  it("#1 exactly 423 verses", async () => {
    dhp = await loadDhpSegments();
    expect(dhp.length).toBe(423);
  });

  it("#2 sourceRef from Dhp 1 to Dhp 423, continuous", async () => {
    dhp = await loadDhpSegments();
    const refs = dhp.map((s) => s.sourceRef);
    for (let i = 0; i < 423; i++) {
      expect(refs).toContain(`Dhp ${i + 1}`);
    }
    // segment UIDs are dhp:1..dhp:423
    const uids = new Set(dhp.map((s) => s.segmentUid));
    for (let i = 1; i <= 423; i++) expect(uids.has(`dhp:${i}`)).toBe(true);
  });

  it("#3 every verse carries Public Domain license", async () => {
    dhp = await loadDhpSegments();
    for (const s of dhp) expect(s.license).toBe(KNOWN_LICENSES.PUBLIC_DOMAIN);
  });

  it("#4 every verse carries translator F. Max Müller + project_gutenberg", async () => {
    dhp = await loadDhpSegments();
    for (const s of dhp) {
      expect(s.translator).toBe("F. Max Müller");
      expect(s.provider).toBe("project_gutenberg");
    }
  });

  it("#5 no verse has empty text", async () => {
    dhp = await loadDhpSegments();
    for (const s of dhp) {
      expect(typeof s.translationText).toBe("string");
      expect(s.translationText!.trim().length).toBeGreaterThan(0);
    }
  });

  it("every verse has a chapter/vagga name", async () => {
    dhp = await loadDhpSegments();
    for (const s of dhp) {
      expect(typeof s.chapter).toBe("string");
      expect(s.chapter!.length).toBeGreaterThan(0);
    }
  });
});

describe("Dhammapada pure parser + helpers", () => {
  it("parses a small Gutenberg fixture and expands compound entries", () => {
    const verses = parseGutenbergDhammapada(sampleGutenbergText());
    expect(verses.length).toBe(5);
    expect(verses.map((v) => v.verse)).toEqual([1, 2, 3, 4, 5]);
    // compound 3,4 share text
    expect(verses[2].text).toBe(verses[3].text);
  });

  it("verseToSegment maps all provenance fields", () => {
    const seg = verseToSegment({ verse: 1, text: "test verse text" });
    expect(seg.segmentUid).toBe("dhp:1");
    expect(seg.sourceRef).toBe("Dhp 1");
    expect(seg.license).toBe(KNOWN_LICENSES.PUBLIC_DOMAIN);
    expect(seg.provider).toBe("project_gutenberg");
    expect(seg.translator).toBe("F. Max Müller");
    expect(seg.verseNumber).toBe("1");
    expect(seg.chapter).toBe(VAGGAS[0].name);
  });

  it("throws on a source with a verse gap", () => {
    const broken = sampleGutenbergText().replace("2. ", "2X ");
    expect(() => parseGutenbergDhammapada(broken)).toThrow(/gap|expected/i);
  });

  it("throws if Gutenberg markers are missing", () => {
    expect(() => parseGutenbergDhammapada("no markers here")).toThrow(/markers/i);
  });

  it("VAGGAS covers 1..423 continuously across 26 chapters", () => {
    expect(VAGGAS.length).toBe(26);
    expect(VAGGAS[0].firstVerse).toBe(1);
    expect(VAGGAS[25].lastVerse).toBe(423);
    for (let v = 1; v <= 423; v++) expect(vaggaForVerse(v)).toBeDefined();
    for (let i = 1; i < VAGGAS.length; i++) {
      expect(VAGGAS[i].firstVerse).toBe(VAGGAS[i - 1].lastVerse + 1);
    }
  });

  it("MULLER_PROVENANCE wiring matches the allow-list", () => {
    expect(MULLER_PROVENANCE.license).toBe(KNOWN_LICENSES.PUBLIC_DOMAIN);
    expect(MULLER_PROVENANCE.provider).toBe("project_gutenberg");
    expect(MULLER_PROVENANCE.translator).toBe("F. Max Müller");
  });
});

/** Compact Gutenberg fixture: verses 1, 2, (3,4 compound), 5 → continuous 1..5. */
function sampleGutenbergText(): string {
  return [
    "header",
    "*** START OF THE PROJECT GUTENBERG EBOOK X ***",
    "1. All that we are is the result of what we have thought.",
    "2. Pure thought brings happiness.",
    "3, 4. A compound verse shared across two numbers.",
    "5. A final verse for the sample.",
    "*** END OF THE PROJECT GUTENBERG EBOOK X ***",
    "footer",
  ].join("\n");
}
