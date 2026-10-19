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
}

export interface SettingsState extends SettingsData {
  setChildName: (v: string) => void;
  setLanguage: (v: Language) => void;
  setFontSize: (v: FontSize) => void;
  setDyslexiaFont: (v: boolean) => void;
  setTtsSpeed: (v: number) => void;
  setColorOverlay: (v: ColorOverlay) => void;
  setTheme: (v: Theme) => void;
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
      resetSettings: () => set({ ...defaultSettings }),
    }),
    {
      name: SETTINGS_STORAGE_NAME,
      version: 1,
      storage: createIdbStorage(),
      skipHydration: false,
      partialize: (s): SettingsData => ({
        childName: s.childName,
        language: s.language,
        fontSize: s.fontSize,
        dyslexiaFont: s.dyslexiaFont,
        ttsSpeed: s.ttsSpeed,
        colorOverlay: s.colorOverlay,
        theme: s.theme,
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
