import { describe, expect, it } from "vitest";
import { MAX_QUERY_CHARS, prepareFullSearchQuery, searchDocumentAllowed } from "../search-policy";

describe("full-corpus search policy", () => {
  it.each(["paṭiccasamuppāda", "paticcasamuppada", "paṭicca samuppāda", "dukkha", "dukkhaṃ", "anicca", "anattā"])("normalizes supported Pāli query %s", (query) => {
    expect(prepareFullSearchQuery(query, "pli").supported).toBe(true);
  });

  it("expands doctrinal aliases only within the requested language", () => {
    expect(prepareFullSearchQuery("dukkha", "en").terms).toContain("suffering");
    expect(prepareFullSearchQuery("dukkha", "ru").terms).toContain("страдание");
    expect(prepareFullSearchQuery("paṭiccasamuppāda", "pli").terms).toEqual(expect.arrayContaining(["paticca", "samuppada"]));
  });

  it.each(["Что делать при боли в колене?", "best smartphone camera", "random unrelated gibberish"])("fails closed for %s", (query) => {
    expect(prepareFullSearchQuery(query).supported).toBe(false);
  });

  it("rejects oversized and keyword-stuffed queries", () => {
    expect(prepareFullSearchQuery("x".repeat(MAX_QUERY_CHARS + 1)).supported).toBe(false);
    expect(prepareFullSearchQuery(`dukkha ${Array.from({ length: 20 }, (_, index) => `noise${index}`).join(" ")}`).supported).toBe(false);
  });

  it("preserves explicit language, collection, and canonical filters", () => {
    const ru = { language: "ru" as const, collection: "mn", canonicalStatus: "canonical" as const };
    expect(searchDocumentAllowed(ru, { language: "ru", collection: "mn", canonicalOnly: true })).toBe(true);
    expect(searchDocumentAllowed(ru, { language: "en" })).toBe(false);
    expect(searchDocumentAllowed(ru, { language: "ru", collection: "dn" })).toBe(false);
    expect(searchDocumentAllowed({ ...ru, canonicalStatus: "post-canonical" }, { language: "ru", canonicalOnly: true })).toBe(false);
    expect(searchDocumentAllowed({ ...ru, canonicalStatus: "tradition-dependent" }, { language: "ru", canonicalOnly: true })).toBe(false);
  });

  it("allows explicit post-canonical filtering", () => {
    const vism = { language: "pli" as const, collection: "visuddhimagga", canonicalStatus: "post-canonical" as const };
    expect(searchDocumentAllowed(vism, { language: "pli", canonicalStatus: "post-canonical" })).toBe(true);
    expect(searchDocumentAllowed(vism, { language: "pli", canonicalOnly: true })).toBe(false);
  });
});
