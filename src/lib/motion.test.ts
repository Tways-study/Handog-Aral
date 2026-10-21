import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { bounceIn, CONFETTI_MAX, confettiBurst, DURATION, enterPanel, fadeRoute, flipCard, markWord, motionAllowed, popIn, squish, stampIn, wiggle } from "./motion";

type Listener = (e: { matches: boolean }) => void;

function mockMatchMedia(reduced: boolean) {
  const impl = (query: string) => {
    // The app only asks about (prefers-reduced-motion: no-preference); that is true when NOT reduced.
    const matches = query.includes("no-preference") ? !reduced : false;
    const listeners = new Set<Listener>();
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, l: Listener) => listeners.add(l),
      removeEventListener: (_: string, l: Listener) => listeners.delete(l),
      addListener: (l: Listener) => listeners.add(l),
      removeListener: (l: Listener) => listeners.delete(l),
      dispatchEvent: () => false,
    };
  };
  vi.stubGlobal("matchMedia", impl);
  window.matchMedia = impl as unknown as typeof window.matchMedia;
}

function el(): HTMLElement {
  const d = document.createElement("div");
  document.body.appendChild(d);
  return d;
}

describe("motion helpers honour prefers-reduced-motion", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("durations stay within 150-300ms", () => {
    for (const d of Object.values(DURATION)) {
      expect(d).toBeGreaterThanOrEqual(0.15);
      expect(d).toBeLessThanOrEqual(0.3);
    }
  });

  it.each([
    ["enterPanel", enterPanel],
    ["markWord", markWord],
    ["stampIn", stampIn],
    ["fadeRoute", fadeRoute],
  ] as const)("%s creates no tween when motion is reduced", (_name, fn) => {
    mockMatchMedia(true);
    const node = el();
    const cleanup = fn(node);
    expect(motionAllowed()).toBe(false);
    expect(gsap.getTweensOf(node)).toHaveLength(0);
    cleanup();
  });

  it.each([
    ["enterPanel", enterPanel],
    ["markWord", markWord],
    ["stampIn", stampIn],
    ["fadeRoute", fadeRoute],
  ] as const)("%s tweens when motion is allowed, and cleanup reverts it", (_name, fn) => {
    mockMatchMedia(false);
    const node = el();
    const cleanup = fn(node);
    expect(motionAllowed()).toBe(true);
    expect(gsap.getTweensOf(node).length).toBeGreaterThan(0);
    cleanup();
    expect(gsap.getTweensOf(node)).toHaveLength(0);
  });

  it("stampIn staggers with a delay and still plays once", () => {
    mockMatchMedia(false);
    const node = el();
    const cleanup = stampIn(node, { delay: 0.2 });
    const [tween] = gsap.getTweensOf(node);
    expect(tween.delay()).toBeCloseTo(0.2);
    expect(tween.repeat()).toBe(0);
    cleanup();
  });

  it("is a safe no-op for a missing element", () => {
    mockMatchMedia(false);
    expect(() => enterPanel(null)()).not.toThrow();
  });
});

describe("playful helpers", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it.each([
    ["popIn", popIn],
    ["wiggle", wiggle],
    ["bounceIn", (n: Element) => bounceIn(n, { from: "top" })],
    ["squish", squish],
  ] as const)("%s creates no tween when motion is reduced", (_n, fn) => {
    mockMatchMedia(true);
    const node = el();
    fn(node)();
    expect(gsap.getTweensOf(node)).toHaveLength(0);
  });

  it.each([
    ["popIn", popIn],
    ["wiggle", wiggle],
    ["bounceIn", (n: Element) => bounceIn(n)],
    ["squish", squish],
  ] as const)("%s tweens once and cleanup reverts it", (_n, fn) => {
    mockMatchMedia(false);
    const node = el();
    const cleanup = fn(node);
    const tweens = gsap.getTweensOf(node);
    expect(tweens.length).toBeGreaterThan(0);
    for (const t of tweens) expect(t.repeat()).toBe(0);
    cleanup();
    expect(gsap.getTweensOf(node)).toHaveLength(0);
  });

  it("flipCard tweens rotateY in 350 ms, or snaps without a tween when reduced", () => {
    mockMatchMedia(false);
    const a = el();
    const c = flipCard(a, true);
    const [tween] = gsap.getTweensOf(a);
    expect(tween.duration()).toBeCloseTo(0.35);
    c();
    mockMatchMedia(true);
    const b = el();
    flipCard(b, true);
    expect(gsap.getTweensOf(b)).toHaveLength(0);
    expect(b.style.transform).toBe("rotateY(180deg)");
  });

  it("confettiBurst adds at most 24 pieces, then removes them", () => {
    mockMatchMedia(false);
    const cleanup = confettiBurst({ x: 100, y: 100 }, { count: 500 });
    const pieces = document.querySelectorAll("[data-confetti-piece]");
    expect(pieces.length).toBe(CONFETTI_MAX);
    expect(document.querySelector("[data-confetti]")?.getAttribute("aria-hidden")).toBe("true");
    cleanup();
    expect(document.querySelectorAll("[data-confetti-piece]")).toHaveLength(0);
  });

  it("confettiBurst makes ZERO nodes with reduced motion", () => {
    mockMatchMedia(true);
    confettiBurst({ x: 10, y: 10 })();
    expect(document.querySelectorAll("[data-confetti], [data-confetti-piece]")).toHaveLength(0);
  });
});
