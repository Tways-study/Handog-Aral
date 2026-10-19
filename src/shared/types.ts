export type Language = "hiligaynon" | "tagalog";
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

/** Curated fallback entries carry both languages so either can be served. */
export interface FallbackWord extends Omit<WordEntry, "translation"> {
  hiligaynon: string;
  tagalog: string;
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
