/**
 * WHEN the 3D owl may start loading. three.js (a 139 KB gzipped chunk) plus WebGL context creation is the single
 * most expensive thing the app does, and on a low-end phone it must never compete with first paint or the first
 * taps. The SVG owl is the experience until this gate opens:
 *
 *   window `load`  ->  requestIdleCallback  ->  SETTLE_MS of calm  ->  was the main thread busy?
 *
 * "Busy" is measured with `longtask` entries in the last BUSY_WINDOW_MS. More than BUSY_LIMIT_MS of long tasks in
 * that window postpones once (POSTPONE_MS); still busy afterwards means the owl stays SVG for the session.
 * The gate resolves once per page load and every owl shares the answer.
 */

export const LOAD_SETTLE_MS = 2500;
export const IDLE_TIMEOUT_MS = 3000;
export const BUSY_WINDOW_MS = 2000;
export const BUSY_LIMIT_MS = 300;
export const POSTPONE_MS = 2000;

export interface GateEnv {
  now: () => number;
  /** Total milliseconds of long tasks that started at or after `sinceMs` (performance.now() time base). */
  busyMsSince: (sinceMs: number) => number;
  whenLoaded: () => Promise<void>;
  whenIdle: (timeout: number) => Promise<void>;
  wait: (ms: number) => Promise<void>;
}

/** Pure decision loop, injectable for unit tests. Resolves true when it is safe to load three.js. */
export async function runGate(env: GateEnv): Promise<boolean> {
  await env.whenLoaded();
  await env.whenIdle(IDLE_TIMEOUT_MS);
  await env.wait(LOAD_SETTLE_MS);
  if (env.busyMsSince(env.now() - BUSY_WINDOW_MS) <= BUSY_LIMIT_MS) return true;
  await env.wait(POSTPONE_MS);
  return env.busyMsSince(env.now() - BUSY_WINDOW_MS) <= BUSY_LIMIT_MS;
}

let gate: Promise<boolean> | null = null;
let longTasks: { start: number; duration: number }[] = [];
let observer: PerformanceObserver | null = null;

function observeLongTasks(): void {
  if (observer || typeof PerformanceObserver === "undefined") return;
  try {
    observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) longTasks.push({ start: e.startTime, duration: e.duration });
      if (longTasks.length > 200) longTasks = longTasks.slice(-100);
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    observer = null; // longtask unsupported: the timing gate alone applies
  }
}

const browserEnv: GateEnv = {
  now: () => performance.now(),
  busyMsSince: (since) => longTasks.reduce((sum, t) => (t.start + t.duration >= since ? sum + t.duration : sum), 0),
  whenLoaded: () =>
    new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    }),
  whenIdle: (timeout) =>
    new Promise((resolve) => {
      if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve(), { timeout });
      else setTimeout(resolve, 200);
    }),
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** Shared, memoised for the page load. Never rejects. */
export function owl3dLoadGate(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!gate) {
    observeLongTasks();
    gate = runGate(browserEnv).catch(() => false);
  }
  return gate;
}

/** Test helper. */
export function resetOwlLoadGate(): void {
  gate = null;
  longTasks = [];
  observer?.disconnect();
  observer = null;
}
