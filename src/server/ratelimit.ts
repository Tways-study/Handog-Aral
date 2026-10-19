import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitKind = "explain" | "ocr";

export type LimitResult =
  | { ok: true }
  | { ok: false; status: 429; retryAfter: number }
  | { ok: false; status: 503 };

export interface Limiter {
  check(kind: LimitKind, key: string): Promise<LimitResult>;
}

const LIMITS: Record<LimitKind, number> = { explain: 30, ocr: 6 };

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip")?.trim() || "unknown";
}

let warned = false;
let upstash: Record<LimitKind, Ratelimit> | null = null;

function build(): Record<LimitKind, Ratelimit> {
  const redis = Redis.fromEnv();
  const make = (kind: LimitKind) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMITS[kind], "1 m"),
      prefix: `handog:${kind}`,
    });
  return { explain: make("explain"), ocr: make("ocr") };
}

export const defaultLimiter: Limiter = {
  async check(kind, key) {
    const configured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!configured) {
      if (process.env.NODE_ENV === "production") return { ok: false, status: 503 };
      if (!warned) {
        warned = true;
        console.warn("[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set; rate limiting disabled in development.");
      }
      return { ok: true };
    }
    try {
      upstash ??= build();
      const res = await upstash[kind].limit(key);
      if (res.success) return { ok: true };
      return { ok: false, status: 429, retryAfter: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)) };
    } catch {
      return { ok: false, status: 503 };
    }
  },
};

let active: Limiter = defaultLimiter;

/** Test hook: swap the limiter. Pass null to restore the default. */
export function setLimiter(l: Limiter | null): void {
  active = l ?? defaultLimiter;
}

export function getLimiter(): Limiter {
  return active;
}
