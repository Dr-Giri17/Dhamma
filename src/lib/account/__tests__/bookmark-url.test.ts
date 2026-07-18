import { describe, expect, it } from "vitest";
import { bookmarkHref, progressHref } from "../bookmark-url";

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

  it("falls back to a segment_id-derived anchor for legacy rows without one", () => {
    expect(
      bookmarkHref({
        reader_slug: "mn10",
        edition: "pli",
        page: 1,
        segment_id: "mn10:1.1",
        segment_anchor: null,
      })
    ).toBe("/reader/mn10?edition=pli&page=1#seg-mn10%3A1.1");
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
