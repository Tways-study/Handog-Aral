// Client for the /api proxy.
import {
  ApiErrorBodySchema,
  OcrResponseSchema,
  WordExplanationSchema,
  type ExplainRequest,
  type OcrResponse,
  type WordExplanation,
} from "@/shared/schemas";
import type { z } from "zod";

export type ApiFailure = "offline" | "rate_limited" | "error";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: ApiFailure; retryAfter?: number };

export interface RequestOptions {
  signal?: AbortSignal;
  /** Milliseconds before the request is aborted. */
  timeoutMs?: number;
}

/** Base URL for the proxy: empty on the web build (same origin), the deployed URL in the Capacitor build. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const EXPLAIN_TIMEOUT_MS = 12_000;
const OCR_TIMEOUT_MS = 25_000;
const HEALTH_TIMEOUT_MS = 4_000;

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });
}

type Attempt<T> = { kind: "done"; result: ApiResult<T> } | { kind: "retry" };

async function attempt<T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
  opts: RequestOptions,
  timeoutMs: number,
): Promise<Attempt<T>> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (opts.signal?.aborted) controller.abort();
  else opts.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
    if (res.status === 429) {
      let retryAfter: number | undefined;
      try {
        const parsed = ApiErrorBodySchema.safeParse(await res.json());
        if (parsed.success) retryAfter = parsed.data.retryAfter;
      } catch {
        /* ignore */
      }
      if (retryAfter === undefined) {
        const h = Number(res.headers.get("Retry-After"));
        if (Number.isFinite(h) && h > 0) retryAfter = h;
      }
      return { kind: "done", result: { ok: false, reason: "rate_limited", ...(retryAfter !== undefined && { retryAfter }) } };
    }
    if (res.status >= 500) return { kind: "retry" };
    if (!res.ok) return { kind: "done", result: { ok: false, reason: "error" } };
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { kind: "done", result: { ok: false, reason: "error" } };
    }
    const parsed = schema.safeParse(body);
    return {
      kind: "done",
      result: parsed.success ? { ok: true, data: parsed.data } : { ok: false, reason: "error" },
    };
  } catch (err) {
    if (opts.signal?.aborted) return { kind: "done", result: { ok: false, reason: "error" } };
    if (controller.signal.aborted) return { kind: "retry" }; // our timeout
    if (err instanceof TypeError) return { kind: "done", result: { ok: false, reason: "offline" } };
    return { kind: "done", result: { ok: false, reason: "error" } };
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
  opts: RequestOptions,
  defaultTimeout: number,
): Promise<ApiResult<T>> {
  if (isOffline()) return { ok: false, reason: "offline" };
  const timeoutMs = opts.timeoutMs ?? defaultTimeout;
  let a = await attempt(path, init, schema, opts, timeoutMs);
  if (a.kind === "retry") {
    if (opts.signal?.aborted) return { ok: false, reason: "error" };
    await sleep(300 + Math.random() * 500, opts.signal);
    if (opts.signal?.aborted) return { ok: false, reason: "error" };
    a = await attempt(path, init, schema, opts, timeoutMs);
  }
  return a.kind === "done" ? a.result : { ok: false, reason: "error" };
}

function postJson(body: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function explainRemote(
  req: ExplainRequest,
  opts: RequestOptions = {},
): Promise<ApiResult<WordExplanation>> {
  return request("/api/explain", postJson(req), WordExplanationSchema, opts, EXPLAIN_TIMEOUT_MS);
}

const SUPPORTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type SupportedMime = (typeof SUPPORTED_MIME)[number];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const url = String(reader.result);
      const i = url.indexOf(",");
      resolve(i >= 0 ? url.slice(i + 1) : "");
    };
    reader.readAsDataURL(blob);
  });
}

async function looksLikeImage(blob: Blob): Promise<boolean> {
  try {
    if (typeof createImageBitmap === "function") {
      (await createImageBitmap(blob)).close();
      return true;
    }
  } catch {
    return false;
  }
  return blob.type.startsWith("image/");
}

async function resolveMime(blob: Blob): Promise<SupportedMime | null> {
  if (!blob.type) return "image/jpeg";
  if ((SUPPORTED_MIME as readonly string[]).includes(blob.type)) return blob.type as SupportedMime;
  return (await looksLikeImage(blob)) ? "image/jpeg" : null;
}

export async function ocrRemote(image: Blob, opts: RequestOptions = {}): Promise<ApiResult<OcrResponse>> {
  if (isOffline()) return { ok: false, reason: "offline" };
  const mime = await resolveMime(image);
  if (!mime) return { ok: false, reason: "error" };
  let imageBase64: string;
  try {
    imageBase64 = await blobToBase64(image);
  } catch {
    return { ok: false, reason: "error" };
  }
  return request("/api/ocr", postJson({ imageBase64, mime }), OcrResponseSchema, opts, OCR_TIMEOUT_MS);
}

/** True when the proxy is actually reachable (navigator.onLine alone is not trusted). */
export async function isReachable(opts: RequestOptions = {}): Promise<boolean> {
  if (isOffline()) return false;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (opts.signal?.aborted) return false;
  opts.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: "GET", cache: "no-store", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}
