"use client";

import { useEffect } from "react";
import { backfillEvents } from "@/lib/stickers/backfill";
import { useProgress, useProgressHydrated } from "@/stores/progress";
import { useRewards, useRewardsHydrated } from "@/stores/rewards";

/**
 * Once the stores are read, quietly awards stickers for progress made before the sticker book
 * existed (no celebration queue; the stickers show a NEW marker in the book). Idempotent.
 */
export default function RewardsBoot() {
  const rewardsReady = useRewardsHydrated();
  const progressReady = useProgressHydrated();
  useEffect(() => {
    if (!rewardsReady || !progressReady) return;
    const { recordEvent } = useRewards.getState();
    for (const event of backfillEvents(useProgress.getState())) recordEvent(event, { celebrate: false });
  }, [rewardsReady, progressReady]);
  return null;
}
