/**
 * Read-along helpers. Web Speech reports `boundary` events with a `charIndex` into the utterance text (one
 * sentence at a time here). These pure functions turn that into the ORDINAL of the word among all the words of
 * the whole text, which the reader maps to a token. Words are runs of letters with internal apostrophes or
 * hyphens, exactly like `tokenize` in @/lib/tokenize.
 */
const WORD_RE = /\p{L}+(?:['’\-]\p{L}+)*/gu;

export interface WordSpan {
  start: number;
  end: number;
}

/** Start/end offsets of every word in `text`. */
export function wordSpans(text: string): WordSpan[] {
  return Array.from(text.matchAll(WORD_RE), (m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
}

/** How many words each sentence holds, in order. */
export function sentenceWordCounts(sentences: readonly string[]): number[] {
  return sentences.map((s) => wordSpans(s).length);
}

/**
 * The index (within `sentence`) of the word that contains `charIndex`, or the next word when the offset falls
 * on a gap or punctuation. Returns null when no word starts at or after the offset.
 */
export function wordOrdinalAt(sentence: string, charIndex: number): number | null {
  const spans = wordSpans(sentence);
  for (let i = 0; i < spans.length; i++) {
    if (charIndex < spans[i].end) return i;
  }
  return null;
}

/** The ordinal among all words of the text: words in earlier sentences plus the word within this sentence. */
export function globalWordOrdinal(sentences: readonly string[], sentenceIndex: number, charIndex: number): number | null {
  const sentence = sentences[sentenceIndex];
  if (sentence === undefined) return null;
  const within = wordOrdinalAt(sentence, charIndex);
  if (within === null) return null;
  let before = 0;
  for (let i = 0; i < sentenceIndex; i++) before += wordSpans(sentences[i]).length;
  return before + within;
}
