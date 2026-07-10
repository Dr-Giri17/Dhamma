import { describe, expect, it } from "vitest";
import type { DhammaSegment } from "../types";
import { selectTranslation } from "../translations";

const base: DhammaSegment = {
  id: "seg-mn10-1-1",
  textId: "text-mn10",
  segmentUid: "mn10:1.1",
  segmentOrder: 1,
  language: "en",
  rootText: "Evaṁ me sutaṁ—",
  translationText: "So I have heard.",
  sourceRef: "MN 10",
  license: "CC0 1.0 Universal (CC0 1.0)",
  translator: "Bhikkhu Sujato",
  provider: "bilara",
  metadata: {
    translationSourcePath: "translation/en/sujato/sutta/mn/mn10_translation-en-sujato.json",
    translationPublished: true,
    translationPublicationStatus: "bilara-data published branch",
  },
};

describe("reader translation selection", () => {
  it("shows verified Russian when present and preserves provenance", () => {
    const segment: DhammaSegment = {
      ...base,
      translations: {
        ru: {
          language: "ru",
          text: "Так я слышал.",
          translator: "SV theravada.ru",
          provider: "bilara",
          license: "CC0 1.0 Universal (CC0 1.0)",
          sourcePath: "translation/ru/sv/sutta/mn/mn10_translation-ru-sv.json",
          published: true,
          publicationStatus: "Завершен",
          publicationNumber: "scpub88",
        },
      },
    };
    const selected = selectTranslation(segment, "ru");
    expect(selected.translation?.text).toBe("Так я слышал.");
    expect(selected.translation).toMatchObject({
      language: "ru",
      translator: "SV theravada.ru",
      provider: "bilara",
      license: "CC0 1.0 Universal (CC0 1.0)",
      published: true,
      publicationNumber: "scpub88",
    });
    expect(selected.isFallback).toBe(false);
  });

  it("falls back to clearly identified English when Russian is absent", () => {
    const selected = selectTranslation(base, "ru");
    expect(selected.translation?.language).toBe("en");
    expect(selected.translation?.text).toBe("So I have heard.");
    expect(selected.isFallback).toBe(true);
    expect(selected.requestedLanguageAvailable).toBe(false);
  });

  it("falls back to English when Indonesian is absent", () => {
    const selected = selectTranslation(base, "id");
    expect(selected.translation?.language).toBe("en");
    expect(selected.isFallback).toBe(true);
  });

  it("shows English directly when English is selected", () => {
    const selected = selectTranslation(base, "en");
    expect(selected.translation?.language).toBe("en");
    expect(selected.isFallback).toBe(false);
    expect(selected.requestedLanguageAvailable).toBe(true);
  });
});
