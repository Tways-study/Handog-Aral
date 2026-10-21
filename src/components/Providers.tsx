"use client";

import { useEffect, type ReactNode } from "react";
import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { toast } from "sonner";
import { translations } from "@/data/translations";
import { startInstallCapture } from "@/hooks/useInstallPrompt";
import { hasLegacyState } from "@/stores/bootMirror";
import { useProgressHydrated } from "@/stores/progress";
import { useSettings, useSettingsHydrated } from "@/stores/settings";
import AppShell from "@/components/AppShell";
import CelebrationHost from "@/components/celebration/CelebrationHost";
import RewardsBoot from "@/components/celebration/RewardsBoot";
import LoadingFrame from "@/components/LoadingFrame";
import ThemeSync from "@/components/ThemeSync";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// The Capacitor export ships files locally, so no service worker there.
const SW_ENABLED =
  process.env.NEXT_PUBLIC_BUILD_TARGET !== "capacitor" && process.env.NODE_ENV === "production";

const currentStrings = () => translations[useSettings.getState().language] ?? translations.hiligaynon;

const whenIdle = (cb: () => void, timeout: number): (() => void) => {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(cb, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(cb, Math.min(timeout, 300));
  return () => clearTimeout(id);
};

/**
 * Data-layer boot, kept off the first paint. The Dexie/zod-heavy modules are imported on demand:
 * the legacy-state migration starts immediately (only when an old blob exists, so it finishes long
 * before a child can save a word), the dictionary seed and lookup queue wait for an idle moment.
 */
function useBoot() {
  useEffect(() => {
    let stopQueue: (() => void) | undefined;
    let cancelled = false;
    startInstallCapture();
    if (hasLegacyState()) void import("@/stores/migrate").then((m) => m.runMigrations()).catch(() => {});
    // Short deadline: a tap right after load should still find the curated dictionary.
    const cancelSeed = whenIdle(() => void import("@/lib/dictionary/seed").then((m) => m.ensureDictionary()).catch(() => {}), 400);
    const cancelQueue = whenIdle(() => {
      void import("@/lib/queue/processor").then((m) => {
        if (cancelled) return;
        stopQueue = m.startLookupQueue({
          onUpgraded: (n) => toast(currentStrings().shell.upgradedWords(n)),
        });
      });
    }, 2000);
    return () => {
      cancelled = true;
      cancelSeed();
      cancelQueue();
      stopQueue?.();
    };
  }, []);
}

/** "Update available" toast: a new service worker is waiting, so offer to activate it and reload. */
function UpdatePrompt() {
  const { serwist } = useSerwist();
  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => {
      const t = currentStrings().shell;
      toast(t.updateAvailable, {
        id: "sw-update",
        duration: Infinity,
        action: {
          label: t.updateAction,
          onClick: () => {
            serwist.addEventListener("controlling", () => window.location.reload());
            serwist.messageSkipWaiting();
          },
        },
      });
    };
    serwist.addEventListener("waiting", onWaiting);
    return () => serwist.removeEventListener("waiting", onWaiting);
  }, [serwist]);
  return null;
}

/**
 * Holds the first paint on a designed loading frame until the persisted settings and progress
 * have been read, so a returning child never sees the default language or an empty name flash by.
 */
function HydrationGate({ children }: { children: ReactNode }) {
  const settingsReady = useSettingsHydrated();
  const progressReady = useProgressHydrated();
  return settingsReady && progressReady ? <>{children}</> : <LoadingFrame />;
}

export default function Providers({ children }: { children: ReactNode }) {
  useBoot();
  return (
    // reloadOnOnline is off: a child mid-page must never lose their place when the signal returns.
    <SerwistProvider swUrl="/serwist/sw.js" disable={!SW_ENABLED} reloadOnOnline={false}>
      <TooltipProvider>
        <ThemeSync />
        <UpdatePrompt />
        <AppShell>
          <HydrationGate>{children}</HydrationGate>
        </AppShell>
        <RewardsBoot />
        <CelebrationHost />
        <Toaster />
      </TooltipProvider>
    </SerwistProvider>
  );
}
