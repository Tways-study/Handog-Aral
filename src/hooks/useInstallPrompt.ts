"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/** Chromium's non-standard install event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const isStandalone = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
};

const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Starts listening for the browser's install signals. Idempotent; called once from Providers so the
 * event is not missed when it fires before the Settings screen mounts. Never prompts by itself.
 */
export function startInstallCapture(): void {
  if (started || typeof window === "undefined" || isNative()) return;
  started = true;
  installed = isStandalone();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep the mini-infobar away: installing is always the adult's choice
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  startInstallCapture();
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

export interface InstallPrompt {
  /** The browser offered an install prompt we can trigger. */
  canInstall: boolean;
  /** Already running as an installed app (standalone display mode or iOS home-screen). */
  isInstalled: boolean;
  /** iPhone/iPad: no prompt exists, so the UI explains Share, Add to Home Screen. */
  isIOS: boolean;
  /** Inside the Capacitor Android shell: nothing to install. */
  isNative: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const isIOSDevice = (): boolean => {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac with touch.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

export function useInstallPrompt(): InstallPrompt {
  const canInstall = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const isInstalled = useSyncExternalStore(subscribe, () => installed || isStandalone(), () => false);
  const isIOS = useSyncExternalStore(subscribe, () => isIOSDevice(), () => false);
  const isNativeApp = useSyncExternalStore(subscribe, isNative, () => false);

  const promptInstall = useCallback(async () => {
    const event = deferred;
    if (!event || isNative()) return "unavailable" as const;
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferred = null; // a prompt event can only be used once
    emit();
    return outcome;
  }, []);

  return { canInstall, isInstalled, isIOS, isNative: isNativeApp, promptInstall };
}
