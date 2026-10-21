import { sampleBooks } from "@/data/books";
import type { ResolvedExplanation } from "@/shared/schemas";
import { countWords, listWords, removeWord, saveWord } from "@/stores/db";
import { useProgress } from "@/stores/progress";
import { useRewards } from "@/stores/rewards";

/** Saved words per book that count as a finished book. */
export const WORDS_PER_BOOK = 6;

/** Recompute the saved-word count (drives word stars) and every book's progress from the saved words. */
export async function syncVocabularyProgress(): Promise<void> {
  const words = await listWords();
  const progress = useProgress.getState();
  progress.setSavedWordCount(words.length);
  for (const book of sampleBooks) {
    const n = words.filter((w) => w.bookId === book.id).length;
    progress.setBookProgress(book.id, Math.min(100, Math.round((n / WORDS_PER_BOOK) * 100)));
  }
}

export interface LearnResult {
  /** Saved words after this save. */
  total: number;
  /** The book's progress (0-100) after this save, or null for typed or scanned text. */
  pct: number | null;
}

/** Save a word (idempotent, case-insensitive) and keep progress in sync. `bookId` is null for typed or scanned text. */
export async function learnWord(entry: ResolvedExplanation, bookId: string | null): Promise<LearnResult> {
  await saveWord(entry, bookId);
  await syncVocabularyProgress();
  const progress = useProgress.getState();
  return { total: progress.savedWordCount, pct: bookId ? (progress.bookProgress[bookId] ?? 0) : null };
}

/**
 * Tell the rewards engine about a save: `word-saved` with the REAL difficulty (so `hard-word` can fire), and
 * `book-progress` for a book. Celebrations are queued by the store; callers delay this so a sticker dialog does
 * not land on top of the stamp.
 */
export function recordSaveRewards(entry: Pick<ResolvedExplanation, "difficulty">, bookId: string | null, result: LearnResult): void {
  const rewards = useRewards.getState();
  rewards.recordEvent({ type: "word-saved", total: result.total, difficulty: entry.difficulty });
  if (bookId && result.pct !== null) rewards.recordEvent({ type: "book-progress", bookId, pct: result.pct });
}

/** Remove a saved word and keep progress in sync. */
export async function forgetWord(word: string): Promise<void> {
  await removeWord(word);
  await syncVocabularyProgress();
}

export { countWords };
