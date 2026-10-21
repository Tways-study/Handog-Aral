import { STICKER_IDS, type StickerId } from "./ids";

/** One-time capability moments plus a few counters the rules need. Persisted in the rewards store. */
export interface RewardFlags {
  scanned: boolean;
  listened: boolean;
  quizzed: boolean;
  /** Distinct bundled book ids the child has opened. */
  openedBooks: string[];
  matchWins: number;
}

export const defaultFlags: RewardFlags = { scanned: false, listened: false, quizzed: false, openedBooks: [], matchWins: 0 };

/** How many bundled books there are (the `all-books` sticker needs every one opened). */
export const BUNDLED_BOOK_COUNT = 6;

/** The events other screens emit through `useRewards.getState().recordEvent(...)`. */
export type RewardEvent =
  | { type: "word-saved"; total: number; difficulty: "easy" | "medium" | "hard" }
  | { type: "scan-done" }
  | { type: "listen" }
  | { type: "quiz-finished"; score: number; total: number }
  | { type: "streak"; days: number }
  | { type: "book-progress"; bookId: string; pct: number }
  | { type: "book-opened"; bookId: string }
  | { type: "match-won" };

export type RewardEventType = RewardEvent["type"];

/** Pure: the flags after an event. Never mutates; returns the same object when nothing changed. */
export function applyEventToFlags(flags: RewardFlags, event: RewardEvent): RewardFlags {
  switch (event.type) {
    case "scan-done":
      return flags.scanned ? flags : { ...flags, scanned: true };
    case "listen":
      return flags.listened ? flags : { ...flags, listened: true };
    case "quiz-finished":
      return event.total > 0 && !flags.quizzed ? { ...flags, quizzed: true } : flags;
    case "book-opened":
      return event.bookId && !flags.openedBooks.includes(event.bookId)
        ? { ...flags, openedBooks: [...flags.openedBooks, event.bookId] }
        : flags;
    case "match-won":
      return { ...flags, matchWins: flags.matchWins + 1 };
    default:
      return flags;
  }
}

/** A sticker's rule: which events can award it and the test. `flags` are already updated for the event. */
export interface StickerRule {
  on: readonly RewardEventType[];
  check: (event: RewardEvent, flags: RewardFlags) => boolean;
}

const wordsAtLeast = (n: number): StickerRule => ({
  on: ["word-saved"],
  check: (e) => e.type === "word-saved" && e.total >= n,
});
const streakAtLeast = (n: number): StickerRule => ({
  on: ["streak"],
  check: (e) => e.type === "streak" && e.days >= n,
});

export const STICKER_RULES: Record<StickerId, StickerRule> = {
  "first-word": wordsAtLeast(1),
  "five-words": wordsAtLeast(5),
  "ten-words": wordsAtLeast(10),
  "twenty-five-words": wordsAtLeast(25),
  "hard-word": { on: ["word-saved"], check: (e) => e.type === "word-saved" && e.difficulty === "hard" },
  "first-scan": { on: ["scan-done"], check: (_e, f) => f.scanned },
  "first-listen": { on: ["listen"], check: (_e, f) => f.listened },
  "first-quiz": { on: ["quiz-finished"], check: (_e, f) => f.quizzed },
  "quiz-perfect": { on: ["quiz-finished"], check: (e) => e.type === "quiz-finished" && e.total > 0 && e.score >= e.total },
  "match-first": { on: ["match-won"], check: (_e, f) => f.matchWins >= 1 },
  "streak-3": streakAtLeast(3),
  "streak-7": streakAtLeast(7),
  "first-book": { on: ["book-progress"], check: (e) => e.type === "book-progress" && e.pct >= 100 },
  "all-books": { on: ["book-opened"], check: (_e, f) => f.openedBooks.length >= BUNDLED_BOOK_COUNT },
};

/**
 * Pure: the stickers an event newly earns, in catalog order. `flags` must already include the event
 * (use `applyEventToFlags` first). Already-earned ids are never returned, so replays are harmless.
 */
export function evaluateEvent(event: RewardEvent, flags: RewardFlags, earned: Partial<Record<StickerId, number>>): StickerId[] {
  return STICKER_IDS.filter((id) => {
    if (earned[id] !== undefined) return false;
    const rule = STICKER_RULES[id];
    return rule.on.includes(event.type) && rule.check(event, flags);
  });
}
