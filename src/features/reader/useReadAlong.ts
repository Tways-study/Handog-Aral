"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { speak, speechLang, stop } from "@/lib/tts";
import { useSettings } from "@/stores/settings";
import type { Token } from "@/lib/tokenize";
import { useRewards } from "@/stores/rewards";

/**
 * Listening to the page: sentence by sentence everywhere, and word by word where the engine reports Web Speech
 * `boundary` events. `speakingToken` is only ever set by word boundaries, so an engine without them (native TTS)
 * simply keeps the sentence highlight.
 */
export function useReadAlong({ text, tokens, rate, textRef }: { text: string; tokens: Token[]; rate: number; textRef: RefObject<HTMLElement | null> }) {
  const [listening, setListening] = useState(false);
  const [readingSentence, setReadingSentence] = useState<number | null>(null);
  const [speakingToken, setSpeakingToken] = useState<number | null>(null);
  const runRef = useRef(0);
  const wordTokens = useMemo(() => tokens.filter((t) => t.kind === "word").map((t) => t.index), [tokens]);

  const halt = useCallback(() => {
    runRef.current++;
    setListening(false);
    setReadingSentence(null);
    setSpeakingToken(null);
    void stop();
  }, []);

  const start = useCallback(() => {
    const run = ++runRef.current;
    setListening(true);
    // The first time a child listens, once ever, the rewards engine hears about it.
    useRewards.getState().recordEvent({ type: "listen" });
    void speak(text, {
      rate,
      lang: speechLang(useSettings.getState().language),
      onSentence: (i) => {
        if (run !== runRef.current) return;
        setReadingSentence(i);
        setSpeakingToken(null);
        const el = textRef.current?.querySelector<HTMLElement>(`[data-sentence="${i}"]`);
        el?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      },
      onWord: (ordinal) => {
        if (run !== runRef.current) return;
        const index = wordTokens[ordinal];
        if (index !== undefined) setSpeakingToken(index);
      },
    }).finally(() => {
      if (run !== runRef.current) return;
      setListening(false);
      setReadingSentence(null);
      setSpeakingToken(null);
    });
  }, [text, rate, textRef, wordTokens]);

  const toggle = useCallback(() => (listening ? halt() : start()), [listening, halt, start]);

  // Leaving the page (or swapping the text) stops the voice.
  useEffect(
    () => () => {
      runRef.current++;
      void stop();
    },
    [],
  );

  return { listening, readingSentence, speakingToken, toggle, halt };
}
