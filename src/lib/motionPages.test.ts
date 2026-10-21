import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { BOOK_OPEN_MS, bookOpen, bookOpenThen, pageIn, superpowerIn, tabPop } from "./motionPages";

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

function el(html = ""): HTMLElement {
  const d = document.createElement("div");
  d.innerHTML = html;
  document.body.appendChild(d);
  return d;
}

beforeEach(() => gsap.globalTimeline.clear());
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("page motion honours prefers-reduced-motion", () => {
  it("creates no tween at all when motion is reduced", () => {
    mockMatchMedia(true);
    const root = el('<section data-rise></section><section data-rise></section>');
    const one = el();
    pageIn(root)();
    bookOpen(one)();
    tabPop(one)();
    superpowerIn(el('<div data-super-paper><button>a</button></div><p data-super-rest></p>'))();
    expect(gsap.globalTimeline.getChildren(true, true, true)).toHaveLength(0);
    expect(gsap.getTweensOf(root.children)).toHaveLength(0);
    expect(gsap.getTweensOf(one)).toHaveLength(0);
  });

  it("pageIn staggers 60 ms over the marked sections, plays once, and cleanup reverts", () => {
    mockMatchMedia(false);
    const root = el('<section data-rise></section><section data-rise></section><section data-rise></section>');
    const cleanup = pageIn(root);
    const tweens = gsap.getTweensOf(root.children[0]);
    expect(tweens).toHaveLength(1);
    expect(tweens[0].targets()).toHaveLength(3);
    expect(tweens[0].vars.stagger).toBe(0.06);
    expect(tweens[0].repeat()).toBe(0);
    cleanup();
    expect(gsap.getTweensOf(Array.from(root.children))).toHaveLength(0);
  });

  it("pageIn falls back to direct children when nothing is marked", () => {
    mockMatchMedia(false);
    const root = el("<p></p><p></p>");
    const cleanup = pageIn(root);
    expect(gsap.getTweensOf(root.children[1])).toHaveLength(1);
    cleanup();
  });

  it("bookOpen tilts about 6 degrees and scales 1.03 in about 200 ms", () => {
    mockMatchMedia(false);
    const node = el();
    const cleanup = bookOpen(node);
    const [tween] = gsap.getTweensOf(node);
    expect(tween.duration()).toBeLessThanOrEqual(0.22);
    expect(Math.abs(Number(tween.vars.rotation))).toBe(6);
    expect(tween.vars.scale).toBe(1.03);
    cleanup();
    expect(gsap.getTweensOf(node)).toHaveLength(0);
  });

  it("tabPop is one pop that clears its transform", () => {
    mockMatchMedia(false);
    const node = el();
    const cleanup = tabPop(node);
    const [tween] = gsap.getTweensOf(node);
    expect(tween.repeat()).toBe(0);
    expect(tween.vars.clearProps).toBe("transform");
    cleanup();
  });

  it("superpowerIn builds one timeline over paper, words and the rest", () => {
    mockMatchMedia(false);
    const root = el('<div data-super-paper><button>a</button><button>b</button></div><div data-super-rest></div>');
    const cleanup = superpowerIn(root);
    expect(gsap.getTweensOf(root.querySelector("button"))).toHaveLength(1);
    cleanup();
    expect(gsap.getTweensOf(root.querySelector("button"))).toHaveLength(0);
  });

  it("is a safe no-op for a missing element", () => {
    mockMatchMedia(false);
    expect(() => {
      pageIn(null)();
      bookOpen(null)();
      tabPop(null)();
      superpowerIn(null)();
    }).not.toThrow();
  });
});

describe("bookOpenThen", () => {
  it("navigates at once, with no tween, when motion is reduced", () => {
    mockMatchMedia(true);
    const go = vi.fn();
    const node = el();
    bookOpenThen(node, go)();
    expect(go).toHaveBeenCalledTimes(1);
    expect(gsap.getTweensOf(node)).toHaveLength(0);
  });

  it("waits at most ~220 ms while the jacket tilts, then navigates once", () => {
    mockMatchMedia(false);
    vi.useFakeTimers();
    const go = vi.fn();
    const node = el();
    const cleanup = bookOpenThen(node, go);
    expect(BOOK_OPEN_MS).toBeLessThanOrEqual(220);
    expect(go).not.toHaveBeenCalled();
    vi.advanceTimersByTime(BOOK_OPEN_MS);
    expect(go).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
