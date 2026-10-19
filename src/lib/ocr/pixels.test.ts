import { describe, expect, it } from "vitest";
import { contrastStretch, fitLongEdge, grayscale } from "./pixels";

describe("pixels", () => {
  it("grayscale equalizes channels with luma weights", () => {
    const d = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
    grayscale(d);
    expect(d[0]).toBe(d[1]);
    expect(d[1]).toBe(d[2]);
    expect(d[0]).toBe(76);
    expect(d[4]).toBe(150);
    expect(d[3]).toBe(255);
  });
  it("contrastStretch expands a narrow range", () => {
    const vals = Array.from({ length: 100 }, (_, i) => 100 + (i % 50));
    const d = new Uint8ClampedArray(vals.flatMap((v) => [v, v, v, 255]));
    contrastStretch(d);
    const ys = Array.from({ length: 100 }, (_, i) => d[i * 4]);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(255);
  });
  it("contrastStretch leaves flat images alone", () => {
    const d = new Uint8ClampedArray([128, 128, 128, 255, 128, 128, 128, 255]);
    contrastStretch(d);
    expect(d[0]).toBe(128);
  });
  it("fitLongEdge clamps both ways", () => {
    expect(fitLongEdge(4000, 2000, 1200, 2000)).toEqual({ width: 2000, height: 1000 });
    expect(fitLongEdge(600, 300, 1200, 2400)).toEqual({ width: 1200, height: 600 });
    expect(fitLongEdge(1500, 1000, 1200, 2400)).toEqual({ width: 1500, height: 1000 });
  });
});
