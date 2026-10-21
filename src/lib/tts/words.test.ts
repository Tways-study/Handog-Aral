import { describe, expect, it } from "vitest";
import { globalWordOrdinal, sentenceWordCounts, wordOrdinalAt, wordSpans } from "./words";
import { splitSentences } from "./sentences";
import { tokenize } from "@/lib/tokenize";

describe("wordSpans", () => {
  it("finds words with apostrophes and hyphens, skips punctuation", () => {
    const spans = wordSpans("Don't stop, well-known fox!");
    expect(spans.map((s) => "Don't stop, well-known fox!".slice(s.start, s.end))).toEqual(["Don't", "stop", "well-known", "fox"]);
  });
});

describe("wordOrdinalAt", () => {
  const s = "The fox ran home.";
  it("maps a boundary charIndex to the word that starts there", () => {
    expect(wordOrdinalAt(s, 0)).toBe(0);
    expect(wordOrdinalAt(s, 4)).toBe(1);
    expect(wordOrdinalAt(s, 8)).toBe(2);
    expect(wordOrdinalAt(s, 12)).toBe(3);
  });
  it("maps an offset inside a word to that word", () => {
    expect(wordOrdinalAt(s, 5)).toBe(1);
  });
  it("jumps from a gap to the next word and returns null past the last word", () => {
    expect(wordOrdinalAt(s, 3)).toBe(1);
    expect(wordOrdinalAt(s, 16)).toBeNull();
  });
});

describe("globalWordOrdinal", () => {
  const text = "The fox ran. It was cold! Was it?\nYes.";
  const sentences = splitSentences(text);
  it("counts the words of earlier sentences", () => {
    expect(sentenceWordCounts(sentences)).toEqual([3, 3, 2, 1]);
    expect(globalWordOrdinal(sentences, 0, 0)).toBe(0);
    expect(globalWordOrdinal(sentences, 1, 0)).toBe(3);
    expect(globalWordOrdinal(sentences, 1, 3)).toBe(4);
    expect(globalWordOrdinal(sentences, 3, 0)).toBe(8);
  });
  it("agrees with the tokenizer's word order", () => {
    const words = tokenize(text).filter((t) => t.kind === "word").map((t) => t.value);
    expect(words).toHaveLength(9);
    expect(words[globalWordOrdinal(sentences, 2, 4)!]).toBe("it");
  });
  it("is null for an unknown sentence", () => {
    expect(globalWordOrdinal(sentences, 9, 0)).toBeNull();
  });
});
