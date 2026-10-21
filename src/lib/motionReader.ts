import { DURATION, EASE, gsap, motionAllowed, withMotion, type Cleanup } from "@/lib/motion";

/**
 * Reader, Scan and Quiz moments. Same contract as src/lib/motion.ts: every tween runs inside
 * gsap.matchMedia() gated on (prefers-reduced-motion: no-preference), uses transform/opacity only,
 * plays once and never loops. With reduced motion the helpers do nothing and elements simply stay
 * in their final, settled state.
 */

const noop: Cleanup = () => {};
type Target = Element | null | undefined;

/** Lines past this share the last delay, so a long page never takes seconds to appear. */
export const LINE_DEVELOP_MAX = 12;
export const LINE_DEVELOP_STAGGER = 0.06;

/**
 * A big rubber stamp landing on the paper: scales `from` (1.35) down to 1 with an ~8 degree settle and a
 * small overshoot, as if pressed. `from: 1.15` is the gentler quiz version.
 */
export function stampLand(el: Target, opts: { delay?: number; from?: number } = {}): Cleanup {
  if (!el) return noop;
  const from = opts.from ?? 1.35;
  return withMotion(() => {
    gsap.fromTo(
      el,
      { scale: from, rotation: 8, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: DURATION.slow,
        delay: opts.delay ?? 0,
        ease: "back.out(1.7)",
        transformOrigin: "50% 50%",
        clearProps: "transform,opacity",
      },
    );
  });
}

/** Groups of elements, one group per visual line of text. A bare element counts as a one-element line. */
export type LineGroup = Element | Element[];

/** The delay (seconds) of line `i`: 60 ms apart, capped so only the first LINE_DEVELOP_MAX lines are staggered. */
export function lineDelay(i: number): number {
  return Math.min(Math.max(0, i), LINE_DEVELOP_MAX - 1) * LINE_DEVELOP_STAGGER;
}

/**
 * Scanned text "develops" onto the ruled paper, line by line: each line rises 8 px and fades in, 60 ms after
 * the one before it (transform + opacity only, staggered over at most 12 lines).
 */
export function lineDevelop(lines: LineGroup[]): Cleanup {
  const groups = lines.map((l) => (Array.isArray(l) ? l : [l])).filter((g) => g.length > 0);
  if (!groups.length) return noop;
  return withMotion(() => {
    groups.forEach((group, i) => {
      gsap.from(group, { opacity: 0, y: 8, duration: DURATION.slow, delay: lineDelay(i), ease: EASE.out, clearProps: "transform,opacity" });
    });
  });
}

const STAR_CLIP = "polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%)";

function center(r: { left: number; top: number; width: number; height: number }) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * A small star copy flies from `from` (an element or rect, viewport coordinates) to the nav tab `to`, shrinking as it
 * goes, then removes itself. `onArrive` runs when it lands, or at once when motion is reduced (no flight).
 */
export function flyToTab(
  from: Target | DOMRect | { left: number; top: number; width: number; height: number },
  to: Target,
  opts: { onArrive?: () => void; size?: number } = {},
): Cleanup {
  const arrive = opts.onArrive ?? noop;
  if (typeof document === "undefined" || !from || !to || !motionAllowed()) {
    arrive();
    return noop;
  }
  const a = center("getBoundingClientRect" in from ? from.getBoundingClientRect() : from);
  const b = center(to.getBoundingClientRect());
  const size = opts.size ?? 22;
  const star = document.createElement("span");
  star.setAttribute("aria-hidden", "true");
  star.setAttribute("data-fly-star", "");
  star.style.cssText = `position:fixed;left:${a.x}px;top:${a.y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;background:var(--sunrise);clip-path:${STAR_CLIP};pointer-events:none;z-index:90;will-change:transform,opacity`;
  document.body.appendChild(star);
  let arrived = false;
  const land = () => {
    if (arrived) return;
    arrived = true;
    star.remove();
    arrive();
  };
  const kill = withMotion(() => {
    // x eases in-out, y eases in: together they draw a soft arc instead of a straight line.
    gsap.to(star, { x: b.x - a.x, duration: 0.62, ease: "power1.inOut" });
    gsap.to(star, { y: b.y - a.y, scale: 0.55, rotation: 140, duration: 0.62, ease: "power2.in", onComplete: land });
  });
  return () => {
    kill();
    star.remove();
  };
}

/** One soft pulse on a block (the home-language well): it swells a hair and settles. Transform only, once. */
export function pulseOnce(el: Target): Cleanup {
  if (!el) return noop;
  return withMotion(() => {
    gsap.fromTo(
      el,
      { scale: 1 },
      { keyframes: [{ scale: 1.035, duration: 0.18, ease: "power2.out" }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.5)" }], clearProps: "transform" },
    );
  });
}
