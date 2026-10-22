"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSettings, useSettingsHydrated } from "@/stores/settings";

/** Browser toolbar color (the purple of the app icon; a deeper purple in dark mode). Plain localStorage mirror of the theme, read by the inline script in layout.tsx to avoid a flash. */
export const THEME_STORAGE_KEY = "handog-theme";
export const THEME_COLOR = { light: "#8A6FF0", dark: "#4A3C96" } as const;

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** The theme actually in effect ('system' resolved against the OS). Light on the server. */
export function useResolvedTheme(): "light" | "dark" {
  const theme = useSettings((s) => s.theme);
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}

/**
 * Applies the `dark` class on <html> from the settings store and mirrors the choice into
 * localStorage so the next load can set it before first paint. Waits for the store to hydrate
 * so the inline script's early choice is never overwritten by the 'system' default.
 */
export default function ThemeSync() {
  const hydrated = useSettingsHydrated();
  const theme = useSettings((s) => s.theme);
  const fontSize = useSettings((s) => s.fontSize);
  const dyslexiaFont = useSettings((s) => s.dyslexiaFont);
  const resolved = useResolvedTheme();

  // Reading settings: font scale on <html> (rem-based, drives --pitch) and the dyslexia font on <body>.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.remove("font-small", "font-medium", "font-large");
    root.classList.add(`font-${fontSize}`);
    document.body.classList.toggle("dyslexia-font", dyslexiaFont);
  }, [hydrated, fontSize, dyslexiaFont]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[resolved]));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // storage unavailable: the OS preference still applies on next load
    }
  }, [hydrated, resolved, theme]);

  return null;
}
