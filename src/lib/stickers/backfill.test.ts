import { describe, expect, it } from "vitest";
import { backfillEvents } from "./backfill";

describe("backfillEvents", () => {
  it("is empty for a brand-new child", () => {
    expect(backfillEvents({ savedWordCount: 0, streak: 0, bookProgress: {}, quizStars: 0 })).toEqual([]);
  });
  it("replays words, streak and finished books", () => {
    expect(backfillEvents({ savedWordCount: 12, streak: 3, bookProgress: { fox: 100, star: 40 }, quizStars: 0 })).toEqual([
      { type: "word-saved", total: 12, difficulty: "easy" },
      { type: "streak", days: 3 },
      { type: "book-progress", bookId: "fox", pct: 100 },
    ]);
  });
});
