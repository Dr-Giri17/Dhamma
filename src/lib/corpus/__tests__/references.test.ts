import { describe, expect, it } from "vitest";
import {
  formatDhammapadaRef,
  formatSourceRef,
  isValidSourceRef,
} from "../references";
import type { DhammaText, SourceWork } from "../types";

const work = (overrides: Partial<SourceWork> = {}): SourceWork => ({
  id: "w",
  slug: "dhammapada",
  title: "Dhammapada",
  tradition: "theravada",
  category: "canonical",
  pitaka: "sutta",
  nikaya: "kn",
  sourceProvider: "manual",
  license: "Public Domain",
  language: "en",
  importedAt: "2026-07-07T00:00:00.000Z",
  ...overrides,
});

const text = (overrides: Partial<DhammaText> = {}): DhammaText => ({
  id: "t",
  workId: "w",
  uid: "dhp",
  slug: "dhammapada",
  title: "Dhammapada",
  ...overrides,
});

describe("source references (ТЗ §11)", () => {
  it("formats Dhammapada verse refs", () => {
    expect(formatDhammapadaRef("5")).toBe("Dhp 5");
    expect(formatDhammapadaRef()).toBe("Dhp");
  });

  it("formats nikāya refs from uid", () => {
    const mn = text({ uid: "mn10", slug: "mn10", title: "MN 10" });
    expect(formatSourceRef(mn, work())).toBe("MN 10");
    const sn = text({ uid: "sn56.11", slug: "sn56.11", title: "SN 56.11" });
    expect(formatSourceRef(sn, work())).toBe("SN 56.11");
  });

  it("isValidSourceRef rejects empty / non-letter refs", () => {
    expect(isValidSourceRef("Dhp 5")).toBe(true);
    expect(isValidSourceRef("")).toBe(false);
    expect(isValidSourceRef("   ")).toBe(false);
    expect(isValidSourceRef("123")).toBe(false);
  });
});
