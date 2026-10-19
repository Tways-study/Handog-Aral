import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { DURATION, enterPanel, fadeRoute, markWord, motionAllowed, stampIn } from "./motion";

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

  it("is a safe no-op for a missing element", () => {
    mockMatchMedia(false);
    expect(() => enterPanel(null)()).not.toThrow();
  });
});
