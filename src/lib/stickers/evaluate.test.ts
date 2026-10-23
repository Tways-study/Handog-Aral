import { describe, expect, it } from "vitest";
import { sampleBooks as BOOKS } from "@/data/books";
import { OUTFIT_UNLOCKS, isOutfitUnlocked, stickerHint, stickerTitle, STICKER_CATALOG } from "./catalog";
import { applyEventToFlags, BUNDLED_BOOK_COUNT, defaultFlags, evaluateEvent, type RewardEvent, type RewardFlags } from "./evaluate";
import { STICKER_IDS, type StickerId } from "./ids";

function run(event: RewardEvent, flags: RewardFlags = defaultFlags, earned: Partial<Record<StickerId, number>> = {}) {
  const next = applyEventToFlags(flags, event);
  return { ids: evaluateEvent(event, next, earned), flags: next };
}
const saved = (total: number, difficulty: "easy" | "medium" | "hard" = "easy"): RewardEvent => ({ type: "word-saved", total, difficulty });

describe("catalog", () => {
  it("covers every id in both languages", () => {
    expect(STICKER_CATALOG.map((c) => c.id)).toEqual([...STICKER_IDS]);
    for (const id of STICKER_IDS) {
      for (const lang of ["tagalog", "english"] as const) {
        expect(stickerTitle(id, lang).length).toBeGreaterThan(1);
        expect(stickerHint(id, lang).length).toBeGreaterThan(1);
      }
    }
  });
  it("knows the bundled book count", () => {
    expect(BOOKS.length).toBe(BUNDLED_BOOK_COUNT);
  });
  it("unlocks glasses, cap and bow with the right stickers", () => {
    expect(OUTFIT_UNLOCKS).toEqual({ glasses: "five-words", cap: "first-book", bow: "streak-3" });
    expect(isOutfitUnlocked("none", {})).toBe(true);
    expect(isOutfitUnlocked("glasses", {})).toBe(false);
    expect(isOutfitUnlocked("glasses", { "five-words": 1 })).toBe(true);
  });
});

describe("word rules and boundaries", () => {
  it.each([
    [0, []],
    [1, ["first-word"]],
    [4, ["first-word"]],
    [5, ["first-word", "five-words"]],
    [9, ["first-word", "five-words"]],
    [10, ["first-word", "five-words", "ten-words"]],
    [24, ["first-word", "five-words", "ten-words"]],
    [25, ["first-word", "five-words", "ten-words", "twenty-five-words"]],
  ])("saving to %i words earns %j", (total, expected) => {
    expect(run(saved(total)).ids).toEqual(expected);
  });
  it("only a hard word earns hard-word", () => {
    expect(run(saved(1, "medium")).ids).not.toContain("hard-word");
    expect(run(saved(1, "hard")).ids).toContain("hard-word");
  });
});

describe("capability rules", () => {
  it("scan, listen", () => {
    expect(run({ type: "scan-done" }).ids).toEqual(["first-scan"]);
    expect(run({ type: "listen" }).ids).toEqual(["first-listen"]);
  });
  it("quiz: any finished quiz, perfect only at full score", () => {
    expect(run({ type: "quiz-finished", score: 3, total: 5 }).ids).toEqual(["first-quiz"]);
    expect(run({ type: "quiz-finished", score: 5, total: 5 }).ids).toEqual(["first-quiz", "quiz-perfect"]);
    expect(run({ type: "quiz-finished", score: 0, total: 0 }).ids).toEqual([]);
  });
  it("streak boundaries", () => {
    expect(run({ type: "streak", days: 2 }).ids).toEqual([]);
    expect(run({ type: "streak", days: 3 }).ids).toEqual(["streak-3"]);
    expect(run({ type: "streak", days: 6 }).ids).toEqual(["streak-3"]);
    expect(run({ type: "streak", days: 7 }).ids).toEqual(["streak-3", "streak-7"]);
  });
  it("first-book needs 100%", () => {
    expect(run({ type: "book-progress", bookId: "fox", pct: 99 }).ids).toEqual([]);
    expect(run({ type: "book-progress", bookId: "fox", pct: 100 }).ids).toEqual(["first-book"]);
  });
  it("all-books needs six distinct books", () => {
    let flags = defaultFlags;
    const ids = ["fox", "star", "pedro", "rainbow", "turtle"];
    for (const b of ids) flags = run({ type: "book-opened", bookId: b }, flags).flags;
    expect(run({ type: "book-opened", bookId: "turtle" }, flags).ids).toEqual([]); // replay
    expect(flags.openedBooks).toHaveLength(5);
    expect(run({ type: "book-opened", bookId: "market" }, flags).ids).toEqual(["all-books"]);
  });
  it("match-won counts wins and earns match-first", () => {
    const first = run({ type: "match-won" });
    expect(first.ids).toEqual(["match-first"]);
    expect(first.flags.matchWins).toBe(1);
    expect(run({ type: "match-won" }, first.flags, { "match-first": 1 }).ids).toEqual([]);
  });
});

describe("idempotence", () => {
  it("never returns an already earned sticker and does not mutate flags", () => {
    const earned = { "first-word": 1 };
    expect(run(saved(1), defaultFlags, earned).ids).toEqual([]);
    const f = Object.freeze({ ...defaultFlags, openedBooks: Object.freeze([]) as unknown as string[] });
    expect(() => applyEventToFlags(f, { type: "book-opened", bookId: "x" })).not.toThrow();
    expect(applyEventToFlags(f, { type: "streak", days: 3 })).toBe(f);
  });
});
