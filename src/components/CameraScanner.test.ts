// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeGuideCrop } from "./CameraScanner";

describe("computeGuideCrop", () => {
  it("crops the centred 80% 4:3 guide when the video matches the container", () => {
    expect(computeGuideCrop(1600, 1200, 400, 300)).toEqual({ srcX: 160 * 1, srcY: 120, srcW: 1280, srcH: 960 });
  });
  it("accounts for object-cover cropping of a wide frame in a tall container", () => {
    const c = computeGuideCrop(1920, 1080, 360, 640);
    // scale = 640/1080; the frame is cropped left/right, the guide maps into the visible middle.
    expect(c.srcW / c.srcH).toBeCloseTo(4 / 3, 1);
    expect(c.srcX).toBeGreaterThan(0);
    expect(c.srcX + c.srcW).toBeLessThanOrEqual(1920);
  });
});
