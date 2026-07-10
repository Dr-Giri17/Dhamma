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

  it("has localized reader fallback and source labels", () => {
    expect(getUi("ru").reader.selectedMissing).toBe(
      "Русский перевод пока не включён в корпус."
    );
    expect(getUi("id").reader.fallbackEnglish).toBe(
      "Terjemahan bahasa Inggris yang tersedia ditampilkan."
    );
    expect(getUi("en").reader.sourceAndLicense).toBe("Source and license");
  });

  it("defines all three Tipiṭaka baskets and honest full-canon status", () => {
    for (const language of ["ru", "en", "id"]) {
      const ui = getUi(language);
      expect(ui.tipitaka.vinaya).toBeTruthy();
      expect(ui.tipitaka.sutta).toBeTruthy();
      expect(ui.tipitaka.abhidhamma).toBeTruthy();
      expect(ui.tipitaka.fullCanonMissing).toBeTruthy();
    }
  });

  it("keeps Visuddhimagga visibly post-canonical and excludes protected English", () => {
    expect(getUi("en").visuddhimagga.classification).toContain("post-canonical");
    expect(getUi("en").visuddhimagga.status).toContain("VRI Pāli");
    expect(getUi("en").visuddhimagga.status).toContain("BPS English");
  });
});
