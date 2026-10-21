/**
 * Pure logic of the memory-match game: build a deck from saved words, resolve flips, detect a win,
 * score it. No timers and no React here; the screen owns the ~900 ms mismatch delay.
 */
export const MIN_MATCH_WORDS = 3;
export const MAX_MATCH_PAIRS = 6;

export interface MatchWord {
  word: string;
  translation: string;
}

export interface MatchCard {
  /** Unique per card (`word:<key>` or `meaning:<key>`). */
  id: string;
  /** Shared by the two halves of a pair. */
  pairId: string;
  kind: "word" | "meaning";
  text: string;
}

export interface MatchGame {
  cards: MatchCard[];
  pairs: number;
  /** Indexes currently face up and not matched (0, 1, or 2 while a mismatch waits to flip back). */
  faceUp: number[];
  matchedPairs: string[];
  moves: number;
  /** True while the two face-up cards are not a pair. */
  mismatch: boolean;
  won: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Fisher-Yates (unbiased). `rng` is injectable for tests. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Words that can make a fair pair: both sides present, differ from each other, and no two words share a word or a translation. */
export function pairableWords(words: readonly MatchWord[]): MatchWord[] {
  const seenWords = new Set<string>();
  const seenMeanings = new Set<string>();
  const out: MatchWord[] = [];
  for (const w of words) {
    const word = norm(w.word);
    const meaning = norm(w.translation);
    if (!word || !meaning || word === meaning) continue;
    if (seenWords.has(word) || seenMeanings.has(meaning)) continue;
    seenWords.add(word);
    seenMeanings.add(meaning);
    out.push({ word: w.word.trim(), translation: w.translation.trim() });
  }
  return out;
}

export function canPlay(words: readonly MatchWord[]): boolean {
  return pairableWords(words).length >= MIN_MATCH_WORDS;
}

/** A shuffled deck of 3-6 pairs (word card + meaning card each) from random saved words. Null if there are too few. */
export function buildDeck(words: readonly MatchWord[], rng: () => number = Math.random): MatchCard[] | null {
  const pool = pairableWords(words);
  if (pool.length < MIN_MATCH_WORDS) return null;
  const chosen = shuffle(pool, rng).slice(0, Math.min(MAX_MATCH_PAIRS, pool.length));
  const cards = chosen.flatMap((w): MatchCard[] => {
    const key = norm(w.word);
    return [
      { id: `word:${key}`, pairId: key, kind: "word", text: w.word },
      { id: `meaning:${key}`, pairId: key, kind: "meaning", text: w.translation },
    ];
  });
  return shuffle(cards, rng);
}

export function newGame(cards: MatchCard[]): MatchGame {
  return { cards, pairs: cards.length / 2, faceUp: [], matchedPairs: [], moves: 0, mismatch: false, won: false };
}

export function isMatched(game: MatchGame, index: number): boolean {
  return game.matchedPairs.includes(game.cards[index].pairId);
}

/** Flips the two mismatched cards back down. A no-op when nothing is waiting. */
export function resolveMismatch(game: MatchGame): MatchGame {
  return game.mismatch ? { ...game, faceUp: [], mismatch: false } : game;
}

/**
 * Turns card `index` face up. Input is never trapped: tapping while a mismatch is showing flips that
 * pair back first. Ignored for matched, already-up and out-of-range cards, and after the win.
 */
export function flip(game: MatchGame, index: number): MatchGame {
  if (game.won || index < 0 || index >= game.cards.length) return game;
  const g = resolveMismatch(game);
  if (isMatched(g, index) || g.faceUp.includes(index)) return g;
  if (g.faceUp.length === 0) return { ...g, faceUp: [index] };

  const first = g.cards[g.faceUp[0]];
  const second = g.cards[index];
  const moves = g.moves + 1;
  if (first.pairId === second.pairId && first.id !== second.id) {
    const matchedPairs = [...g.matchedPairs, first.pairId];
    return { ...g, faceUp: [], matchedPairs, moves, mismatch: false, won: matchedPairs.length === g.pairs };
  }
  return { ...g, faceUp: [g.faceUp[0], index], moves, mismatch: true };
}

/** Bonus stars for a win: 1, plus 1 more when it took at most twice as many moves as there are pairs. */
export function bonusStarsFor(moves: number, pairs: number): number {
  return moves <= 2 * pairs ? 2 : 1;
}
