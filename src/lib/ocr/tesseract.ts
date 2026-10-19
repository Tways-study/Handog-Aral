// Offline OCR via a self-hosted, lazily created Tesseract worker. Browser-only.
import type { Worker as TessWorker } from "tesseract.js";

export const TESSERACT_BASE = "/tesseract";
export const TESSERACT_CACHE = "tesseract-assets";
const WORKER_PATH = `${TESSERACT_BASE}/worker.min.js`;
const IDLE_MS = 60_000;

export class TesseractLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TesseractLoadError";
  }
}

export interface RecognizeOptions {
  signal?: AbortSignal;
  /** 0..1, monotonic. */
  onProgress?: (p: number) => void;
}

let workerPromise: Promise<TessWorker> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let activeLogger: ((status: string, progress: number) => void) | null = null;
let busy = 0;

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function clearIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
}

function scheduleIdle() {
  clearIdle();
  idleTimer = setTimeout(() => void terminateWorker(), IDLE_MS);
}

export async function terminateWorker(): Promise<void> {
  clearIdle();
  const p = workerPromise;
  workerPromise = null;
  if (!p) return;
  try {
    const w = await p;
    await w.terminate();
  } catch {
    /* worker never started */
  }
}

function getWorker(): Promise<TessWorker> {
  if (workerPromise) return workerPromise;
  const p = (async () => {
    const { createWorker } = await import("tesseract.js");
    try {
      return await createWorker("eng", 1, {
        workerPath: WORKER_PATH,
        corePath: TESSERACT_BASE,
        langPath: `${TESSERACT_BASE}/lang`,
        cacheMethod: "none",
        logger: (m: { status: string; progress: number }) => activeLogger?.(m.status, m.progress),
      });
    } catch (err) {
      throw new TesseractLoadError("Could not load the offline OCR engine", { cause: err });
    }
  })();
  workerPromise = p;
  p.catch(() => {
    if (workerPromise === p) workerPromise = null;
  });
  return p;
}

/** Recognize text in an image with the local Tesseract worker. */
export async function recognizeLocal(image: Blob, opts: RecognizeOptions = {}): Promise<string> {
  const { signal, onProgress } = opts;
  if (signal?.aborted) throw abortError();

  let last = 0;
  const report = (p: number) => {
    last = Math.max(last, Math.min(1, p));
    onProgress?.(last);
  };
  clearIdle();
  busy++;
  activeLogger = (status, progress) => {
    if (status === "recognizing text") report(0.15 + 0.85 * progress);
    else report(0.15 * progress * 0.999);
  };
  report(0);

  let aborted = false;
  const onAbort = () => {
    aborted = true;
    void terminateWorker(); // recognition cannot be cancelled any other way
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const worker = await getWorker();
    if (aborted || signal?.aborted) throw abortError();
    report(0.15);
    const result = await Promise.race([
      worker.recognize(image),
      new Promise<never>((_, reject) => {
        if (signal?.aborted) return reject(abortError());
        signal?.addEventListener("abort", () => reject(abortError()), { once: true });
      }),
    ]);
    if (aborted || signal?.aborted) throw abortError();
    report(1);
    return result.data.text;
  } catch (err) {
    if (aborted || signal?.aborted) throw abortError();
    throw err;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    busy--;
    if (busy === 0) {
      activeLogger = null;
      if (workerPromise) scheduleIdle();
    }
  }
}

interface Manifest {
  files: { path: string; size: number }[];
  total: number;
}

async function loadManifest(): Promise<Manifest> {
  const res = await fetch(`${TESSERACT_BASE}/manifest.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
  return (await res.json()) as Manifest;
}

/** Downloads every Tesseract asset into Cache Storage ('tesseract-assets'). Resumable: cached files are skipped. */
export async function warmOfflinePack(onProgress?: (p: number) => void): Promise<{ bytes: number }> {
  const manifest = await loadManifest();
  const cache = await caches.open(TESSERACT_CACHE);
  let done = 0;
  const report = () => onProgress?.(manifest.total ? Math.min(1, done / manifest.total) : 1);
  report();
  for (const f of manifest.files) {
    const url = `${TESSERACT_BASE}/${f.path}`;
    if (await cache.match(url)) {
      done += f.size;
      report();
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    await cache.put(url, res);
    done += f.size;
    report();
  }
  return { bytes: done };
}

export async function offlinePackStatus(): Promise<{ cached: boolean; bytes: number; total: number }> {
  try {
    if (typeof caches === "undefined") return { cached: false, bytes: 0, total: 0 };
    const manifest = await loadManifest();
    const cache = await caches.open(TESSERACT_CACHE);
    let bytes = 0;
    for (const f of manifest.files) {
      if (await cache.match(`${TESSERACT_BASE}/${f.path}`)) bytes += f.size;
    }
    return { cached: bytes >= manifest.total && manifest.total > 0, bytes, total: manifest.total };
  } catch {
    return { cached: false, bytes: 0, total: 0 };
  }
}
