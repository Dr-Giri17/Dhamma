import { describe, expect, it } from "vitest";
import { getUi } from "../ui";

describe("UI string lookup", () => {
  it("returns selected-language chrome", () => {
    expect(getUi("ru").nav.search).toBe("Поиск");
    expect(getUi("en").nav.search).toBe("Search");
    expect(getUi("id").nav.search).toBe("Cari");
  });

  it("falls back for unknown languages", () => {
    expect(getUi("xx").nav.home).toBe("Главная");
  });
});
