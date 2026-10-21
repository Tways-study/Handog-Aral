"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProgress } from "./progress";
import { useRewards } from "./rewards";
import { createIdbStorage } from "./storage";

/**
 * One-time "capability moments" for the Reader, Scan and Quiz. Each flag is claimed once, ever, on this device,
 * so a celebration never repeats. Persisted like the other stores (synchronous mirror on first read).
 */
export const MOMENT_FLAGS = ["firstTap", "firstSave", "firstQuiz", "scanRead"] as const;
export type MomentFlag = (typeof MOMENT_FLAGS)[number];

export type MomentsData = Record<MomentFlag, boolean>;

export interface MomentsState extends MomentsData {
  /**
   * Claim a moment: true the first time it is asked for, false ever after. A child who already has the
   * matching history (saved words, a finished quiz, a scan) never gets a "first time" for it.
   */
  claim: (flag: MomentFlag) => boolean;
  /** True while the moment has not been claimed (does not claim it). */
  pending: (flag: MomentFlag) => boolean;
  reset: () => void;
}

export const defaultMoments: MomentsData = { firstTap: false, firstSave: false, firstQuiz: false, scanRead: false };

export const MOMENTS_STORAGE_NAME = "handog-moments";

/** True when this child's saved progress already proves they did the thing the moment celebrates. */
export function hasHistoryFor(flag: MomentFlag): boolean {
  const progress = useProgress.getState();
  const rewards = useRewards.getState();
  switch (flag) {
    case "firstTap":
    case "firstSave":
      return progress.savedWordCount > 0 || rewards.earned["first-word"] !== undefined;
    case "firstQuiz":
      return progress.quizStars > 0 || rewards.flags.quizzed;
    case "scanRead":
      return rewards.flags.scanned;
  }
}

export const useMoments = create<MomentsState>()(
  persist(
    (set, get) => ({
      ...defaultMoments,
      pending: (flag) => !get()[flag] && !hasHistoryFor(flag),
      claim: (flag) => {
        if (get()[flag]) return false;
        const fresh = !hasHistoryFor(flag);
        set({ [flag]: true } as Partial<MomentsData>);
        return fresh;
      },
      reset: () => set({ ...defaultMoments }),
    }),
    {
      name: MOMENTS_STORAGE_NAME,
      version: 1,
      storage: createIdbStorage(() => void useMoments.persist.rehydrate()),
      partialize: (s): MomentsData => ({ firstTap: s.firstTap, firstSave: s.firstSave, firstQuiz: s.firstQuiz, scanRead: s.scanRead }),
    },
  ),
);
