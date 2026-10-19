import type { ApiErrorCode } from "@/shared/schemas";
import { checkOrigin, corsHeaders } from "./cors";
import { clientIp, getLimiter, type LimitKind } from "./ratelimit";
import { UpstreamError } from "./gemini";

export function json(body: unknown, status: number, origin: string | null, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(origin), ...extra },
  });
}

export function errorResponse(
  status: number,
  error: ApiErrorCode,
  origin: string | null,
  retryAfter?: number,
): Response {
  return json(
    retryAfter === undefined ? { error } : { error, retryAfter },
    status,
    origin,
    retryAfter === undefined ? {} : { "Retry-After": String(retryAfter) },
  );
}

/** Shared pipeline: origin check, rate limit, size-capped JSON body, then the handler. */
export async function handlePost(
  req: Request,
  opts: { kind: LimitKind; maxBytes: number },
  run: (body: unknown, origin: string | null) => Promise<Response>,
): Promise<Response> {
  const c = checkOrigin(req);
  if (!c.allowed) return errorResponse(403, "forbidden", null);
  const origin = c.origin;

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > opts.maxBytes) return errorResponse(413, "invalid", origin);

  const limit = await getLimiter().check(opts.kind, clientIp(req));
  if (!limit.ok) {
    return limit.status === 429
      ? errorResponse(429, "rate_limited", origin, limit.retryAfter)
      : errorResponse(503, "upstream", origin);
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return errorResponse(400, "invalid", origin);
  }
  if (new TextEncoder().encode(text).length > opts.maxBytes) return errorResponse(413, "invalid", origin);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse(400, "invalid", origin);
  }

  try {
    return await run(body, origin);
  } catch (err) {
    if (err instanceof UpstreamError) {
      return err.code === "timeout" ? errorResponse(504, "timeout", origin) : errorResponse(502, "upstream", origin);
    }
    return errorResponse(502, "upstream", origin);
  }
}
