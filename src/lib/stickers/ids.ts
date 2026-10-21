/**
 * The sticker book's fixed id list. The art track draws one SVG per id (`StickerArt`), the rewards track
 * owns the rules that award them (`src/lib/stickers/catalog.ts`). Add an id here only together with its art.
 */
export const STICKER_IDS = [
  "first-word", // saved your first word
  "five-words",
  "ten-words",
  "twenty-five-words",
  "hard-word", // saved a word marked hard
  "first-scan", // read a page you scanned
  "first-listen", // had a word or page read aloud
  "first-quiz", // finished a quiz
  "quiz-perfect",
  "match-first", // won the memory game
  "streak-3",
  "streak-7",
  "first-book", // finished a bundled book
  "all-books", // opened all six books
] as const;

export type StickerId = (typeof STICKER_IDS)[number];
