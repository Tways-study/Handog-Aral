export type TokenKind = "word" | "space" | "punct";

export interface Token {
  kind: TokenKind;
  value: string;
  /** Position of this token in the token array. */
  index: number;
}

// A word: letters (any script, incl. accents and combining marks), with internal apostrophes (straight or curly) or hyphens.
const TOKEN_RE = /(?:\p{L}\p{M}*)+(?:['’\-](?:\p{L}\p{M}*)+)*|\s+|[^\p{L}\s]+/gu;

/** The most characters of one page that become tappable words; a scan or paste past this is cut at a sentence end. */
export const MAX_PAGE_CHARS = 6000;
/** The most characters of context sent with a tapped word (the proxy accepts 600). */
export const MAX_CONTEXT_CHARS = 400;

/**
 * Keeps a page to a size the reader can render as tappable words (every word is a button). Cuts at the last sentence end
 * before the limit, else the last space. `trimmed` says whether anything was cut.
 */
export function clampPage(text: string, max: number = MAX_PAGE_CHARS): { text: string; trimmed: boolean } {
  if (text.length <= max) return { text, trimmed: false };
  const head = text.slice(0, max);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf("\n"));
  const cut = sentenceEnd > max * 0.5 ? sentenceEnd + 1 : Math.max(head.lastIndexOf(" "), 1);
  return { text: head.slice(0, cut).trimEnd(), trimmed: true };
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // NFC first: an "ñ" typed or scanned as n + a combining tilde must stay one word (and match the dictionary).
  for (const m of text.normalize("NFC").matchAll(TOKEN_RE)) {
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
  const sentence = fullText.substring(sentenceStart, sentenceEnd);
  if (sentence.length <= MAX_CONTEXT_CHARS) return sentence.trim();
  // Scanned lists, poems and headings often have no punctuation, so "the sentence" can be the whole page. Send a window
  // around the tapped word instead (the proxy rejects context over 600 characters, which would lose the AI explanation).
  const at = before.length - sentenceStart;
  let from = Math.max(0, at - Math.floor(MAX_CONTEXT_CHARS / 2));
  let to = Math.min(sentence.length, from + MAX_CONTEXT_CHARS);
  from = Math.max(0, to - MAX_CONTEXT_CHARS);
  if (from > 0) from = Math.min(sentence.indexOf(" ", from) + 1 || from, at);
  if (to < sentence.length) {
    const sp = sentence.lastIndexOf(" ", to);
    if (sp > at) to = sp;
  }
  return sentence.slice(from, to).trim();
}
