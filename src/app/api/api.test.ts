// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { POST as explain, OPTIONS } from "./explain/route";
import { POST as ocr } from "./ocr/route";
import { GET as health } from "./health/route";
import { setLimiter } from "@/server/ratelimit";

const good = {
  word: "carabao",
  phonetic: "/kah-rah-BAH-oh/",
  english: "A big farm animal.",
  translation: "Kabaw nga nagabulig sa uma.",
  emoji: "🐃",
  difficulty: "easy",
  example: "The carabao eats grass.",
};

function req(body: unknown, headers: Record<string, string> = {}, url = "http://app.test/api/explain") {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", host: "app.test", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const valid = { word: "carabao", sentence: "The carabao is big.", language: "tagalog" };

beforeEach(() => {
  generateContent.mockReset();
  process.env.GEMINI_API_KEY = "test";
  delete process.env.ALLOWED_ORIGINS;
  setLimiter({ check: async () => ({ ok: true }) });
});

describe("POST /api/explain", () => {
  it("returns validated JSON", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(good) });
    const res = await explain(req(valid));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual(good);
    const call = generateContent.mock.calls[0][0];
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseJsonSchema).toBeTruthy();
  });

  it("repairs once then 502s on invalid model JSON", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    const res = await explain(req(valid));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "upstream" });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("recovers when the repair attempt is valid", async () => {
    generateContent.mockResolvedValueOnce({ text: "{}" }).mockResolvedValueOnce({ text: JSON.stringify(good) });
    expect((await explain(req(valid))).status).toBe(200);
  });

  it("rejects a mismatched word", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ ...good, word: "other" }) });
    expect((await explain(req(valid))).status).toBe(502);
  });

  it("maps timeouts to 504", async () => {
    generateContent.mockRejectedValue(Object.assign(new Error("x"), { name: "TimeoutError" }));
    const res = await explain(req(valid));
    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "timeout" });
  });

  it("400 on bad input and bad JSON", async () => {
    expect((await explain(req({ word: "no spaces!", language: "tagalog" }))).status).toBe(400);
    expect((await explain(req("{nope"))).status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("413 when oversized", async () => {
    const res = await explain(req({ ...valid, sentence: "a".repeat(9000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "invalid" });
    const res2 = await explain(req(valid, { "content-length": "99999" }));
    expect(res2.status).toBe(413);
  });

  it("403 for a disallowed origin, with no CORS headers", async () => {
    const res = await explain(req(valid, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows capacitor://localhost and ALLOWED_ORIGINS and same origin", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(good) });
    const cap = await explain(req(valid, { origin: "capacitor://localhost" }));
    expect(cap.status).toBe(200);
    expect(cap.headers.get("access-control-allow-origin")).toBe("capacitor://localhost");
    process.env.ALLOWED_ORIGINS = "https://a.example, https://b.example";
    expect((await explain(req(valid, { origin: "https://b.example" }))).status).toBe(200);
    expect((await explain(req(valid, { origin: "http://app.test" }))).status).toBe(200);
  });

  it("handles OPTIONS preflight", () => {
    const ok = OPTIONS(new Request("http://app.test/api/explain", { method: "OPTIONS", headers: { origin: "https://localhost" } }));
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://localhost");
    const bad = OPTIONS(new Request("http://app.test/api/explain", { method: "OPTIONS", headers: { origin: "https://x.example" } }));
    expect(bad.status).toBe(403);
  });

  it("429 with Retry-After when rate limited", async () => {
    setLimiter({ check: async () => ({ ok: false, status: 429, retryAfter: 17 }) });
    const res = await explain(req(valid));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("17");
    expect(await res.json()).toEqual({ error: "rate_limited", retryAfter: 17 });
  });

  it("503 upstream when the limiter fails closed", async () => {
    setLimiter({ check: async () => ({ ok: false, status: 503 }) });
    expect((await explain(req(valid))).status).toBe(503);
  });
});

describe("POST /api/ocr", () => {
  it("returns trimmed text", async () => {
    generateContent.mockResolvedValue({ text: "  Hello world\n" });
    const res = await ocr(req({ imageBase64: "AAAA", mime: "image/png" }, {}, "http://app.test/api/ocr"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: "Hello world" });
  });
  it("400 on unsupported mime", async () => {
    const res = await ocr(req({ imageBase64: "AAAA", mime: "image/gif" }, {}, "http://app.test/api/ocr"));
    expect(res.status).toBe(400);
  });
  it("uses the ocr limiter", async () => {
    const check = vi.fn(async () => ({ ok: true }) as const);
    setLimiter({ check });
    generateContent.mockResolvedValue({ text: "x" });
    await ocr(req({ imageBase64: "AAAA", mime: "image/png" }, { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, "http://app.test/api/ocr"));
    expect(check).toHaveBeenCalledWith("ocr", "1.2.3.4");
  });
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = health(new Request("http://app.test/api/health"));
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("explain request hardening", () => {
  it("accepts a word written with combining marks and rejects one over 64 characters", async () => {
    const { ExplainRequestSchema } = await import("@/shared/schemas");
    expect(ExplainRequestSchema.safeParse({ word: "ni\u006e\u0303o", sentence: "", language: "tagalog" }).success).toBe(true);
    expect(ExplainRequestSchema.safeParse({ word: "a".repeat(65), sentence: "", language: "tagalog" }).success).toBe(false);
    expect(ExplainRequestSchema.safeParse({ word: "fox", sentence: "x".repeat(601), language: "tagalog" }).success).toBe(false);
  });
});
