import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_FALLBACK_ORDER,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
} from "../language";

describe("language config", () => {
  it("declares RU, EN, and ID with a default and labels", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["ru", "en", "id"]);
    expect(DEFAULT_LANGUAGE).toBe("ru");
    expect(LANGUAGE_LABELS).toEqual({ ru: "RU", en: "EN", id: "ID" });
  });

  it("normalizes unknown language codes to the default", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("id")).toBe("id");
    expect(normalizeLanguage("de")).toBe(DEFAULT_LANGUAGE);
    expect(normalizeLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
  });

  it("has an explicit fallback order", () => {
    expect(LANGUAGE_FALLBACK_ORDER[0]).toBe(DEFAULT_LANGUAGE);
    expect(LANGUAGE_FALLBACK_ORDER).toContain("en");
    expect(LANGUAGE_FALLBACK_ORDER).toContain("id");
  });
});
