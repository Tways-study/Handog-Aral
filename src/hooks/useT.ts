"use client";

import { translations } from "@/data/translations";
import { useSettings } from "@/stores/settings";

/** Strings in the child's language from the v3 settings store (the one new code uses). */
export function useT() {
  const language = useSettings((s) => s.language);
  return translations[language] ?? translations.tagalog;
}
