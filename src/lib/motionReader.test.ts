import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { flyToTab, LINE_DEVELOP_MAX, lineDelay, lineDevelop, pulseOnce, stampLand } from "./motionReader";

function mockMatchMedia(reduced: boolean) {
  const impl = (query: string) => ({
    matches: query.includes("no-preference") ? !reduced : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
  vi.stubGlobal("matchMedia", impl);
  window.matchMedia = impl as unknown as typeof window.matchMedia;
}

function el(): HTMLElement {
  const d = document.createElement("div");
  document.body.appendChild(d);
  return d;
}

beforeEach(() => gsap.globalTimeline.clear());
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("reduced motion", () => {
  it("creates no tween and flies nothing, but still arrives", () => {
    mockMatchMedia(true);
    const a = el();
    const b = el();
    const arrive = vi.fn();
    stampLand(a);
    lineDevelop([a, [b]]);
    pulseOnce(a);
    flyToTab(a, b, { onArrive: arrive });
    expect(gsap.getTweensOf(a)).toHaveLength(0);
    expect(gsap.getTweensOf(b)).toHaveLength(0);
    expect(document.querySelector("[data-fly-star]")).toBeNull();
    expect(arrive).toHaveBeenCalledTimes(1);
  });
});

describe("with motion allowed", () => {
  it("stampLand tweens once and cleanup reverts it", () => {
    mockMatchMedia(false);
    const a = el();
    const cleanup = stampLand(a, { delay: 0.1 });
    expect(gsap.getTweensOf(a).length).toBeGreaterThan(0);
    cleanup();
    expect(gsap.getTweensOf(a)).toHaveLength(0);
  });

  it("lineDevelop staggers 60 ms per line and caps at 12 lines", () => {
    expect(lineDelay(0)).toBe(0);
    expect(lineDelay(1)).toBeCloseTo(0.06);
    expect(lineDelay(LINE_DEVELOP_MAX - 1)).toBeCloseTo(0.66);
    expect(lineDelay(40)).toBeCloseTo(lineDelay(LINE_DEVELOP_MAX - 1));
    mockMatchMedia(false);
    const lines = Array.from({ length: 20 }, () => el());
    const cleanup = lineDevelop(lines);
    lines.forEach((l) => expect(gsap.getTweensOf(l)).toHaveLength(1));
    expect(gsap.getTweensOf(lines[19])[0].delay()).toBeCloseTo(lineDelay(19));
    cleanup();
    expect(gsap.getTweensOf(lines[0])).toHaveLength(0);
  });

  it("lineDevelop ignores an empty page", () => {
    mockMatchMedia(false);
    expect(() => lineDevelop([])).not.toThrow();
  });

  it("flyToTab adds a star, moves it, and removes it on cleanup", () => {
    mockMatchMedia(false);
    const a = el();
    const b = el();
    const arrive = vi.fn();
    const cleanup = flyToTab(a, b, { onArrive: arrive });
    const star = document.querySelector("[data-fly-star]");
    expect(star).not.toBeNull();
    expect(gsap.getTweensOf(star).length).toBeGreaterThan(0);
    expect(arrive).not.toHaveBeenCalled();
    cleanup();
    expect(document.querySelector("[data-fly-star]")).toBeNull();
  });
});
