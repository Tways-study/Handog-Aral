// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { explainRemote, isReachable } from "./api";

const good = {
  word: "cat",
  phonetic: "/kat/",
  english: "A small pet.",
  translation: "Pusa.",
  emoji: "🐱",
  difficulty: "easy",
  example: null,
};
const req = { word: "cat", sentence: "", language: "tagalog" as const };
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { onLine: true });
});
afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("short-circuits when offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(await explainRemote(req)).toEqual({ ok: false, reason: "offline" });
    expect(await isReachable()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns validated data", async () => {
    fetchMock.mockResolvedValue(ok(good));
    expect(await explainRemote(req)).toEqual({ ok: true, data: good });
  });

  it("429 does not retry and carries retryAfter", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "rate_limited", retryAfter: 9 }), { status: 429 }));
    expect(await explainRemote(req)).toEqual({ ok: false, reason: "rate_limited", retryAfter: 9 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("5xx retries once then errors", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));
    expect(await explainRemote(req)).toEqual({ ok: false, reason: "error" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("5xx then success recovers", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 504 })).mockResolvedValueOnce(ok(good));
    expect((await explainRemote(req)).ok).toBe(true);
  });

  it("zod-invalid body is an error", async () => {
    fetchMock.mockResolvedValue(ok({ word: "cat" }));
    expect(await explainRemote(req)).toEqual({ ok: false, reason: "error" });
  });

  it("network TypeError is offline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await explainRemote(req)).toEqual({ ok: false, reason: "offline" });
  });

  it("caller abort propagates and does not retry", async () => {
    fetchMock.mockImplementation((_u: string, init: RequestInit) =>
      new Promise((_r, rej) => init.signal!.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")))),
    );
    const c = new AbortController();
    const p = explainRemote(req, { signal: c.signal });
    c.abort();
    expect(await p).toEqual({ ok: false, reason: "error" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("isReachable reflects /api/health", async () => {
    fetchMock.mockResolvedValue(ok({ ok: true }));
    expect(await isReachable()).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/health");
    fetchMock.mockRejectedValue(new TypeError("x"));
    expect(await isReachable()).toBe(false);
  });
});
