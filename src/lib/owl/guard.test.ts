import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasOwl3dFailed, resetOwlCapability } from "./capability";
import { createFrameGuard } from "./frameGuard";
import { attachRendererGuard } from "./rendererGuard";

describe("frame guard", () => {
  it("flags a slow average after the sample window", () => {
    const onSlow = vi.fn();
    const g = createFrameGuard({ sampleFrames: 40, maxAvgMs: 40, onSlow });
    for (let i = 0; i < 39; i++) g.record(60);
    expect(onSlow).not.toHaveBeenCalled();
    g.record(60);
    expect(onSlow).toHaveBeenCalledOnce();
    expect(g.done).toBe(true);
  });
  it("stays quiet at a healthy frame time and ignores later frames", () => {
    const onSlow = vi.fn();
    const g = createFrameGuard({ onSlow });
    for (let i = 0; i < 40; i++) g.record(16.7);
    for (let i = 0; i < 40; i++) g.record(500);
    expect(onSlow).not.toHaveBeenCalled();
  });
});

describe("renderer guard (mocked renderer)", () => {
  beforeEach(() => resetOwlCapability());

  it("tears down and remembers the failure on webglcontextlost", () => {
    const canvas = new EventTarget();
    const renderer = { dispose: vi.fn() };
    const onFail = vi.fn(() => renderer.dispose());
    attachRendererGuard(canvas, { onFail });
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(onFail).toHaveBeenCalledOnce();
    expect(onFail).toHaveBeenCalledWith("context-lost", undefined);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(hasOwl3dFailed()).toBe(true);
  });

  it("falls back when frames are slow", () => {
    const canvas = new EventTarget();
    const onFail = vi.fn();
    const guard = attachRendererGuard(canvas, { onFail, sampleFrames: 5, maxAvgMs: 40 });
    for (let i = 0; i < 5; i++) guard.recordFrame(80);
    expect(onFail).toHaveBeenCalledWith("slow", 80);
    expect(hasOwl3dFailed()).toBe(true);
  });

  it("stops listening after dispose", () => {
    const canvas = new EventTarget();
    const onFail = vi.fn();
    const guard = attachRendererGuard(canvas, { onFail });
    guard.dispose();
    canvas.dispatchEvent(new Event("webglcontextlost"));
    expect(onFail).not.toHaveBeenCalled();
  });
});
