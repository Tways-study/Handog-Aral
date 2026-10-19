import type { SavedWord } from "@/stores/db";

export const MIN_QUIZ_WORDS = 4;
export const DEFAULT_QUESTION_COUNT = 5;
const OPTIONS_PER_QUESTION = 4;

export type Rng = () => number;

export interface QuizQuestion {
  /** Lowercase word key, unique within a quiz. */
  id: string;
  word: string;
  phonetic: string;
  english: string;
  /** Four translations; exactly one is the answer and no two are the same text. */
  options: string[];
  answerIndex: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

/** Unbiased Fisher-Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Builds a multiple-choice quiz from saved words: "what does this word mean?" with the home-language
 * translation as the answer. Returns null when there are too few words, or too few DIFFERENT
 * translations, to offer 4 distinct choices.
 */
export function buildQuiz(
  words: readonly Pick<SavedWord, "word" | "phonetic" | "english" | "translation">[],
  count: number = DEFAULT_QUESTION_COUNT,
  rng: Rng = Math.random,
): Quiz | null {
  if (words.length < MIN_QUIZ_WORDS) return null;

  // One entry per distinct word text.
  const seen = new Set<string>();
  const unique = words.filter((w) => {
    const k = norm(w.word);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Group words by translation: a distractor may never share the answer's translation.
  const distinctTranslations = new Set(unique.map((w) => norm(w.translation)));
  if (distinctTranslations.size < OPTIONS_PER_QUESTION) return null;

  const picks = shuffle(unique, rng).slice(0, Math.max(1, count));
  const questions: QuizQuestion[] = picks.map((w) => {
    const answerKey = norm(w.translation);
    const used = new Set<string>([answerKey]);
    const distractors: string[] = [];
    for (const other of shuffle(unique, rng)) {
      const k = norm(other.translation);
      if (used.has(k)) continue;
      used.add(k);
      distractors.push(other.translation);
      if (distractors.length === OPTIONS_PER_QUESTION - 1) break;
    }
    const options = shuffle([w.translation, ...distractors], rng);
    return {
      id: norm(w.word),
      word: w.word,
      phonetic: w.phonetic,
      english: w.english,
      options,
      answerIndex: options.indexOf(w.translation),
    };
  });
  return { questions };
}
