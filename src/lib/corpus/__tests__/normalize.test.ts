import { describe, expect, it } from "vitest";
import {
  stripPaliDiacritics,
  normalizeForSearch,
  tokenize,
  detectLanguage,
} from "../normalize";

describe("Pāli normalization", () => {
  // ТЗ §9 Phase D: search by Pāli term (diacritic-insensitive)
  it("strips long-vowel diacritics: anattā → anatta", () => {
    expect(stripPaliDiacritics("anattā")).toBe("anatta");
    expect(stripPaliDiacritics("mettā")).toBe("metta");
    expect(stripPaliDiacritics("dukkhaṃ")).toBe("dukkham");
  });

  it("strips retroflex consonants: taṇhā → tanha (diacritics gone)", () => {
    // note: ṇ → n, ā → a, so taṇhā → tanha (we only promise diacritic stripping)
    expect(stripPaliDiacritics("taṇhā")).toBe("tanha");
  });

  it("preserves case for ASCII base letters", () => {
    expect(stripPaliDiacritics("Anattā")).toBe("Anatta");
  });

  it("normalizeForSearch lowercases and collapses whitespace", () => {
    expect(normalizeForSearch("  Anattā  ")).toBe("anatta");
  });

  it("tokenize drops stopwords and punctuation", () => {
    expect(tokenize("What is dukkha?")).toEqual(["dukkha"]);
    expect(tokenize("the metta and dukkha")).toEqual(["metta", "dukkha"]);
  });

  it("detectLanguage recognizes Cyrillic as ru", () => {
    expect(detectLanguage("Что такое taṇhā?")).toBe("ru");
    expect(detectLanguage("What is suffering?")).toBe("en");
  });
});
