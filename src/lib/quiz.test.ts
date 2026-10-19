import { describe, expect, it } from "vitest";
import { buildQuiz, shuffle, type Rng } from "./quiz";

/** mulberry32: small seeded PRNG. */
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const w = (word: string, translation: string) => ({ word, translation, phonetic: `/${word}/`, english: `meaning of ${word}` });
const WORDS = [w("cat", "iring"), w("dog", "ido"), w("sun", "adlaw"), w("moon", "bulan"), w("rice", "kan-on"), w("fish", "isda"), w("tree", "kahoy")];

describe("shuffle", () => {
  it("returns a permutation and does not mutate the input", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src, seeded(1));
    expect([...out].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
  it("is statistically uniform (every permutation of 3 appears ~1/6 of the time)", () => {
    const rng = seeded(42);
    const counts = new Map<string, number>();
    const N = 12000;
    for (let i = 0; i < N; i++) {
      const k = shuffle(["a", "b", "c"], rng).join("");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const c of counts.values()) expect(Math.abs(c - N / 6)).toBeLessThan(N / 6 * 0.1);
  });
});

describe("buildQuiz", () => {
  it("returns null with fewer than 4 words", () => {
    expect(buildQuiz(WORDS.slice(0, 3), 5, seeded(1))).toBeNull();
  });
  it("returns null when fewer than 4 distinct translations exist", () => {
    expect(buildQuiz([w("a", "x"), w("b", "x"), w("c", "y"), w("d", "z")], 5, seeded(1))).toBeNull();
  });
  it("asks distinct words, 4 options each, answerIndex points at the right translation", () => {
    const quiz = buildQuiz(WORDS, 5, seeded(7))!;
    expect(quiz.questions).toHaveLength(5);
    expect(new Set(quiz.questions.map((q) => q.id)).size).toBe(5);
    for (const q of quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answerIndex]).toBe(WORDS.find((x) => x.word === q.word)!.translation);
    }
  });
  it("never offers duplicate translations, even when words share one", () => {
    const words = [w("hi", "kumusta"), w("hello", "kumusta"), w("cat", "iring"), w("dog", "ido"), w("sun", "adlaw"), w("moon", "bulan")];
    for (let seed = 1; seed <= 60; seed++) {
      const quiz = buildQuiz(words, 5, seeded(seed))!;
      for (const q of quiz.questions) expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
    }
  });
  it("caps the question count at the number of words", () => {
    const quiz = buildQuiz(WORDS.slice(0, 4), 5, seeded(3))!;
    expect(quiz.questions).toHaveLength(4);
  });
  it("is deterministic for a seed and reshuffles on retry", () => {
    expect(buildQuiz(WORDS, 5, seeded(9))).toEqual(buildQuiz(WORDS, 5, seeded(9)));
    const a = JSON.stringify(buildQuiz(WORDS, 5, seeded(9)));
    const others = [10, 11, 12, 13].map((s) => JSON.stringify(buildQuiz(WORDS, 5, seeded(s))));
    expect(others.some((o) => o !== a)).toBe(true);
  });
  it("picks every word eventually (no positional bias)", () => {
    const rng = seeded(5);
    const first = new Set<string>();
    for (let i = 0; i < 80; i++) first.add(buildQuiz(WORDS, 5, rng)!.questions[0].id);
    expect(first.size).toBe(WORDS.length);
  });
});
