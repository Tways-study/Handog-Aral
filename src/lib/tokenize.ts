export type TokenKind = "word" | "space" | "punct";

export interface Token {
  kind: TokenKind;
  value: string;
  /** Position of this token in the token array. */
  index: number;
}

// A word: letters (any script, incl. accents), with internal apostrophes (straight or curly) or hyphens.
const TOKEN_RE = /\p{L}+(?:['’\-]\p{L}+)*|\s+|[^\p{L}\s]+/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const value = m[0];
    const kind: TokenKind = /^\p{L}/u.test(value) ? "word" : /^\s/.test(value) ? "space" : "punct";
    tokens.push({ kind, value, index: tokens.length });
  }
  return tokens;
}

/** Returns the sentence (split on . ! ?) that contains the token at `index`. */
export function findSentence(tokens: Token[], index: number): string {
  const fullText = tokens.map((t) => t.value).join("");
  const before = tokens
    .slice(0, index)
    .map((t) => t.value)
    .join("");
  const sentenceStart = Math.max(
    before.lastIndexOf(".") + 1,
    before.lastIndexOf("!") + 1,
    before.lastIndexOf("?") + 1,
    0,
  );
  const after = fullText.substring(before.length);
  const endMatch = after.search(/[.!?]/);
  const sentenceEnd = endMatch >= 0 ? before.length + endMatch + 1 : fullText.length;
  return fullText.substring(sentenceStart, sentenceEnd).trim();
}
