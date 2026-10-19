import { sampleBooks } from "@/data/books";
import type { ResolvedExplanation } from "@/shared/schemas";
import { countWords, listWords, removeWord, saveWord } from "@/stores/db";
import { useProgress } from "@/stores/progress";

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

/** Save a word (idempotent, case-insensitive) and keep progress in sync. `bookId` is null for typed or scanned text. */
export async function learnWord(entry: ResolvedExplanation, bookId: string | null): Promise<void> {
  await saveWord(entry, bookId);
  await syncVocabularyProgress();
}

/** Remove a saved word and keep progress in sync. */
export async function forgetWord(word: string): Promise<void> {
  await removeWord(word);
  await syncVocabularyProgress();
}

export { countWords };
