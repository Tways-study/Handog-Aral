"use client";

import { gsap, motionAllowed, withMotion, DURATION, EASE, type Cleanup } from "@/lib/motion";

/**
 * Page-level motion for the screens (Welcome, Home, Books, the nav). Same contract as motion.ts:
 * transform/opacity only, each helper plays once, everything runs inside gsap.matchMedia() gated on
 * (prefers-reduced-motion: no-preference), so with reduced motion NOTHING is created and every element
 * simply stays in its final state. Nothing here loops.
 */

type Target = Element | null | undefined;
const noop: Cleanup = () => {};

/**
 * Sections rise 12 px and fade in, staggered 60 ms, once per mount. Targets every `[data-rise]`
 * inside `root`; when there are none, its direct children.
 */
export function pageIn(root: Target): Cleanup {
  if (!root) return noop;
  const marked = Array.from(root.querySelectorAll("[data-rise]"));
  const targets = marked.length ? marked : Array.from(root.children);
  if (targets.length === 0) return noop;
  return withMotion(() => {
    gsap.from(targets, { y: 12, opacity: 0, duration: DURATION.slow, stagger: 0.06, ease: EASE.out, clearProps: "transform,opacity" });
  });
}

/** The notebook jacket tilts about 6 degrees and grows 1.03x as it opens. Holds there (the page is navigating away). */
export function bookOpen(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.to(el, { rotation: -6, scale: 1.03, transformOrigin: "0% 100%", duration: 0.2, ease: "power2.out" });
  });
}

/** How long `bookOpenThen` waits before navigating, in ms (never more than ~220). */
export const BOOK_OPEN_MS = 200;

/**
 * Plays `bookOpen` and calls `go` right after it (BOOK_OPEN_MS later). With reduced motion `go` runs
 * at once and nothing animates, so navigation is never delayed for nothing.
 */
export function bookOpenThen(el: Target, go: () => void): Cleanup {
  if (!el || !motionAllowed()) {
    go();
    return noop;
  }
  const stop = bookOpen(el);
  const id = window.setTimeout(go, BOOK_OPEN_MS);
  return () => {
    window.clearTimeout(id);
    stop();
  };
}

/** One 1.2x pop on a nav tab icon ("something new is here"). Ends where it started. */
export function tabPop(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.to(el, {
      keyframes: [
        { scale: 1.2, duration: 0.12, ease: "power2.out" },
        { scale: 1, duration: 0.22, ease: "back.out(2.4)" },
      ],
      transformOrigin: "50% 50%",
      clearProps: "transform",
    });
  });
}

/**
 * The first-superpower step arriving: the sample paper rises, its words land one after another and the
 * action row settles. One authored timeline (about 0.9 s), never repeated.
 */
export function superpowerIn(root: Target): Cleanup {
  if (!root) return noop;
  const paper = root.querySelector("[data-super-paper]");
  const words = Array.from(root.querySelectorAll("[data-super-paper] button"));
  const rest = Array.from(root.querySelectorAll("[data-super-rest]"));
  if (!paper && words.length === 0 && rest.length === 0) return noop;
  return withMotion(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });
    if (paper) tl.from(paper, { y: 24, opacity: 0, duration: 0.32, clearProps: "transform,opacity" });
    if (words.length) tl.from(words, { y: 8, opacity: 0, duration: 0.2, stagger: 0.05, clearProps: "transform,opacity" }, "-=0.12");
    if (rest.length) tl.from(rest, { y: 10, opacity: 0, duration: 0.24, stagger: 0.06, clearProps: "transform,opacity" }, "-=0.1");
  });
}
