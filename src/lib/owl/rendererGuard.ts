import { markOwl3dFailed } from "./capability";
import { createFrameGuard } from "./frameGuard";

export type OwlFailReason = "context-lost" | "slow";

export interface RendererGuardOptions {
  /** Must tear the renderer down and show the SVG. Called at most once. */
  onFail: (reason: OwlFailReason, avgMs?: number) => void;
  sampleFrames?: number;
  maxAvgMs?: number;
}

/**
 * Watches a live WebGL canvas: a lost context, or a slow first stretch of frames, flags the failure for the whole
 * session (sessionStorage) and asks the owner to fall back to the SVG owl.
 */
export function attachRendererGuard(canvas: EventTarget, opts: RendererGuardOptions) {
  let failed = false;
  const fail = (reason: OwlFailReason, avgMs?: number) => {
    if (failed) return;
    failed = true;
    markOwl3dFailed();
    opts.onFail(reason, avgMs);
  };
  const onLost = (e: Event) => {
    e.preventDefault?.();
    fail("context-lost");
  };
  canvas.addEventListener("webglcontextlost", onLost);
  const frames = createFrameGuard({
    sampleFrames: opts.sampleFrames,
    maxAvgMs: opts.maxAvgMs,
    onSlow: (avg) => fail("slow", avg),
  });
  return {
    recordFrame: frames.record,
    get failed() {
      return failed;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
    },
  };
}
