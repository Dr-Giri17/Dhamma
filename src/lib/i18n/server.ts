import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, normalizeLanguage, type SupportedLanguage } from "./language";

export async function getRequestLanguage(): Promise<SupportedLanguage> {
  const store = await cookies();
  return normalizeLanguage(store.get(LANGUAGE_COOKIE)?.value);
}
