// Client for the /api proxy. CONTRACT STUB written before Phase 2:
// the signatures below are the agreed interface. Phase 2B replaces the bodies.
import type { ExplainRequest, OcrResponse, WordExplanation } from "@/shared/schemas";

export type ApiFailure = "offline" | "rate_limited" | "error";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: ApiFailure; retryAfter?: number };

export interface RequestOptions {
  signal?: AbortSignal;
  /** Milliseconds before the request is aborted. */
  timeoutMs?: number;
}

/** Base URL for the proxy: empty on the web build (same origin), the deployed URL in the Capacitor build. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function explainRemote(
  _req: ExplainRequest,
  _opts: RequestOptions = {},
): Promise<ApiResult<WordExplanation>> {
  return { ok: false, reason: "error" };
}

export async function ocrRemote(_image: Blob, _opts: RequestOptions = {}): Promise<ApiResult<OcrResponse>> {
  return { ok: false, reason: "error" };
}

/** True when the proxy is actually reachable (navigator.onLine alone is not trusted). */
export async function isReachable(_opts: RequestOptions = {}): Promise<boolean> {
  return false;
}
