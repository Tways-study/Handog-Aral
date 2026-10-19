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
  /** v3: SVG cover motif (replaces `emoji`). */
  coverId: CoverId;
  /** v3: jacket colour token (replaces `color`). */
  jacket: Jacket;
  /** LEGACY: removed in Phase 4. */
  emoji: string;
  /** LEGACY: removed in Phase 4. */
  color: string;
  progress: number;
  text: string;
}

export interface AppState {
  childName: string;
  language: Language;
  fontSize: FontSize;
  dyslexiaFont: boolean;
  ttsSpeed: number;
  colorOverlay: ColorOverlay;
  stars: number;
  wordsLearned: WordEntry[];
  currentBook: Book | null;
  wordCache: Record<string, WordEntry>;
  bookProgress: Record<string, number>;
  streak: number;
  lastActiveDate: string | null;
  quizHighScore: number;
}

export type Action =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_FONT_SIZE"; payload: FontSize }
  | { type: "SET_DYSLEXIA_FONT"; payload: boolean }
  | { type: "SET_TTS_SPEED"; payload: number }
  | { type: "SET_COLOR_OVERLAY"; payload: ColorOverlay }
  | { type: "ADD_STAR" }
  | { type: "LEARN_WORD"; payload: WordEntry }
  | { type: "CACHE_WORD"; payload: { word: string; data: WordEntry } }
  | { type: "SET_CURRENT_BOOK"; payload: Book | null }
  | { type: "SET_BOOK_PROGRESS"; payload: { id: string; progress: number } }
  | { type: "UPDATE_STREAK" }
  | { type: "SET_QUIZ_HIGH_SCORE"; payload: number }
  | { type: "REMOVE_WORD"; payload: string }
  | { type: "RESET_PROGRESS" };
