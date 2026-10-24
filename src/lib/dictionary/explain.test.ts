import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  explainRemote: vi.fn(),
  isReachable: vi.fn(async () => true),
}));

import { explainRemote } from "@/lib/api";
import { explain, isLookupable, normalizeWord, OFFLINE_TEXT } from "./explain";
import { ensureDictionary } from "./seed";
import { getDb, getCached, dequeueBatch, saveWord, putCached } from "@/stores/db";
import { startLookupQueue } from "@/lib/queue/processor";

const remote = vi.mocked(explainRemote);
const ai = { word: "zebra", phonetic: "/z/", english: "A striped animal.", translation: "Sebra", emoji: "🦓", difficulty: "easy" as const, example: null };

function mockFetch(impl: () => Promise<Response> | Response) {
  const f = vi.fn(async () => impl());
  vi.stubGlobal("fetch", f);
  return f;
}
const dictResponse = () =>
  new Response(JSON.stringify([{ phonetics: [{ text: "/zeb/" }], meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "a striped animal", example: "see the zebra" }] }] }]), { status: 200 });

beforeEach(async () => {
  const db = getDb()!;
  await Promise.all([db.wordCache.clear(), db.words.clear(), db.lookupQueue.clear(), db.dictionary.clear(), db.filipino.clear(), db.meta.clear()]);
  remote.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("normalizeWord", () => {
  it("lowercases, strips punctuation, keeps apostrophes and accents", () => {
    expect(normalizeWord("“Don’t,”")).toBe("don't");
    expect(normalizeWord("Café.")).toBe("café");
  });
});

describe("explain pipeline", () => {
  it("serves curated entries without calling the network", async () => {
    await ensureDictionary();
    const f = mockFetch(() => new Response("{}"));
    const r = await explain({ word: "Brave.", sentence: "", language: "tagalog" });
    expect(r.source).toBe("curated");
    expect(r.translation).toBe("Matapang, tulad ng sundalo!");
    expect(remote).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });

  it("uses AI, caches it, and then serves from cache", async () => {
    remote.mockResolvedValue({ ok: true, data: ai });
    const r = await explain({ word: "zebra", sentence: "A zebra.", language: "tagalog" });
    expect(r.source).toBe("ai");
    remote.mockClear();
    const again = await explain({ word: "ZEBRA", sentence: "", language: "tagalog" });
    expect(again.source).toBe("ai");
    expect(remote).not.toHaveBeenCalled();
  });

  it("falls back to dictionaryapi.dev when the proxy fails", async () => {
    remote.mockResolvedValue({ ok: false, reason: "offline" });
    mockFetch(dictResponse);
    const r = await explain({ word: "zebra", sentence: "", language: "tagalog" });
    expect(r.source).toBe("dictionary");
    expect(r.english).toBe("A striped animal");
    expect(r.translation).toContain("isang bagay o tao");
    expect((await getCached("zebra", "tagalog"))?.source).toBe("dictionary");
  });

  it("returns an offline placeholder and enqueues when everything fails", async () => {
    remote.mockResolvedValue({ ok: false, reason: "offline" });
    mockFetch(() => Promise.reject(new TypeError("offline")));
    const r = await explain({ word: "zebra", sentence: "A zebra.", language: "tagalog" });
    expect(r.source).toBe("offline");
    expect(r.translation).toBe(OFFLINE_TEXT.tagalog);
    expect((await dequeueBatch(5)).map((q) => q.key)).toEqual(["zebra_tagalog"]);
    // placeholder does not short-circuit a later lookup
    remote.mockResolvedValue({ ok: true, data: ai });
    expect((await explain({ word: "zebra", sentence: "", language: "tagalog" })).source).toBe("ai");
  });

  it("rejects with AbortError when aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(explain({ word: "zebra", sentence: "", language: "tagalog" }, { signal: ctrl.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(await dequeueBatch(5)).toHaveLength(0);
  });
});

describe("lookup queue", () => {
  it("upgrades cache and saved word, then reports the count", async () => {
    remote.mockResolvedValue({ ok: false, reason: "offline" });
    mockFetch(() => Promise.reject(new TypeError("offline")));
    const offline = await explain({ word: "zebra", sentence: "A zebra.", language: "tagalog" });
    await saveWord(offline, "fox");

    remote.mockResolvedValue({ ok: true, data: ai });
    const onUpgraded = vi.fn();
    const stop = startLookupQueue({ onUpgraded });
    await vi.waitFor(() => expect(onUpgraded).toHaveBeenCalledWith(1));
    stop();

    expect((await getCached("zebra", "tagalog"))?.source).toBe("ai");
    const saved = await getDb()!.words.get("zebra");
    expect(saved?.source).toBe("ai");
    expect(saved?.translation).toBe("Sebra");
    expect(saved?.bookId).toBe("fox");
    expect(await dequeueBatch(5)).toHaveLength(0);
  });

  it("keeps items queued and drops after max attempts", async () => {
    remote.mockResolvedValue({ ok: false, reason: "error" });
    await putCached({ ...ai, source: "offline", language: "tagalog" });
    const db = getDb()!;
    await db.lookupQueue.put({ key: "zebra_tagalog", word: "zebra", sentence: "", language: "tagalog", enqueuedAt: 1, attempts: 4 });
    const onUpgraded = vi.fn();
    const stop = startLookupQueue({ onUpgraded });
    await vi.waitFor(async () => expect(await db.lookupQueue.count()).toBe(0));
    stop();
    expect(onUpgraded).not.toHaveBeenCalled();
  });
});

describe("explain pipeline, English mode (Filipino words)", () => {
  it("serves a curated Filipino word with the English meaning and never touches the network", async () => {
    await ensureDictionary();
    const f = mockFetch(() => new Response("{}"));
    const r = await explain({ word: "Bata.", sentence: "", language: "english" });
    expect(r.source).toBe("curated");
    expect(r.language).toBe("english");
    expect(r.translation).toMatch(/child/i);
    expect(r.english).toBe("Taong maliit pa ang edad.");
    expect(remote).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });

  it("skips dictionaryapi.dev for Filipino words and falls back to a queued offline entry", async () => {
    remote.mockResolvedValue({ ok: false, reason: "offline" });
    const f = mockFetch(() => dictResponse());
    const r = await explain({ word: "kalabaw", sentence: "Ang kalabaw.", language: "english" });
    expect(f).not.toHaveBeenCalled();
    expect(r.source).toBe("offline");
    expect(r.translation).toBe(OFFLINE_TEXT.english);
    expect((await dequeueBatch(5)).map((q) => q.key)).toEqual(["kalabaw_english"]);
  });

  it("asks the proxy in the English direction", async () => {
    remote.mockResolvedValue({ ok: true, data: { ...ai, word: "kalabaw", translation: "Water buffalo" } });
    const r = await explain({ word: "kalabaw", sentence: "", language: "english" });
    expect(remote).toHaveBeenCalledWith(expect.objectContaining({ language: "english" }), expect.anything());
    expect(r.source).toBe("ai");
    expect((await getCached("kalabaw", "english"))?.source).toBe("ai");
  });
});

describe("explain hardening", () => {
  it("isLookupable matches what the proxy accepts", () => {
    expect(isLookupable("niño")).toBe(true);
    expect(isLookupable("ni\u006e\u0303o")).toBe(true);
    expect(isLookupable("nag-ani")).toBe(true);
    expect(isLookupable("don't")).toBe(true);
    expect(isLookupable("")).toBe(false);
    expect(isLookupable("a".repeat(65))).toBe(false);
    expect(isLookupable("3rd")).toBe(false);
  });

  it("a 90-letter run of OCR debris is neither sent, cached nor queued", async () => {
    const f = mockFetch(() => new Response("{}"));
    const r = await explain({ word: "x".repeat(90), sentence: "x".repeat(90), language: "tagalog" });
    expect(r.source).toBe("offline");
    expect(remote).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
    expect(await dequeueBatch(5)).toEqual([]);
  });

  it("never sends more than 600 characters of context", async () => {
    remote.mockResolvedValue({ ok: true, data: ai });
    await explain({ word: "zebra", sentence: "z ".repeat(900), language: "tagalog" });
    expect(remote.mock.calls[0][0].sentence.length).toBeLessThanOrEqual(600);
  });
});
