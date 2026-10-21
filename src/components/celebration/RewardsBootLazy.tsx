"use client";

import { softDynamic } from "@/lib/softDynamic";
import { useEffect, useState } from "react";

const RewardsBoot = softDynamic(() => import("./RewardsBoot"));

/** Mounts the sticker backfill only once the browser is idle, so its store and catalog stay out of the first load. */
export default function RewardsBootLazy() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setGo(true), { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => setGo(true), 1500);
    return () => clearTimeout(id);
  }, []);
  return go ? <RewardsBoot /> : null;
}
