"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { listWords, type SavedWord } from "@/stores/db";

/** Saved vocabulary, newest first, updating live as words are saved or removed. `null` until the first read. */
export function useSavedWords(): SavedWord[] | null {
  const [words, setWords] = useState<SavedWord[] | null>(null);
  useEffect(() => {
    if (typeof indexedDB === "undefined") {
      const id = setTimeout(() => setWords([]), 0);
      return () => clearTimeout(id);
    }
    const sub = liveQuery(listWords).subscribe({
      next: (rows) => setWords([...rows].sort((a, b) => b.savedAt - a.savedAt)),
      error: () => setWords([]),
    });
    return () => sub.unsubscribe();
  }, []);
  return words;
}
