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

/**
 * A check mark or star stamp landing on the page: scale and rotate settle, played once.
 * `delay` (seconds) staggers several stamps landing one after another, e.g. the quiz results.
 */
export function stampIn(el: Target, opts: { delay?: number } = {}): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.from(el, {
      scale: 1.6,
      rotation: -16,
      opacity: 0,
      duration: DURATION.slow,
      delay: opts.delay ?? 0,
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

/** A sticker or card popping onto the page: scale 0.6 to 1 with a small overshoot. Once. */
export function popIn(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.from(el, { scale: 0.6, opacity: 0, duration: DURATION.slow, ease: "back.out(2.2)", clearProps: "transform,opacity" });
  });
}

/** One 400 ms shake ("not that one, try again"). Once, ends where it started. */
export function wiggle(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.to(el, {
      keyframes: { rotation: [-7, 6, -4, 2, 0] },
      duration: 0.4,
      ease: "power1.inOut",
      clearProps: "transform",
    });
  });
}

/** Drops or slides in from `from` and settles with an overshoot. Once. */
export function bounceIn(el: Target, opts: { from?: "top" | "bottom" | "left" | "right" } = {}): Cleanup {
  if (!el) return noop;
  const from = opts.from ?? "bottom";
  const axis = from === "top" ? { y: -40 } : from === "left" ? { x: -40 } : from === "right" ? { x: 40 } : { y: 40 };
  return withMotion(() => {
    gsap.from(el, { ...axis, opacity: 0, duration: 0.5, ease: "back.out(1.8)", clearProps: "transform,opacity" });
  });
}

/**
 * Turns a card over: rotateY 0 (face-down) or 180 (face-up) in 350 ms. The element should be the
 * inner wrapper of two faces with `backface-visibility: hidden`. With reduced motion the card
 * simply snaps to the final angle (no tween), so the game still works.
 */
export function flipCard(el: Target, faceUp: boolean): Cleanup {
  if (!el) return noop;
  const target = faceUp ? 180 : 0;
  const node = el as HTMLElement;
  if (!motionAllowed()) {
    if (node.style) node.style.transform = `rotateY(${target}deg)`;
    return noop;
  }
  return withMotion(() => {
    gsap.to(el, { rotationY: target, transformStyle: "preserve-3d", duration: 0.35, ease: "power2.inOut" });
  });
}

/** Squash-and-stretch on a tapped thing (a button, a card). Once. */
export function squish(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: () => void gsap.set(el, { clearProps: "transform" }) })
      .to(el, { scaleX: 1.14, scaleY: 0.86, duration: 0.09 })
      .to(el, { scaleX: 0.94, scaleY: 1.08, duration: 0.11 })
      .to(el, { scaleX: 1, scaleY: 1, duration: 0.14, ease: "back.out(2)" });
  });
}

/** Most pieces a burst may ever create (low-end phones). */
export const CONFETTI_MAX = 24;
const CONFETTI_COLORS = ["var(--sunrise)", "var(--mango)", "var(--gumamela)", "var(--kangkong)", "var(--indigo)"];

/**
 * A small burst of confetti and star pieces from viewport point `origin`. At most CONFETTI_MAX
 * pieces, transform/opacity only, all removed from the DOM when done, and NONE at all with reduced
 * motion. Decorative: the layer is aria-hidden and ignores pointers.
 */
export function confettiBurst(origin: { x: number; y: number }, opts: { count?: number } = {}): Cleanup {
  if (typeof document === "undefined" || !motionAllowed()) return noop;
  const count = Math.max(0, Math.min(CONFETTI_MAX, Math.floor(opts.count ?? 16)));
  if (count === 0) return noop;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("data-confetti", "");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:80";
  const pieces: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    const star = i % 3 === 0;
    const size = star ? 14 : 8 + (i % 3) * 2;
    piece.setAttribute("data-confetti-piece", "");
    piece.style.cssText = `position:absolute;left:${origin.x}px;top:${origin.y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};border-radius:${star ? "0" : i % 2 ? "50%" : "2px"};will-change:transform,opacity;${star ? "clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%);" : ""}`;
    layer.appendChild(piece);
    pieces.push(piece);
  }
  document.body.appendChild(layer);
  const remove = () => layer.remove();
  const kill = withMotion(() => {
    pieces.forEach((piece, i) => {
      const angle = (-Math.PI / 2) + ((i / count) * 2 - 1) * (Math.PI * 0.9);
      const dist = 70 + ((i * 37) % 70);
      gsap.to(piece, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist + 50,
        rotation: ((i * 53) % 360) - 180,
        duration: 0.9,
        ease: "power2.out",
      });
      gsap.to(piece, { opacity: 0, duration: 0.35, delay: 0.55 });
    });
    gsap.delayedCall(0.95, remove);
  });
  return () => {
    kill();
    remove();
  };
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
        popIn: track(popIn),
        wiggle: track(wiggle),
        bounceIn: track(bounceIn),
        flipCard: track(flipCard),
        squish: track(squish),
        confettiBurst: track(confettiBurst),
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
