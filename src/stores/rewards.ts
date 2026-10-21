"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import { celebrate } from "@/components/celebration/queue";
import { applyEventToFlags, defaultFlags, evaluateEvent, type RewardEvent, type RewardFlags } from "@/lib/stickers/evaluate";
import { STICKER_IDS, type StickerId } from "@/lib/stickers/ids";
import { MAX_STARS, selectWordStars, type ProgressData } from "./progress";
import { createIdbStorage } from "./storage";

/** Bonus stars (memory-game wins) are capped so they stay a treat, not a way to skip reading. */
export const MAX_BONUS_STARS = 5;
/** Word stars (5) + quiz stars (5) + bonus stars (5). */
export const MAX_ALL_STARS = MAX_STARS * 2 + MAX_BONUS_STARS;

export interface RewardsData {
  /** Sticker id -> epoch ms when it was earned. */
  earned: Partial<Record<StickerId, number>>;
  /** Earned stickers the child has already looked at (the rest show a NEW marker). */
  seen: StickerId[];
  flags: RewardFlags;
  bonusStars: number;
}

export interface RewardsState extends RewardsData {
  /** Idempotent. Returns true when the sticker was newly earned. Does not celebrate by itself. */
  award: (id: StickerId) => boolean;
  markSeen: (id: StickerId) => void;
  addBonusStars: (n: number) => void;
  /** Applies an event, awards what it earns, queues one celebration per new sticker. Returns the NEW ids. `{ celebrate: false }` awards quietly (used to backfill an existing child's progress). */
  recordEvent: (event: RewardEvent, opts?: { celebrate?: boolean }) => StickerId[];
  reset: () => void;
}

export const defaultRewards: RewardsData = { earned: {}, seen: [], flags: defaultFlags, bonusStars: 0 };

export const REWARDS_STORAGE_NAME = "handog-rewards";

const validIds = new Set<string>(STICKER_IDS);

export const useRewards = create<RewardsState>()(
  persist(
    (set, get) => ({
      ...defaultRewards,
      award: (id) => {
        if (get().earned[id] !== undefined) return false;
        set((s) => ({ earned: { ...s.earned, [id]: Date.now() } }));
        return true;
      },
      markSeen: (id) => set((s) => (s.seen.includes(id) ? s : { seen: [...s.seen, id] })),
      addBonusStars: (n) => set((s) => ({ bonusStars: Math.max(0, Math.min(MAX_BONUS_STARS, s.bonusStars + Math.floor(n))) })),
      recordEvent: (event, opts) => {
        const flags = applyEventToFlags(get().flags, event);
        const fresh = evaluateEvent(event, flags, get().earned);
        const now = Date.now();
        set((s) => ({
          flags,
          earned: fresh.length ? { ...s.earned, ...Object.fromEntries(fresh.map((id) => [id, now])) } : s.earned,
        }));
        if (opts?.celebrate !== false) for (const sticker of fresh) celebrate({ sticker, owlMood: "cheer" });
        return fresh;
      },
      reset: () => set({ ...defaultRewards, flags: { ...defaultFlags, openedBooks: [] } }),
    }),
    {
      name: REWARDS_STORAGE_NAME,
      version: 1,
      // v0 (nothing stored yet) -> v1: start from the defaults; keep only what we recognise.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<RewardsData>;
        const earned: RewardsData["earned"] = {};
        for (const [id, at] of Object.entries(old.earned ?? {})) {
          if (validIds.has(id) && typeof at === "number") earned[id as StickerId] = at;
        }
        return {
          earned,
          seen: (old.seen ?? []).filter((id) => validIds.has(id)),
          flags: { ...defaultFlags, ...(old.flags ?? {}) },
          bonusStars: Math.max(0, Math.min(MAX_BONUS_STARS, Number(old.bonusStars) || 0)),
        } as RewardsData;
      },
      storage: createIdbStorage(() => void useRewards.persist.rehydrate()),
      partialize: (s): RewardsData => ({ earned: s.earned, seen: s.seen, flags: s.flags, bonusStars: s.bonusStars }),
    },
  ),
);

/** Stickers earned but not yet looked at. */
export function selectUnseen(s: RewardsData): StickerId[] {
  return (Object.keys(s.earned) as StickerId[]).filter((id) => !s.seen.includes(id));
}

/**
 * Every star the child can show: word stars (max 5) + quiz stars (max 5) + bonus stars (max 5),
 * so at most MAX_ALL_STARS (15). Each part is capped on its own so one source never crowds out another.
 */
export function selectAllStars(progress: ProgressData, rewards: Pick<RewardsData, "bonusStars">): number {
  const quiz = Math.min(MAX_STARS, progress.quizStars);
  const bonus = Math.min(MAX_BONUS_STARS, rewards.bonusStars);
  return Math.min(MAX_ALL_STARS, selectWordStars(progress) + quiz + bonus);
}

export function useRewardsHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useRewards.persist.onFinishHydration(cb),
    () => useRewards.persist.hasHydrated(),
    () => false,
  );
}
