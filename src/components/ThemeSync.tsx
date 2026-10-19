"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSettings, useSettingsHydrated } from "@/stores/settings";

/** Plain localStorage mirror of the theme, read by the inline script in layout.tsx to avoid a flash. */
export const THEME_STORAGE_KEY = "handog-theme";
export const THEME_COLOR = { light: "#FBF7EE", dark: "#1A1D2A" } as const;

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
  const resolved = useResolvedTheme();

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
