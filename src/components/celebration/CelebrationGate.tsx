"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useCelebrations } from "./queue";

// The dialog, confetti, sticker art and the owl inside it stay out of the first-load bundle.
const CelebrationHost = dynamic(() => import("./CelebrationHost"), { ssr: false });

/**
 * Always mounted in Providers, and tiny on purpose: it only watches the (zustand-only) queue. The first time
 * a celebration is queued it loads the real host; the queue itself lives in the store, so a moment queued
 * before the chunk arrives is shown the instant it does and is never lost. Once loaded the host stays
 * mounted so the dialog can play its close animation.
 */
export default function CelebrationGate() {
  const pending = useCelebrations((s) => s.queue.length > 0);
  const [needed, setNeeded] = useState(false);
  if (pending && !needed) setNeeded(true);
  return needed ? <CelebrationHost /> : null;
}
