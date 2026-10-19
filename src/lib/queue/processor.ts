import { explainRemote } from "@/lib/api";
import {
  bumpAttempts,
  dequeueBatch,
  putCached,
  removeFromQueue,
  updateSavedWord,
  type QueueItem,
} from "@/stores/db";
import type { ResolvedExplanation } from "@/shared/schemas";

export const MAX_ATTEMPTS = 5;
export const CONCURRENCY = 2;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 60_000;

export interface QueueOptions {
  onUpgraded: (count: number) => void;
}

export function backoffDelay(attempts: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1));
}

async function processItem(item: QueueItem, signal: AbortSignal): Promise<"upgraded" | "retry" | "dropped"> {
  const res = await explainRemote(
    { word: item.word, sentence: item.sentence, language: item.language },
    { signal },
  );
  if (res.ok) {
    const resolved: ResolvedExplanation = { ...res.data, word: item.word, source: "ai", language: item.language };
    await putCached(resolved);
    await updateSavedWord(resolved);
    await removeFromQueue(item.key);
    return "upgraded";
  }
  const attempts = await bumpAttempts(item.key);
  if (attempts >= MAX_ATTEMPTS) {
    await removeFromQueue(item.key);
    return "dropped";
  }
  return "retry";
}

/**
 * Drains db.lookupQueue whenever the app is online and visible. Returns a stop function.
 * `onUpgraded` receives the number of words upgraded in each drain (only called when > 0).
 */
export function startLookupQueue(opts: QueueOptions): () => void {
  let stopped = false;
  let draining = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  const ctrl = new AbortController();

  const canRun = () =>
    !stopped &&
    (typeof navigator === "undefined" || navigator.onLine !== false) &&
    (typeof document === "undefined" || document.visibilityState !== "hidden");

  async function drain(): Promise<void> {
    if (draining || !canRun()) return;
    draining = true;
    let upgraded = 0;
    let needRetry = 0;
    try {
      const seen = new Set<string>();
      for (;;) {
        if (!canRun()) break;
        const batch = (await dequeueBatch(CONCURRENCY * 4)).filter((i) => !seen.has(i.key));
        if (batch.length === 0) break;
        const queue = [...batch];
        const worker = async () => {
          for (let item = queue.shift(); item && canRun(); item = queue.shift()) {
            seen.add(item.key);
            try {
              const r = await processItem(item, ctrl.signal);
              if (r === "upgraded") upgraded++;
              else if (r === "retry") needRetry = Math.max(needRetry, item.attempts + 1);
            } catch {
              // transient failure; leave in queue for the next drain
              needRetry = Math.max(needRetry, item.attempts + 1);
            }
          }
        };
        await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      }
    } finally {
      draining = false;
    }
    if (upgraded > 0 && !stopped) opts.onUpgraded(upgraded);
    if (needRetry > 0 && !stopped) {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => void drain(), backoffDelay(needRetry));
    }
  }

  const onOnline = () => void drain();
  const onVisibility = () => {
    if (document.visibilityState === "visible") void drain();
  };
  if (typeof window !== "undefined") window.addEventListener("online", onOnline);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  void drain();

  return () => {
    stopped = true;
    ctrl.abort();
    if (retryTimer) clearTimeout(retryTimer);
    if (typeof window !== "undefined") window.removeEventListener("online", onOnline);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
  };
}
