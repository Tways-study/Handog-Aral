"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { Language } from "@/shared/schemas";
import { createIdbStorage } from "./storage";

export type FontSize = "small" | "medium" | "large";
export type ColorOverlay = "none" | "yellow" | "blue" | "pink";
export type Theme = "system" | "light" | "dark";

export interface SettingsData {
  childName: string;
  language: Language;
  fontSize: FontSize;
  dyslexiaFont: boolean;
  ttsSpeed: number;
  colorOverlay: ColorOverlay;
  theme: Theme;
  /** True once the first-run welcome has been completed or skipped. */
  onboarded: boolean;
}

export interface SettingsState extends SettingsData {
  setChildName: (v: string) => void;
  setLanguage: (v: Language) => void;
  setFontSize: (v: FontSize) => void;
  setDyslexiaFont: (v: boolean) => void;
  setTtsSpeed: (v: number) => void;
  setColorOverlay: (v: ColorOverlay) => void;
  setTheme: (v: Theme) => void;
  setOnboarded: (v: boolean) => void;
  resetSettings: () => void;
}

export const defaultSettings: SettingsData = {
  childName: "",
  language: "hiligaynon",
  fontSize: "medium",
  dyslexiaFont: false,
  ttsSpeed: 0.8,
  colorOverlay: "none",
  theme: "system",
  onboarded: false,
};

export const SETTINGS_STORAGE_NAME = "handog-settings";

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setChildName: (childName) => set({ childName }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDyslexiaFont: (dyslexiaFont) => set({ dyslexiaFont }),
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
      setColorOverlay: (colorOverlay) => set({ colorOverlay }),
      setTheme: (theme) => set({ theme }),
      setOnboarded: (onboarded) => set({ onboarded }),
      // Resetting preferences must not send the child back through the welcome screen.
      resetSettings: () => set({ ...defaultSettings, onboarded: true }),
    }),
    {
      name: SETTINGS_STORAGE_NAME,
      version: 2,
      // v1 -> v2: a child who already has a name has been through setup.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<SettingsData>;
        return { ...old, onboarded: old.onboarded ?? Boolean(old.childName) } as SettingsData;
      },
      storage: createIdbStorage(() => void useSettings.persist.rehydrate()),
      skipHydration: false,
      partialize: (s): SettingsData => ({
        childName: s.childName,
        language: s.language,
        fontSize: s.fontSize,
        dyslexiaFont: s.dyslexiaFont,
        ttsSpeed: s.ttsSpeed,
        colorOverlay: s.colorOverlay,
        theme: s.theme,
        onboarded: s.onboarded,
      }),
    },
  ),
);

/** True once the persisted settings have been read from IndexedDB (always false on the server). */
export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useSettings.persist.onFinishHydration(cb),
    () => useSettings.persist.hasHydrated(),
    () => false,
  );
}
