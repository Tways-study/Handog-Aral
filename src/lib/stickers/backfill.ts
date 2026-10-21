import type { ProgressData } from "@/stores/progress";
import type { RewardEvent } from "./evaluate";

/**
 * Events that describe progress a child already made before the sticker book existed (saved words,
 * streak, finished books). Pure, so it is easy to test; the boot component replays them quietly.
 */
export function backfillEvents(p: Pick<ProgressData, "savedWordCount" | "streak" | "bookProgress" | "quizStars">): RewardEvent[] {
  const events: RewardEvent[] = [];
  if (p.savedWordCount > 0) events.push({ type: "word-saved", total: p.savedWordCount, difficulty: "easy" });
  if (p.streak > 0) events.push({ type: "streak", days: p.streak });
  for (const [bookId, pct] of Object.entries(p.bookProgress)) {
    if (pct >= 100) events.push({ type: "book-progress", bookId, pct });
  }
  return events;
}
