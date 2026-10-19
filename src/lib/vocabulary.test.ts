import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/stores/db";
import { useProgress } from "@/stores/progress";
import type { ResolvedExplanation } from "@/shared/schemas";
import { forgetWord, learnWord, WORDS_PER_BOOK } from "./vocabulary";

const entry = (word: string): ResolvedExplanation => ({
  word,
  phonetic: `/${word}/`,
  english: `meaning of ${word}`,
  translation: `kahulugan ng ${word}`,
  emoji: "📖",
  difficulty: "easy",
  example: null,
  source: "curated",
  language: "tagalog",
});

describe("vocabulary service", () => {
  beforeEach(async () => {
    await getDb()?.words.clear();
    useProgress.getState().resetAll();
  });

  it("counts saved words and computes book progress", async () => {
    await learnWord(entry("fox"), "fox");
    await learnWord(entry("forest"), "fox");
    await learnWord(entry("star"), "star");
    const p = useProgress.getState();
    expect(p.savedWordCount).toBe(3);
    expect(p.bookProgress.fox).toBe(Math.round((2 / WORDS_PER_BOOK) * 100));
    expect(p.bookProgress.star).toBe(Math.round((1 / WORDS_PER_BOOK) * 100));
  });

  it("is case-insensitive and idempotent", async () => {
    await learnWord(entry("Fox"), "fox");
    await learnWord(entry("fox"), "fox");
    expect(useProgress.getState().savedWordCount).toBe(1);
  });

  it("caps progress at 100 and recomputes on removal", async () => {
    for (const w of ["a1", "a2", "a3", "a4", "a5", "a6", "a7"]) await learnWord(entry(w), "fox");
    expect(useProgress.getState().bookProgress.fox).toBe(100);
    await forgetWord("a7");
    await forgetWord("a6");
    expect(useProgress.getState().bookProgress.fox).toBe(Math.round((5 / WORDS_PER_BOOK) * 100));
    expect(useProgress.getState().savedWordCount).toBe(5);
  });

  it("does not credit a book for words saved without one", async () => {
    await learnWord(entry("typed"), null);
    const p = useProgress.getState();
    expect(p.savedWordCount).toBe(1);
    expect(Object.values(p.bookProgress).every((v) => v === 0)).toBe(true);
    await closeDb();
  });
});
