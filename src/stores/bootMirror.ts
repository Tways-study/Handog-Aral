import type { Language } from "@/shared/schemas";

/**
 * A synchronous localStorage copy of each persisted store (idb-keyval stays the source of truth).
 * Reading it at store creation lets the first client render use the real settings instead of waiting
 * for IndexedDB, and lets the failure pages (which run outside the providers) pick a language.
 */
export const MIRROR_PREFIX = "handog-mirror:";

export function readMirror(name: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(MIRROR_PREFIX + name);
  } catch {
    return null;
  }
}

export function writeMirror(name: string, value: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(MIRROR_PREFIX + name);
    else localStorage.setItem(MIRROR_PREFIX + name, value);
  } catch {
    // storage unavailable or full: the idb copy still holds the state
  }
}

/** The child's language from the mirror, defaulting to Hiligaynon. Safe anywhere, never throws. */
export function readMirroredLanguage(): Language {
  try {
    const raw = readMirror("handog-settings");
    const lang = raw ? (JSON.parse(raw) as { state?: { language?: unknown } }).state?.language : undefined;
    return lang === "tagalog" ? "tagalog" : "hiligaynon";
  } catch {
    return "hiligaynon";
  }
}

/** localStorage key of the pre-v3 state blob (see migrate.ts). Lives here so boot can test for it without loading Dexie. */
export const LEGACY_STORAGE_KEY = "handog-aral-state";

export function hasLegacyState(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(LEGACY_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
