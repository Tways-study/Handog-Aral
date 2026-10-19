"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { liveQuery } from "dexie";
import { explain, offlinePlaceholder } from "@/lib/dictionary/explain";
import type { Language, ResolvedExplanation } from "@/shared/schemas";
import { getCached } from "@/stores/db";

export interface LookupState {
  tokenIndex: number;
  word: string;
  entry: ResolvedExplanation | null;
  pending: boolean;
}

function stripCache(row: ResolvedExplanation): ResolvedExplanation {
  return {
    word: row.word,
    phonetic: row.phonetic,
    english: row.english,
    translation: row.translation,
    emoji: row.emoji,
    difficulty: row.difficulty,
    example: row.example,
    source: row.source,
    language: row.language,
  };
}

/**
 * One word lookup at a time. A newer tap aborts the in-flight one and a stale result can never replace
 * a newer one. An `offline` entry is swapped in place when the lookup queue upgrades its cache row.
 */
export function useWordLookup(language: Language) {
  const [state, setState] = useState<LookupState | null>(null);
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(
    async (word: string, sentence: string, tokenIndex: number) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const seq = ++seqRef.current;
      setState({ tokenIndex, word, entry: null, pending: true });
      let entry: ResolvedExplanation;
      try {
        entry = await explain({ word, sentence, language }, { signal: ctrl.signal });
      } catch {
        if (seq !== seqRef.current || ctrl.signal.aborted) return;
        entry = offlinePlaceholder(word.toLowerCase(), language);
      }
      if (seq !== seqRef.current) return;
      setState({ tokenIndex, word, entry, pending: false });
    },
    [language],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    seqRef.current++;
    setState(null);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const entryWord = state?.entry?.word;
  const entryLang = state?.entry?.language;
  const isOffline = state?.entry?.source === "offline";
  useEffect(() => {
    if (!entryWord || !entryLang || !isOffline || typeof indexedDB === "undefined") return;
    const seq = seqRef.current;
    const sub = liveQuery(() => getCached(entryWord, entryLang)).subscribe({
      next: (row) => {
        if (!row || row.source === "offline" || seq !== seqRef.current) return;
        const upgraded = stripCache(row);
        setState((s) => (s && s.entry && s.entry.word === entryWord ? { ...s, entry: upgraded } : s));
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, [entryWord, entryLang, isOffline]);

  return { state, lookup, clear };
}
