"use client";

import { useEffect, type ReactNode } from "react";
import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { toast } from "sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import { translations } from "@/data/translations";
import { ensureDictionary } from "@/lib/dictionary/seed";
import { startLookupQueue } from "@/lib/queue/processor";
import { runMigrations } from "@/stores/migrate";
import { useSettings, useSettingsHydrated } from "@/stores/settings";
import AppShell from "@/components/AppShell";
import LoadingFrame from "@/components/LoadingFrame";
import ThemeSync from "@/components/ThemeSync";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// The Capacitor export ships files locally, so no service worker there.
const SW_ENABLED =
  process.env.NEXT_PUBLIC_BUILD_TARGET !== "capacitor" && process.env.NODE_ENV === "production";

const currentStrings = () => translations[useSettings.getState().language] ?? translations.hiligaynon;

/** Data-layer boot: migrate old localStorage state, seed the dictionary, drain the lookup queue. */
function useBoot() {
  useEffect(() => {
    void runMigrations().catch(() => {});
    void ensureDictionary().catch(() => {});
    return startLookupQueue({
      onUpgraded: (n) => toast(currentStrings().shell.upgradedWords(n)),
    });
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
 * LEGACY — delete in Phase 4 together with AppContext.
 * Mirrors the old reducer's settings into the v3 settings store so the shell, theme and new
 * components follow what the old Settings screen changes.
 */
function LegacySettingsBridge() {
  const { state } = useApp();
  const hydrated = useSettingsHydrated();
  useEffect(() => {
    if (!hydrated) return;
    const s = useSettings.getState();
    if (s.language !== state.language) s.setLanguage(state.language);
    if (s.childName !== state.childName) s.setChildName(state.childName);
    if (s.fontSize !== state.fontSize) s.setFontSize(state.fontSize);
    if (s.dyslexiaFont !== state.dyslexiaFont) s.setDyslexiaFont(state.dyslexiaFont);
    if (s.colorOverlay !== state.colorOverlay) s.setColorOverlay(state.colorOverlay);
    if (s.ttsSpeed !== state.ttsSpeed) s.setTtsSpeed(state.ttsSpeed);
  }, [hydrated, state.language, state.childName, state.fontSize, state.dyslexiaFont, state.colorOverlay, state.ttsSpeed]);
  return null;
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
          {/* LEGACY: AppProvider goes away in Phase 4; the shell and everything above stay. */}
          <AppProvider fallback={<LoadingFrame />}>
            <LegacySettingsBridge />
            {children}
          </AppProvider>
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </SerwistProvider>
  );
}
