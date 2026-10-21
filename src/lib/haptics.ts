import { useSettings } from "@/stores/settings";

export type Buzz = "tap" | "success";

const PATTERNS: Record<Buzz, number | number[]> = {
  tap: 10,
  success: [18, 40, 28],
};

/** A tiny vibration, only when the child allows it and the device supports it. Returns true if it buzzed. */
export function buzz(kind: Buzz): boolean {
  if (!useSettings.getState().haptics) return false;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  try {
    return navigator.vibrate(PATTERNS[kind]);
  } catch {
    return false;
  }
}
