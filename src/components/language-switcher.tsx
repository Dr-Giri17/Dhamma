"use client";

import { useRouter } from "next/navigation";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_LABELS,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/lib/i18n/language";

interface Props {
  currentLanguage: SupportedLanguage;
  label: string;
}

export default function LanguageSwitcher({ currentLanguage, label }: Props) {
  const router = useRouter();

  function setLanguage(language: SupportedLanguage) {
    document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <span className="text-xs text-ink-faint">{label}</span>
      <div className="flex rounded-md border border-line bg-surface shadow-sm overflow-hidden">
        {SUPPORTED_LANGUAGES.map((language) => {
          const selected = language === currentLanguage;
          return (
            <button
              key={language}
              type="button"
              onClick={() => setLanguage(language)}
              aria-pressed={selected}
              title={LANGUAGE_NAMES[language]}
              className={
                selected
                  ? "px-2.5 py-1 text-xs font-semibold bg-accent text-ink"
                  : "px-2.5 py-1 text-xs text-ink-soft hover:bg-accent-soft"
              }
            >
              {LANGUAGE_LABELS[language]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
