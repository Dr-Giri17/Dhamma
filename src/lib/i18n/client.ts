"use client";

import { useEffect, useState } from "react";
import { getUi } from "@/lib/ui";
import { DEFAULT_LANGUAGE, normalizeLanguage, type SupportedLanguage } from "./language";

/**
 * Client-side access to the UI dictionary. The active interface language is the
 * `<html lang>` attribute set by the server in RootLayout, which mirrors the
 * language cookie. Falls back to the default language during SSR / first paint
 * to avoid hydration mismatches.
 */
export function useUi() {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  useEffect(() => {
    const fromDom = normalizeLanguage(document.documentElement.lang);
    setLanguage(fromDom);
  }, []);
  return getUi(language);
}
