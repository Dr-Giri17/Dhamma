"use client";

import type { SupportedLanguage } from "@/lib/i18n/language";
import {
  buildEditionHref,
  type TextEditionLanguage,
} from "@/lib/reader/navigation";

const labels: Record<SupportedLanguage, {
  interfaceLanguage: string;
  textEdition: string;
  parallel: string;
  unavailable: string;
}> = {
  en: {
    interfaceLanguage: "Interface language is controlled separately in the header.",
    textEdition: "Text edition",
    parallel: "Show Pāli in parallel",
    unavailable: "not imported",
  },
  ru: {
    interfaceLanguage: "Язык интерфейса переключается отдельно в шапке.",
    textEdition: "Издание текста",
    parallel: "Показывать пали параллельно",
    unavailable: "не импортировано",
  },
  id: {
    interfaceLanguage: "Bahasa antarmuka diubah secara terpisah di bagian atas.",
    textEdition: "Edisi teks",
    parallel: "Tampilkan Pāli secara paralel",
    unavailable: "belum diimpor",
  },
};

const editionLabels: Record<TextEditionLanguage, string> = {
  pli: "Pāli",
  en: "English",
  ru: "Русский",
  id: "Indonesia",
};

export default function EditionControls({
  slug,
  interfaceLanguage,
  selectedEdition,
  parallel,
  availability,
}: {
  slug: string;
  interfaceLanguage: SupportedLanguage;
  selectedEdition: TextEditionLanguage;
  parallel: boolean;
  availability: Record<TextEditionLanguage, boolean>;
}) {
  const t = labels[interfaceLanguage];

  function navigate(edition: TextEditionLanguage, nextParallel = parallel) {
    const segmentUid = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    window.location.assign(
      buildEditionHref({
        slug,
        edition,
        parallel: nextParallel,
        segmentUid: segmentUid || undefined,
      })
    );
  }

  return (
    <div className="card-dhamma space-y-3" aria-label={t.textEdition}>
      <p className="text-xs text-ink-faint">{t.interfaceLanguage}</p>
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">{t.textEdition}</span>
        <select
          aria-label={t.textEdition}
          value={selectedEdition}
          onChange={(event) => navigate(event.target.value as TextEditionLanguage)}
          className="rounded-md border border-line bg-surface px-3 py-2"
        >
          {(Object.keys(editionLabels) as TextEditionLanguage[]).map((edition) => (
            <option key={edition} value={edition}>
              {editionLabels[edition]}{availability[edition] ? "" : ` — ${t.unavailable}`}
            </option>
          ))}
        </select>
      </label>
      {selectedEdition !== "pli" && availability.pli ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={parallel}
            onChange={(event) => navigate(selectedEdition, event.target.checked)}
          />
          {t.parallel}
        </label>
      ) : null}
    </div>
  );
}

