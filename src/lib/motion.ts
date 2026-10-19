"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Motion for Handog Aral: restrained, transform/opacity only, one authored moment per flow.
 * Every tween runs inside gsap.matchMedia() gated on (prefers-reduced-motion: no-preference),
 * so with reduced motion the helpers do nothing and elements simply stay in their final state.
 * Nothing here loops.
 */

// Register once, only in the browser, so importing this module during SSR is harmless.
let registered = false;
function ensureRegistered(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(useGSAP);
  registered = true;
}
ensureRegistered();

export { gsap, useGSAP };

export const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

/** Durations in seconds, all within 150-300ms. */
export const DURATION = { fast: 0.15, base: 0.22, slow: 0.3 } as const;

/** Exponential ease-out for things entering, plain ease-in for things leaving. */
export const EASE = { in: "power2.in", out: "expo.out" } as const;

export type Cleanup = () => void;
const noop: Cleanup = () => {};

/** True when the user has not asked for reduced motion. False on the server. */
export function motionAllowed(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MOTION_QUERY).matches;
}

/**
 * Runs `build` only while motion is allowed, and reverts everything it created when the
 * preference flips, or when the returned cleanup is called.
 */
export function withMotion(build: () => void): Cleanup {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return noop;
  ensureRegistered();
  const mm = gsap.matchMedia();
  mm.add(MOTION_QUERY, () => {
    build();
  });
  return () => mm.revert();
}

type Target = Element | null | undefined;

/** The word panel / drawer content arriving. Starts visible, so reduced motion shows it instantly. */
export function enterPanel(el: Target, opts: { from?: "bottom" | "right" } = {}): Cleanup {
  if (!el) return noop;
  const axis = opts.from === "right" ? { x: 24 } : { y: 24 };
  return withMotion(() => {
    gsap.from(el, { ...axis, opacity: 0, duration: DURATION.slow, ease: EASE.out, clearProps: "transform,opacity" });
  });
}

/**
 * Tapped-word marker sweep. Expects the word element to be `.word-mark[data-state="tapped"]`:
 * its ::before marker scales in from the left through the --mark-x variable (a scaleX transform).
 */
export function markWord(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.fromTo(
      el,
      { "--mark-x": 0 },
      { "--mark-x": 1, duration: DURATION.base, ease: EASE.out, clearProps: "--mark-x" },
    );
  });
}

/** A check mark or star stamp landing on the page: scale and rotate settle, played once. */
export function stampIn(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.from(el, {
      scale: 1.6,
      rotation: -16,
      opacity: 0,
      duration: DURATION.slow,
      ease: EASE.out,
      transformOrigin: "50% 50%",
      clearProps: "transform,opacity",
    });
  });
}

/** Subtle route change fade. */
export function fadeRoute(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.from(el, { opacity: 0, y: 6, duration: DURATION.base, ease: EASE.out, clearProps: "transform,opacity" });
  });
}

/**
 * Hook form. Returns stable helpers whose tweens are reverted when the component unmounts.
 *   const { markWord } = useMotion();
 *   useEffect(() => { if (tapped) markWord(ref.current); }, [tapped]);
 */
export function useMotion() {
  const [store] = useState(() => {
    const live = new Set<Cleanup>();
    const track =
      <A extends unknown[]>(fn: (...args: A) => Cleanup) =>
      (...args: A): Cleanup => {
        const cleanup = fn(...args);
        live.add(cleanup);
        return () => {
          cleanup();
          live.delete(cleanup);
        };
      };
    return {
      helpers: {
        allowed: motionAllowed,
        enterPanel: track(enterPanel),
        markWord: track(markWord),
        stampIn: track(stampIn),
        fadeRoute: track(fadeRoute),
      },
      dispose: () => {
        live.forEach((c) => c());
        live.clear();
      },
    };
  });

  useEffect(() => store.dispose, [store]);
  return store.helpers;
}
