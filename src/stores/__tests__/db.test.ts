import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb, putCached, getCached, touch, evictOverflow, saveWord, listWords, enqueue, dequeueBatch } from "../db";
import type { ResolvedExplanation } from "@/shared/schemas";

const mk = (word: string, language: "hiligaynon" | "tagalog" = "hiligaynon"): ResolvedExplanation => ({
  word, phonetic: "/x/", english: "e", translation: "t", emoji: "📖", difficulty: "easy", example: null, source: "ai", language,
});

beforeEach(async () => {
  const db = getDb()!;
  await Promise.all([db.wordCache.clear(), db.words.clear(), db.lookupQueue.clear()]);
});

describe("wordCache LRU", () => {
  it("evicts least recently used beyond max", async () => {
    const db = getDb()!;
    await putCached(mk("a"));
    await new Promise((r) => setTimeout(r, 3));
    await putCached(mk("b"));
    await new Promise((r) => setTimeout(r, 3));
    await putCached(mk("c"));
    await new Promise((r) => setTimeout(r, 3));
    await touch("a_hiligaynon"); // a is now the most recent
    const removed = await evictOverflow(2);
    expect(removed).toBe(1);
    expect(await db.wordCache.count()).toBe(2);
    expect(await getCached("b", "hiligaynon")).toBeUndefined();
    expect(await getCached("a", "hiligaynon")).toBeDefined();
  });
  it("keys by lowercase word and language", async () => {
    await putCached(mk("Brave"));
    expect(await getCached("brave", "hiligaynon")).toBeDefined();
    expect(await getCached("brave", "tagalog")).toBeUndefined();
  });
});

describe("words and queue", () => {
  it("dedupes saved words and queue items", async () => {
    await saveWord(mk("Fox"));
    await saveWord(mk("fox"));
    expect((await listWords()).length).toBe(1);
    await enqueue({ word: "fox", sentence: "s", language: "hiligaynon" });
    await enqueue({ word: "fox", sentence: "s", language: "hiligaynon" });
    expect((await dequeueBatch(10)).length).toBe(1);
  });
});
