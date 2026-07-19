import { describe, expect, it } from "vitest";
import { bookmarkHref, legacyAnchor, progressHref } from "../bookmark-url";

describe("bookmarkHref", () => {
  it("builds a deep link to the saved page and anchor", () => {
    expect(
      bookmarkHref({
        reader_slug: "dn1",
        edition: "pli",
        page: 3,
        segment_id: "dn1:1.1",
        segment_anchor: "dn1:1.1",
      })
    ).toBe("/reader/dn1?edition=pli&page=3#dn1%3A1.1");
  });

  it("uses the en- prefixed anchor for English-column bookmarks", () => {
    expect(
      bookmarkHref({
        reader_slug: "dn1",
        edition: "en",
        page: 2,
        segment_id: "dn1:1.1",
        segment_anchor: "en-dn1:1.1",
      })
    ).toBe("/reader/dn1?edition=en&page=2#en-dn1%3A1.1");
  });

  it("falls back to the segment_id itself for legacy Pali rows without an anchor", () => {
    // Legacy Pali rows: the reader renders id={segmentUid} on the Pali column,
    // and the stored segment_id IS that segment UID.
    expect(
      bookmarkHref({
        reader_slug: "mn10",
        edition: "pli",
        page: 1,
        segment_id: "mn10:1.1",
        segment_anchor: null,
      })
    ).toBe("/reader/mn10?edition=pli&page=1#mn10%3A1.1");
  });

  it("falls back to en-${segment_id} for legacy English-column rows without an anchor", () => {
    // Legacy English rows: the reader renders id={`en-${segmentUid}`} on the
    // English column, so the fallback must synthesize the en- prefix.
    expect(
      bookmarkHref({
        reader_slug: "dn1",
        edition: "en",
        page: 4,
        segment_id: "dn1:3.2",
        segment_anchor: null,
      })
    ).toBe("/reader/dn1?edition=en&page=4#en-dn1%3A3.2");
  });

  it("legacyAnchor returns the stored anchor when present, regardless of edition", () => {
    // When a real anchor is stored (new rows), it is used verbatim and the
    // edition-based synthesis is bypassed.
    expect(
      legacyAnchor({ reader_slug: "dn1", edition: "en", page: 1, segment_id: "x", segment_anchor: "en-dn1:1.1" })
    ).toBe("en-dn1:1.1");
  });

  it("never synthesizes a seg- prefix that no reader column emits (Pali)", () => {
    const href = bookmarkHref({
      reader_slug: "dn1",
      edition: "pli",
      page: 1,
      segment_id: "dn1:5.5",
      segment_anchor: null,
    });
    expect(href).not.toMatch(/#seg-/);
  });

  it("never synthesizes a seg- prefix for English legacy rows either", () => {
    const href = bookmarkHref({
      reader_slug: "dn1",
      edition: "en",
      page: 1,
      segment_id: "dn1:5.5",
      segment_anchor: null,
    });
    expect(href).not.toMatch(/#seg-/);
    expect(href).toMatch(/#en-dn1%3A5\.5$/);
  });

  it("encodes a slug with characters that need escaping", () => {
    expect(
      bookmarkHref({
        reader_slug: "vin01m",
        edition: "pli",
        page: 5,
        segment_id: "vin01m:1",
        segment_anchor: "vin01m:1",
      })
    ).toBe("/reader/vin01m?edition=pli&page=5#vin01m%3A1");
  });

  it("never silently defaults page to 1 when a real page was saved", () => {
    const href = bookmarkHref({
      reader_slug: "dn1",
      edition: "pli",
      page: 42,
      segment_id: "dn1:9.9",
      segment_anchor: "dn1:9.9",
    });
    expect(href).toContain("page=42");
    expect(href).not.toContain("page=1");
  });
});

describe("progressHref", () => {
  it("builds a page link without an anchor when no segment is stored", () => {
    expect(
      progressHref({ reader_slug: "dn1", edition: "pli", page: 7, segment_id: null })
    ).toBe("/reader/dn1?edition=pli&page=7");
  });

  it("appends the segment anchor when present", () => {
    expect(
      progressHref({ reader_slug: "dn1", edition: "en", page: 4, segment_id: "dn1:3.2" })
    ).toBe("/reader/dn1?edition=en&page=4#dn1%3A3.2");
  });
});
