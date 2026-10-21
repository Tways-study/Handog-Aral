import { describe, expect, it } from "vitest";
import { distanceToRect, NEAREST_WORD_RADIUS, nearestWordIndex, type WordRect } from "./nearestWord";

// Two lines of 36 px pitch; "a" is a tiny 18 px word, the rest are wider.
const rects: WordRect[] = [
  { index: 0, left: 20, top: 0, right: 80, bottom: 36 },
  { index: 2, left: 88, top: 0, right: 106, bottom: 36 }, // "a"
  { index: 4, left: 114, top: 0, right: 190, bottom: 36 },
  { index: 6, left: 20, top: 36, right: 120, bottom: 72 },
];

describe("distanceToRect", () => {
  it("is 0 inside, straight-line outside, hypotenuse at corners", () => {
    expect(distanceToRect(30, 10, rects[0])).toBe(0);
    expect(distanceToRect(100, 10, rects[0])).toBe(20);
    expect(distanceToRect(83, 40, rects[0])).toBeCloseTo(5);
    expect(distanceToRect(83, 40, { left: 20, top: 0, right: 80, bottom: 36 })).toBeCloseTo(5);
  });
});

describe("nearestWordIndex", () => {
  it("a tap inside a word picks that word", () => {
    expect(nearestWordIndex(rects, 40, 18)).toBe(0);
    expect(nearestWordIndex(rects, 97, 18)).toBe(2);
  });
  it("a tap in the gap between two words picks the nearer one", () => {
    expect(nearestWordIndex(rects, 83, 18)).toBe(0); // 3 px from "The", 5 from "a"
    expect(nearestWordIndex(rects, 86, 18)).toBe(2);
  });
  it("a tap on the line gap or just below the last line still finds a word", () => {
    expect(nearestWordIndex(rects, 60, 80)).toBe(6);
    expect(nearestWordIndex(rects, 60, 90)).toBe(6);
  });
  it("a miss beyond the radius is null", () => {
    expect(nearestWordIndex(rects, 60, 72 + NEAREST_WORD_RADIUS + 1)).toBeNull();
    expect(nearestWordIndex(rects, 400, 18)).toBeNull();
    expect(nearestWordIndex([], 1, 1)).toBeNull();
  });
  it("breaks an exact tie by the nearer centre", () => {
    const touching: WordRect[] = [
      { index: 1, left: 0, top: 0, right: 100, bottom: 36 },
      { index: 3, left: 100, top: 0, right: 120, bottom: 36 },
    ];
    expect(nearestWordIndex(touching, 100, 18)).toBe(3); // on the shared edge, closer to the small word's centre
    expect(nearestWordIndex(touching, 50, 18)).toBe(1);
  });
  it("honours a custom radius", () => {
    expect(nearestWordIndex(rects, 60, 90, 10)).toBeNull();
  });
});
