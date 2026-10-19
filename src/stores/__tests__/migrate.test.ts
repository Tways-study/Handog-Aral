import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db";
import { LEGACY_STORAGE_KEY, runMigrations } from "../migrate";
import { useProgress } from "../progress";
import { useSettings } from "../settings";

const PLACEHOLDER = "Tan-awa sa diksyunaryo ang buot silingon sini.";
const w = (word: string, translation = "t", extra = {}) => ({ word, phonetic: "/p/", english: "e", translation, emoji: "📖", difficulty: "easy", example: null, ...extra });

const blob = {
  childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, ttsSpeed: 0.6, colorOverlay: "blue",
  stars: 2,
  wordsLearned: [w("Fox", "a", { bookId: "fox" }), w("fox", "b"), w("brave")],
  currentBook: { id: "fox", title: "x" },
  wordCache: {
    "brave_tagalog": w("brave", "Matapang"),
    "lost_hiligaynon": w("lost", PLACEHOLDER),
    "moon_hiligaynon": w("moon", "Bulan"),
  },
  bookProgress: { fox: 50 }, streak: 4, lastActiveDate: "2025-01-02", quizHighScore: 7,
};

beforeEach(async () => {
  const db = getDb()!;
  await Promise.all([db.wordCache.clear(), db.words.clear()]);
  localStorage.clear();
});

describe("runMigrations", () => {
  it("maps the old blob and removes the key; idempotent", async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(blob));
    await runMigrations();

    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(useSettings.getState()).toMatchObject({ childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, ttsSpeed: 0.6, colorOverlay: "blue" });
    expect(useProgress.getState()).toMatchObject({ currentBookId: "fox", bookProgress: { fox: 50 }, streak: 4, quizHighScore: 7, savedWordCount: 2 });

    const db = getDb()!;
    const words = await db.words.toArray();
    expect(words.map((x) => x.key).sort()).toEqual(["brave", "fox"]);
    expect(words.find((x) => x.key === "fox")).toMatchObject({ translation: "a", bookId: "fox" });

    const cache = await db.wordCache.toArray();
    expect(cache.map((x) => x.key).sort()).toEqual(["brave_tagalog", "moon_hiligaynon"]);
    expect(cache.every((x) => x.source === "ai")).toBe(true);

    await runMigrations();
    expect(await db.words.count()).toBe(2);
    expect(await db.wordCache.count()).toBe(2);
  });

  it("does nothing without a legacy blob", async () => {
    await runMigrations();
    expect(await getDb()!.words.count()).toBe(0);
  });
});
