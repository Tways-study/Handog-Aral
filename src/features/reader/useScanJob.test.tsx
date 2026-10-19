import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

type Deferred = { resolve: (v: { text: string; source: "ai" | "offline" }) => void; reject: (e: unknown) => void; signal?: AbortSignal; onProgress?: (p: number) => void };
const calls: Deferred[] = [];

vi.mock("@/lib/ocr/engine", () => {
  class OcrError extends Error {
    constructor(public code: string) {
      super(code);
    }
  }
  return {
    OcrError,
    recognizePage: (_f: Blob, opts: { signal?: AbortSignal; onProgress?: (p: number) => void }) =>
      new Promise((resolve, reject) => calls.push({ resolve, reject, signal: opts.signal, onProgress: opts.onProgress })),
  };
});

import { OcrError } from "@/lib/ocr/engine";
import { useScanJob } from "./useScanJob";

afterEach(() => {
  cleanup();
  calls.length = 0;
});

const file = new Blob(["x"]);

describe("useScanJob", () => {
  it("a stale scan never overwrites a newer one", async () => {
    const { result } = renderHook(() => useScanJob());
    act(() => void result.current.start(file));
    act(() => void result.current.start(file));
    expect(calls[0].signal?.aborted).toBe(true);
    await act(async () => calls[1].resolve({ text: "new page", source: "ai" }));
    await act(async () => calls[0].resolve({ text: "old page", source: "offline" }));
    expect(result.current.state.text).toBe("new page");
    expect(result.current.state.source).toBe("ai");
  });

  it("progress is monotonic and ignores stale scans", async () => {
    const { result } = renderHook(() => useScanJob());
    act(() => void result.current.start(file));
    act(() => calls[0].onProgress?.(0.5));
    act(() => calls[0].onProgress?.(0.3));
    expect(result.current.state.progress).toBe(50);
  });

  it("exposes OcrError codes and goes idle on cancel", async () => {
    const { result } = renderHook(() => useScanJob());
    act(() => void result.current.start(file));
    await act(async () => calls[0].reject(new OcrError("no_text")));
    expect(result.current.state).toMatchObject({ status: "error", error: "no_text" });
    act(() => void result.current.start(file));
    act(() => result.current.cancel());
    expect(result.current.state.status).toBe("idle");
    await act(async () => calls[1].resolve({ text: "late", source: "ai" }));
    expect(result.current.state.text).toBe("");
  });
});
