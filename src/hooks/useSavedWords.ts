"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import type { Language } from "@/shared/schemas";
import { listWords, type SavedWord } from "@/stores/db";

/**
 * Saved vocabulary, newest first, updating live as words are saved or removed. `null` until the first read.
 * Pass a language to keep only the words saved in that direction (a quiz must not mix English and Filipino words).
 */
export function useSavedWords(language?: Language): SavedWord[] | null {
  const [words, setWords] = useState<SavedWord[] | null>(null);
  useEffect(() => {
    if (typeof indexedDB === "undefined") {
      const id = setTimeout(() => setWords([]), 0);
      return () => clearTimeout(id);
    }
    const sub = liveQuery(listWords).subscribe({
      next: (rows) => setWords([...rows].filter((w) => !language || w.language === language).sort((a, b) => b.savedAt - a.savedAt)),
      error: () => setWords([]),
    });
    return () => sub.unsubscribe();
  }, [language]);
  return words;
}
