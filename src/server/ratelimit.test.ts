// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultLimiter } from "./ratelimit";

afterEach(() => vi.unstubAllEnvs());

describe("defaultLimiter without Upstash env", () => {
  it("allows in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(await defaultLimiter.check("explain", "1.1.1.1")).toEqual({ ok: true });
  });
  it("fails closed in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(await defaultLimiter.check("explain", "1.1.1.1")).toEqual({ ok: false, status: 503 });
  });
});
