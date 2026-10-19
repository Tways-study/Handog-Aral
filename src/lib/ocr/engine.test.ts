import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ isReachable: vi.fn(), ocrRemote: vi.fn() }));
const tess = vi.hoisted(() => ({ recognizeLocal: vi.fn() }));
vi.mock("@/lib/api", () => api);
vi.mock("./preprocess", () => ({
  prepareForAI: vi.fn(async (b: Blob) => b),
  prepareForTesseract: vi.fn(async (b: Blob) => b),
}));
vi.mock("./tesseract", () => ({
  recognizeLocal: tess.recognizeLocal,
  TesseractLoadError: class TesseractLoadError extends Error {},
}));

import { OcrError, recognizePage } from "./engine";

const file = new Blob(["x"]);

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

describe("recognizePage", () => {
  it("uses AI when reachable and text is returned", async () => {
    api.isReachable.mockResolvedValue(true);
    api.ocrRemote.mockResolvedValue({ ok: true, data: { text: "Hello\nworld" } });
    expect(await recognizePage(file)).toEqual({ text: "Hello world", source: "ai" });
    expect(tess.recognizeLocal).not.toHaveBeenCalled();
  });
  it("falls back to offline when AI returns empty", async () => {
    api.isReachable.mockResolvedValue(true);
    api.ocrRemote.mockResolvedValue({ ok: true, data: { text: "  " } });
    tess.recognizeLocal.mockResolvedValue("Local text");
    expect(await recognizePage(file)).toEqual({ text: "Local text", source: "offline" });
  });
  it("falls back when rate limited", async () => {
    api.isReachable.mockResolvedValue(true);
    api.ocrRemote.mockResolvedValue({ ok: false, reason: "rate_limited" });
    tess.recognizeLocal.mockResolvedValue("Local");
    expect((await recognizePage(file)).source).toBe("offline");
  });
  it("goes straight to tesseract when offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    tess.recognizeLocal.mockResolvedValue("Offline text");
    expect(await recognizePage(file)).toEqual({ text: "Offline text", source: "offline" });
    expect(api.isReachable).not.toHaveBeenCalled();
  });
  it("throws no_text when offline OCR finds nothing", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    tess.recognizeLocal.mockResolvedValue(" | ");
    await expect(recognizePage(file)).rejects.toMatchObject({ code: "no_text" });
  });
  it("rejects aborted and never resolves a stale scan", async () => {
    api.isReachable.mockResolvedValue(true);
    const ctrl = new AbortController();
    api.ocrRemote.mockImplementation(async () => {
      ctrl.abort();
      return { ok: true, data: { text: "late" } };
    });
    const p = recognizePage(file, { signal: ctrl.signal });
    await expect(p).rejects.toBeInstanceOf(OcrError);
    await expect(p).rejects.toMatchObject({ code: "aborted" });
  });
  it("reports monotonic progress", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    tess.recognizeLocal.mockImplementation(async (_i: Blob, o: { onProgress: (p: number) => void }) => {
      o.onProgress(0.5);
      o.onProgress(0.2);
      return "ok";
    });
    const seen: number[] = [];
    await recognizePage(file, { onProgress: (p) => seen.push(p) });
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });
});
