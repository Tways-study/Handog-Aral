"use client";

import { memo, useMemo } from "react";
import { normalizeWord } from "@/lib/dictionary/normalize";
import type { Token } from "@/lib/tokenize";
import { cn } from "@/lib/utils";

/** Sentence number for every token, aligned with splitSentences() from @/lib/tts. */
export function sentenceIndexes(tokens: Token[]): number[] {
  const out: number[] = [];
  let s = 0;
  let pendingBreak = false;
  for (const tok of tokens) {
    // The sentence ends after the terminator token (closing quotes travel with it); advance on the next real token.
    if (pendingBreak && tok.kind !== "space") {
      s++;
      pendingBreak = false;
    }
    out.push(s);
    if (tok.kind === "punct" && /[.!?…]/.test(tok.value)) pendingBreak = true;
  }
  return out;
}

/** Groups tokens into whitespace runs and unbreakable word chunks. */
function chunks(tokens: Token[]): Token[][] {
  const out: Token[][] = [];
  for (const tok of tokens) {
    const last = out[out.length - 1];
    if (last && (last[0].kind === "space") === (tok.kind === "space")) last.push(tok);
    else out.push([tok]);
  }
  return out;
}

export interface ReaderTextProps {
  tokens: Token[];
  /** Token index of the tapped word. */
  tappedIndex: number | null;
  /** Normalized saved words. */
  savedWords: ReadonlySet<string>;
  /** Index of the sentence being read aloud. */
  readingSentence: number | null;
  onWordTap: (token: Token) => void;
  className?: string;
}

/** Tokenized page text. Every word is a real button; sentences are wrapped so listening can highlight one. */
function ReaderTextImpl({ tokens, tappedIndex, savedWords, readingSentence, onWordTap, className }: ReaderTextProps) {
  const groups = useMemo(() => {
    const idx = sentenceIndexes(tokens);
    const out: { sentence: number; tokens: Token[] }[] = [];
    tokens.forEach((tok, i) => {
      const last = out[out.length - 1];
      if (last && last.sentence === idx[i]) last.tokens.push(tok);
      else out.push({ sentence: idx[i], tokens: [tok] });
    });
    return out;
  }, [tokens]);

  return (
    <div className={cn("whitespace-pre-wrap", className)} data-slot="reader-text">
      {groups.map((g) => (
        <span
          key={g.tokens[0].index}
          data-sentence={g.sentence}
          data-reading={readingSentence === g.sentence ? "true" : undefined}
          className="box-decoration-clone data-[reading=true]:bg-marker/35"
        >
          {chunks(g.tokens).map((chunk) =>
            chunk[0].kind === "space" ? (
              chunk[0].value
            ) : (
              // Punctuation stays glued to its word, so a line never starts with a stray "." or ends on a lone quote.
              <span key={chunk[0].index} className="whitespace-nowrap">
                {chunk.map((tok) => {
                  if (tok.kind !== "word") return tok.value;
                  const state = tok.index === tappedIndex ? "tapped" : savedWords.has(normalizeWord(tok.value)) ? "saved" : undefined;
                  return (
                    <button
                      key={tok.index}
                      type="button"
                      data-token-index={tok.index}
                      data-state={state}
                      aria-label={tok.value}
                      aria-pressed={state === "tapped" ? true : undefined}
                      onClick={() => onWordTap(tok)}
                      className="word-mark relative inline-block cursor-pointer align-baseline text-inherit outline-none after:absolute after:-inset-x-0.5 after:-inset-y-[0.35rem] after:content-[''] focus-visible:outline-3 focus-visible:outline-ring"
                    >
                      {tok.value}
                    </button>
                  );
                })}
              </span>
            ),
          )}
        </span>
      ))}
    </div>
  );
}

const ReaderText = memo(ReaderTextImpl);
export default ReaderText;
