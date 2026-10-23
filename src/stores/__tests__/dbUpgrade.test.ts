import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { closeDb, getDb } from "../db";

describe("db v2 upgrade (Hiligaynon retired)", () => {
  it("drops Hiligaynon cache and queue rows and turns saved words into Filipino ones the queue upgrades", async () => {
    await closeDb();
    await Dexie.delete("handog-aral");

    const old = new Dexie("handog-aral");
    old.version(1).stores({
      wordCache: "key, lastUsedAt, updatedAt",
      dictionary: "word",
      meta: "key",
      lookupQueue: "key, enqueuedAt",
      words: "key, savedAt, bookId",
    });
    const row = (word: string, language: string) => ({ word, phonetic: "", english: "e", translation: "Hiligaynon text", emoji: "", difficulty: "easy", example: null, source: "ai", language });
    await old.table("wordCache").bulkPut([
      { ...row("fox", "hiligaynon"), key: "fox_hiligaynon", updatedAt: 1, lastUsedAt: 1 },
      { ...row("owl", "tagalog"), key: "owl_tagalog", updatedAt: 1, lastUsedAt: 1 },
    ]);
    await old.table("lookupQueue").put({ key: "fox_hiligaynon", word: "fox", sentence: "", language: "hiligaynon", enqueuedAt: 1, attempts: 0 });
    await old.table("dictionary").put({ word: "brave", tagalog: "Matapang!" });
    await old.table("words").bulkPut([
      { ...row("brave", "hiligaynon"), key: "brave", bookId: "fox", savedAt: 1 },
      { ...row("lost", "hiligaynon"), key: "lost", bookId: null, savedAt: 2 },
      { ...row("moon", "tagalog"), key: "moon", bookId: null, savedAt: 3 },
    ]);
    old.close();

    const db = getDb()!;
    expect((await db.wordCache.toArray()).map((r) => r.key)).toEqual(["owl_tagalog"]);

    const words = Object.fromEntries((await db.words.toArray()).map((w) => [w.key, w]));
    expect(words.brave).toMatchObject({ language: "tagalog", translation: "Matapang!", source: "curated", bookId: "fox" });
    expect(words.lost).toMatchObject({ language: "tagalog", source: "offline" });
    expect(words.moon.translation).toBe("Hiligaynon text"); // already Filipino: untouched

    expect((await db.lookupQueue.toArray()).map((q) => q.key)).toEqual(["lost_tagalog"]);
    expect(await db.filipino.count()).toBe(0);
  });
});
