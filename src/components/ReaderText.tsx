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

/** Source line (split on newlines) of every token. A scanned page keeps the lines of the book it came from. */
export function lineIndexes(tokens: Token[]): number[] {
  const out: number[] = [];
  let line = 0;
  for (const tok of tokens) {
    out.push(line);
    if (tok.kind === "space") line += (tok.value.match(/\n/g) ?? []).length;
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
  /** Token index of the word being spoken (read-along). Only engines with word boundaries ever set it. */
  speakingToken?: number | null;
  onWordTap: (token: Token) => void;
  className?: string;
}

/**
 * Tokenized page text. Every word is a real button (keyboard and screen readers); sentences are wrapped so listening can
 * highlight one, and the word being spoken gets a soft marker with an indigo underline (no layout shift). Taps that
 * land near a word rather than on it are resolved by the reading surface (see nearestWord.ts).
 */
function ReaderTextImpl({ tokens, tappedIndex, savedWords, readingSentence, speakingToken = null, onWordTap, className }: ReaderTextProps) {
  const lines = useMemo(() => lineIndexes(tokens), [tokens]);
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
          className={cn("box-decoration-clone", readingSentence === g.sentence && (speakingToken !== null ? "bg-marker/20" : "bg-marker/35"))}
        >
          {chunks(g.tokens).map((chunk) =>
            chunk[0].kind === "space" ? (
              chunk[0].value
            ) : (
              // Punctuation stays glued to its word, so a line never starts with a stray "." or ends on a lone quote.
              <span key={chunk[0].index} data-line={lines[chunk[0].index]} className="whitespace-nowrap">
                {chunk.map((tok) => {
                  if (tok.kind !== "word") return tok.value;
                  const isSaved = savedWords.has(normalizeWord(tok.value));
                  const state = tok.index === tappedIndex ? "tapped" : isSaved ? "saved" : undefined;
                  return (
                    <button
                      key={tok.index}
                      type="button"
                      data-token-index={tok.index}
                      data-state={state}
                      data-saved={isSaved ? "true" : undefined}
                      data-speaking={tok.index === speakingToken ? "true" : undefined}
                      aria-label={tok.value}
                      aria-pressed={state === "tapped" ? true : undefined}
                      onClick={() => onWordTap(tok)}
                      className="word-mark relative inline-block cursor-pointer align-baseline text-inherit outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring data-[speaking=true]:bg-marker data-[speaking=true]:after:pointer-events-none data-[speaking=true]:after:absolute data-[speaking=true]:after:inset-x-0.5 data-[speaking=true]:after:-bottom-px data-[speaking=true]:after:h-[3px] data-[speaking=true]:after:rounded-full data-[speaking=true]:after:bg-indigo data-[speaking=true]:after:content-['']"
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
