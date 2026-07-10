import { describe, expect, it } from "vitest";
import {
  buildEditionHref,
  missingEditionMessage,
  normalizeTextEdition,
} from "../navigation";

describe("reader edition navigation", () => {
  it("keeps the segment position while switching edition", () => {
    expect(
      buildEditionHref({
        slug: "mn10",
        edition: "ru",
        parallel: true,
        segmentUid: "mn10:4.1",
      })
    ).toBe("/reader/mn10?edition=ru&parallel=1#mn10%3A4.1");
  });

  it("keeps interface and text language as separate states", () => {
    expect(normalizeTextEdition("pli")).toBe("pli");
    expect(normalizeTextEdition("id")).toBe("id");
    expect(normalizeTextEdition("unsupported")).toBe("en");
  });

  it("does not enable a redundant parallel root edition", () => {
    expect(buildEditionHref({ slug: "mn10", edition: "pli", parallel: true }))
      .toBe("/reader/mn10?edition=pli");
  });

  it("names the requested missing edition rather than the interface language", () => {
    expect(missingEditionMessage("ru", "id")).toContain("Индонезийский перевод");
    expect(missingEditionMessage("ru", "id")).not.toContain("Русский перевод");
  });
});
