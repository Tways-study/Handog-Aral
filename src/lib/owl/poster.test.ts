import { beforeEach, describe, expect, it } from "vitest";
import { POSTER_LIMIT, captureOwlPoster, getOwlPoster, loadBundledOwlPoster, putOwlPoster, resetOwlPosters } from "./poster";

const png = (n = 10) => "data:image/png;base64," + "A".repeat(n);

beforeEach(() => resetOwlPosters());

describe("owl poster", () => {
  it("remembers a still per mood and outfit, in memory and in storage", () => {
    putOwlPoster("idle", "none", png(), 222);
    expect(getOwlPoster("idle", "none", 222)).toBe(png());
    expect(getOwlPoster("cheer", "none", 222)).toBeNull();
    expect(getOwlPoster("idle", "cap", 222)).toBeNull();
    // it is written to storage too, so the next page load starts with it
    expect(localStorage.getItem("handog-owl-poster:1:idle:none")).toContain("data:image/png");
  });

  it("will not stretch a small still: a bigger owl falls back to the SVG", () => {
    putOwlPoster("idle", "none", png(), 150);
    expect(getOwlPoster("idle", "none", 150)).not.toBeNull();
    expect(getOwlPoster("idle", "none", 222)).toBeNull();
  });

  it("keeps the sharper still, not the smaller one that arrives later", () => {
    putOwlPoster("idle", "none", png(30), 300);
    putOwlPoster("idle", "none", png(5), 150);
    expect(getOwlPoster("idle", "none", 300)).toBe(png(30));
  });

  it("caps how many stills are stored", () => {
    for (let i = 0; i < POSTER_LIMIT + 3; i++) putOwlPoster("idle", `o${i}`, png(), 222);
    const stored = Object.keys(localStorage).filter((k) => k.startsWith("handog-owl-poster:1:") );
    expect(stored.length).toBeLessThanOrEqual(POSTER_LIMIT);
  });

  it("ignores anything that is not an image data URL", () => {
    putOwlPoster("idle", "none", "https://evil.example/x.png", 222);
    expect(getOwlPoster("idle", "none", 100)).toBeNull();
  });

  it("captures from a canvas and never throws when the canvas cannot be read", () => {
    const ok = { width: 222, toDataURL: () => png() } as unknown as HTMLCanvasElement;
    captureOwlPoster(ok, "idle", "none");
    expect(getOwlPoster("idle", "none", 200)).toBe(png());
    const bad = { width: 222, toDataURL: () => { throw new Error("lost"); } } as unknown as HTMLCanvasElement;
    expect(() => captureOwlPoster(bad, "cheer", "none")).not.toThrow();
    const tiny = { width: 40, toDataURL: () => png() } as unknown as HTMLCanvasElement;
    captureOwlPoster(tiny, "think", "none");
    expect(getOwlPoster("think", "none", 40)).toBeNull();
  });
});

describe("bundled owl poster", () => {
  it("serves the idle owl before this device has captured one, and nothing for other looks", async () => {
    expect(getOwlPoster("idle", "none", 222)).toBeNull();
    const url = await loadBundledOwlPoster("idle", "none", 222);
    expect(url).toMatch(/^data:image\/webp;base64,/);
    expect(await loadBundledOwlPoster("cheer", "none", 222)).toBeNull();
    expect(await loadBundledOwlPoster("idle", "cap", 222)).toBeNull();
  });

  it("does not stretch it for a larger owl, and never overwrites a sharper captured still", async () => {
    expect(await loadBundledOwlPoster("idle", "none", 600)).toBeNull();
    resetOwlPosters();
    putOwlPoster("idle", "none", "data:image/png;base64,AAAA", 900);
    await loadBundledOwlPoster("idle", "none", 100);
    expect(getOwlPoster("idle", "none", 800)).toBe("data:image/png;base64,AAAA");
  });
});
