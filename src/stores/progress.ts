"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import { createIdbStorage } from "./storage";

export const MAX_STARS = 5;

export interface ProgressData {
  currentBookId: string | null;
  bookProgress: Record<string, number>;
  streak: number;
  lastActiveDate: string | null;
  quizHighScore: number;
  quizStars: number;
  /** Number of saved words, mirrored from the words table by the caller. */
  savedWordCount: number;
}

export interface ProgressState extends ProgressData {
  setCurrentBookId: (id: string | null) => void;
  setBookProgress: (id: string, pct: number) => void;
  setSavedWordCount: (n: number) => void;
  updateStreak: () => void;
  recordQuizResult: (score: number, total: number) => void;
  resetAll: () => void;
}

export const defaultProgress: ProgressData = {
  currentBookId: null,
  bookProgress: {},
  streak: 0,
  lastActiveDate: null,
  quizHighScore: 0,
  quizStars: 0,
  savedWordCount: 0,
};

/** Local calendar date as YYYY-MM-DD (not UTC, so it rolls over at the child's midnight). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function previousLocalDate(d: Date): string {
  const p = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return localDateString(p);
}

/** Stars earned from vocabulary: one per 3 saved words, capped at 5. */
export function wordStarsFor(count: number): number {
  return Math.min(MAX_STARS, Math.floor(Math.max(0, count) / 3));
}

export const PROGRESS_STORAGE_NAME = "handog-progress";

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...defaultProgress,
      setCurrentBookId: (currentBookId) => set({ currentBookId }),
      setBookProgress: (id, pct) =>
        set((s) => ({ bookProgress: { ...s.bookProgress, [id]: Math.max(0, Math.min(100, Math.round(pct))) } })),
      setSavedWordCount: (savedWordCount) => set({ savedWordCount: Math.max(0, savedWordCount) }),
      updateStreak: () =>
        set((s) => {
          const now = new Date();
          const today = localDateString(now);
          if (s.lastActiveDate === today) return s;
          const streak = s.lastActiveDate === previousLocalDate(now) ? s.streak + 1 : 1;
          return { streak, lastActiveDate: today };
        }),
      recordQuizResult: (score, total) =>
        set((s) => ({
          quizHighScore: Math.max(s.quizHighScore, score),
          // One star per completed quiz, never overwritten by word changes.
          quizStars: total > 0 ? Math.min(MAX_STARS, s.quizStars + 1) : s.quizStars,
        })),
      resetAll: () => set({ ...defaultProgress }),
    }),
    {
      name: PROGRESS_STORAGE_NAME,
      version: 1,
      storage: createIdbStorage(),
      partialize: (s): ProgressData => ({
        currentBookId: s.currentBookId,
        bookProgress: s.bookProgress,
        streak: s.streak,
        lastActiveDate: s.lastActiveDate,
        quizHighScore: s.quizHighScore,
        quizStars: s.quizStars,
        savedWordCount: s.savedWordCount,
      }),
    },
  ),
);

/** Derived: wordStars + quizStars, capped. Words never overwrite quiz stars. */
export function selectWordStars(s: ProgressData): number {
  return wordStarsFor(s.savedWordCount);
}
export function selectTotalStars(s: ProgressData): number {
  return Math.min(MAX_STARS, wordStarsFor(s.savedWordCount) + s.quizStars);
}

export function useProgressHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useProgress.persist.onFinishHydration(cb),
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}
