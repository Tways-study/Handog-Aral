import { describe, expect, it } from "vitest";
import { bonusStarsFor, buildDeck, canPlay, flip, isMatched, newGame, pairableWords, resolveMismatch, shuffle, type MatchGame } from "./match";

const W = (n: number) => Array.from({ length: n }, (_, i) => ({ word: `word${i}`, translation: `meaning${i}` }));
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

/** A game with a fixed, known layout: w0 m0 w1 m1 w2 m2. */
function fixed(): MatchGame {
  const cards = W(3).flatMap((w) => [
    { id: `word:${w.word}`, pairId: w.word, kind: "word" as const, text: w.word },
    { id: `meaning:${w.word}`, pairId: w.word, kind: "meaning" as const, text: w.translation },
  ]);
  return newGame(cards);
}

describe("deck", () => {
  it("needs at least 3 pairable words", () => {
    expect(buildDeck(W(2))).toBeNull();
    expect(canPlay(W(3))).toBe(true);
  });
  it("builds 3 to 6 pairs, each with one word and one meaning card", () => {
    for (const n of [3, 4, 5, 6, 9]) {
      const deck = buildDeck(W(n))!;
      const pairs = Math.min(6, n);
      expect(deck).toHaveLength(pairs * 2);
      for (const c of deck.filter((c) => c.kind === "word")) {
        expect(deck.filter((d) => d.pairId === c.pairId).map((d) => d.kind).sort()).toEqual(["meaning", "word"]);
      }
    }
  });
  it("never pairs duplicate or identical translations", () => {
    const words = [
      { word: "a", translation: "same" },
      { word: "b", translation: "Same " },
      { word: "c", translation: "c" },
      { word: "d", translation: "one" },
      { word: "e", translation: "two" },
      { word: "D", translation: "other" },
      { word: "f", translation: "" },
    ];
    const ok = pairableWords(words);
    expect(ok.map((w) => w.word)).toEqual(["a", "d", "e"]);
    const deck = buildDeck(words)!;
    expect(new Set(deck.filter((c) => c.kind === "meaning").map((c) => c.text.toLowerCase())).size).toBe(3);
  });
  it("shuffle keeps every item and is unbiased enough to move things", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(shuffle(items).sort()).toEqual(items);
    expect(shuffle(items, seq(0, 0, 0, 0, 0))).not.toEqual(items);
    const firsts = new Set<number>();
    for (let i = 0; i < 300; i++) firsts.add(shuffle(items)[0]);
    expect(firsts.size).toBe(6);
  });
});

describe("flips", () => {
  it("first flip shows the card without counting a move", () => {
    const g = flip(fixed(), 0);
    expect(g.faceUp).toEqual([0]);
    expect(g.moves).toBe(0);
  });
  it("a match keeps both matched and counts one move", () => {
    const g = flip(flip(fixed(), 0), 1);
    expect(g.moves).toBe(1);
    expect(g.faceUp).toEqual([]);
    expect(isMatched(g, 0) && isMatched(g, 1)).toBe(true);
    expect(g.mismatch).toBe(false);
  });
  it("a mismatch shows both until resolved", () => {
    const g = flip(flip(fixed(), 0), 3);
    expect(g.mismatch).toBe(true);
    expect(g.faceUp).toEqual([0, 3]);
    const back = resolveMismatch(g);
    expect(back.faceUp).toEqual([]);
    expect(back.mismatch).toBe(false);
    expect(resolveMismatch(back)).toBe(back);
  });
  it("tapping during a mismatch flips it back and opens the new card (never traps input)", () => {
    const g = flip(flip(flip(fixed(), 0), 3), 4);
    expect(g.faceUp).toEqual([4]);
    expect(g.mismatch).toBe(false);
  });
  it("ignores the same card twice and matched cards", () => {
    const one = flip(fixed(), 0);
    expect(flip(one, 0)).toEqual(one);
    const matched = flip(one, 1);
    expect(flip(matched, 0)).toBe(matched);
    expect(flip(fixed(), 99).faceUp).toEqual([]);
  });
  it("wins when every pair is found and ignores flips afterwards (idempotent)", () => {
    let g = fixed();
    for (const i of [0, 2, 4]) g = flip(flip(g, i), i + 1);
    expect(g.won).toBe(true);
    expect(g.moves).toBe(3);
    expect(flip(g, 0)).toBe(g);
    expect(g.matchedPairs).toHaveLength(3);
  });
});

describe("scoring", () => {
  it("1 star for a win, 2 when moves <= 2 x pairs", () => {
    expect(bonusStarsFor(6, 3)).toBe(2);
    expect(bonusStarsFor(7, 3)).toBe(1);
    expect(bonusStarsFor(12, 6)).toBe(2);
    expect(bonusStarsFor(13, 6)).toBe(1);
  });
});
