/**
 * The child's language, which is also the direction of every lookup.
 * "tagalog" (shown as Filipino): the app is in Filipino and the child taps English words.
 * "english": the app is in English and the child taps Filipino words.
 */
export type Language = "tagalog" | "english";
export type FontSize = "small" | "medium" | "large";
export type ColorOverlay = "none" | "yellow" | "blue" | "pink";
export type Difficulty = "easy" | "medium" | "hard";

export interface WordEntry {
  word: string;
  phonetic: string;
  english: string;
  translation: string;
  emoji: string;
  difficulty: Difficulty;
  example?: string | null;
  bookId?: string | null;
}

/** Curated English -> Filipino entry: the tapped word is English, `tagalog` is the Filipino explanation. */
export interface FallbackWord extends Omit<WordEntry, "translation"> {
  tagalog: string;
}

/** Curated Filipino -> English entry: the tapped word is Filipino, `english` is the English explanation. */
export interface FilipinoWord {
  /** The Filipino word, lowercase. */
  word: string;
  /** Pronunciation in simple syllables, e.g. "/ma-GAN-dah/". */
  phonetic: string;
  /** A simple Filipino definition (the word's own language). */
  filipino: string;
  /** The English meaning shown to the child, fun and child-friendly (max ~20 words). */
  english: string;
  emoji: string;
  difficulty: Difficulty;
  /** A short Filipino example sentence. */
  example?: string | null;
}

/** Notebook-cover motif and jacket colour token (v3). */
export type CoverId = "fox" | "star" | "rice" | "rainbow" | "turtle" | "basket";
export type Jacket = "indigo" | "kangkong" | "mango" | "gumamela";

export interface Book {
  id: string;
  title: string;
  /** SVG cover motif. */
  coverId: CoverId;
  /** Jacket colour token. */
  jacket: Jacket;
  text: string;
}
