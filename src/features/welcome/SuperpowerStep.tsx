"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pointer } from "lucide-react";
import Owl, { type OwlReaction } from "@/components/owl/Owl";
import ReaderText from "@/components/ReaderText";
import WordPanel from "@/components/WordPanel";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { normalizeWord } from "@/lib/dictionary/normalize";
import { buzz } from "@/lib/haptics";
import { useMotion } from "@/lib/motion";
import { superpowerIn } from "@/lib/motionPages";
import { play } from "@/lib/sound";
import { findSentence, tokenize, type Token } from "@/lib/tokenize";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { forgetWord, learnWord } from "@/lib/vocabulary";
import type { ResolvedExplanation } from "@/shared/schemas";
import { useProgress } from "@/stores/progress";
import { useRewards } from "@/stores/rewards";
import { useSettings } from "@/stores/settings";
import { useWordLookup } from "@/features/reader/useWordLookup";
import SpeechTag from "@/features/home/SpeechTag";

/** Every word is in the curated dictionary (src/data/fallbackWords.ts), so the real explanation works offline. */
export const SUPERPOWER_SENTENCE = "The girl walked through the enormous, quiet forest.";

/** The first word of the sample sentence a six-year-old may not know. */
const NUDGE_WORD = "enormous";

const DESKTOP_QUERY = "(min-width: 1024px)";

type Stage = "start" | "tapped" | "saved";

/**
 * Step 2 of the welcome: the child's first superpower. A sentence on pad paper whose words are tappable
 * exactly like the Reader (same ReaderText, same lookup pipeline, same WordPanel), the owl cheers, and a
 * Save stamps the first word. Nothing here blocks: the continue button works from the start.
 */
export default function SuperpowerStep({ name, onDone, onSkip }: { name: string; onDone: () => void; onSkip: () => void }) {
  const t = useT();
  const w = t.welcome;
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const language = useSettings((s) => s.language);
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const saved = useSavedWords();
  const { markWord, popIn } = useMotion();
  const { state: lookupState, lookup } = useWordLookup(language);

  const rootRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const continueRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number | null>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [reaction, setReaction] = useState<OwlReaction | undefined>();

  const tokens = useMemo(() => tokenize(SUPERPOWER_SENTENCE), []);
  const savedSet = useMemo(() => new Set((saved ?? []).map((x) => normalizeWord(x.word))), [saved]);

  // One authored entrance; focus lands on the step's heading so keyboard and screen-reader users start here.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    return superpowerIn(rootRef.current);
  }, []);

  const tappedIndex = lookupState?.tokenIndex ?? null;
  useEffect(() => {
    if (tappedIndex === null) return;
    const el = textRef.current?.querySelector<HTMLElement>(`[data-token-index="${tappedIndex}"]`);
    return markWord(el);
  }, [tappedIndex, markWord]);

  // One gentle nudge on the first word a child is unlikely to know, only while nothing has been tapped (CSS plays it once and respects reduced motion).
  useEffect(() => {
    if (stage !== "start") return;
    const target = tokens.find((tok) => tok.kind === "word" && tok.value.toLowerCase() === NUDGE_WORD);
    const el = target && textRef.current?.querySelector<HTMLElement>(`[data-token-index="${target.index}"]`);
    el?.setAttribute("data-nudge", "true");
    return () => el?.removeAttribute("data-nudge");
  }, [stage, tokens]);

  // The continue button becomes the page's one orange the moment there is something to continue from.
  useEffect(() => {
    if (stage === "start") return;
    return popIn(continueRef.current);
  }, [stage, popIn]);

  const entry: ResolvedExplanation | null = lookupState
    ? (lookupState.entry ?? {
        word: normalizeWord(lookupState.word) || lookupState.word,
        phonetic: "",
        english: "",
        translation: "",
        emoji: "",
        difficulty: "easy",
        example: null,
        source: "offline",
        language,
      })
    : null;
  const entrySaved = entry ? savedSet.has(entry.word.toLowerCase()) : false;

  const cheer = () => setReaction({ kind: "cheer", key: Date.now() });

  const onWordTap = (token: Token) => {
    lastTapRef.current = token.index;
    setSheetOpen(true);
    void lookup(token.value, findSentence(tokens, token.index), token.index);
    setStage((s) => (s === "saved" ? s : "tapped"));
    cheer();
    play("pop");
    buzz("tap");
  };

  const speakWord = () => {
    if (!entry) return;
    setSpeaking(true);
    void speak(entry.word, { rate: ttsSpeed }).finally(() => setSpeaking(false));
    useRewards.getState().recordEvent({ type: "listen" });
  };

  const save = async () => {
    if (!entry) return;
    await learnWord(entry, null);
    // Close the sheet before the sticker celebration opens, so two overlays never stack.
    setSheetOpen(false);
    setStage("saved");
    cheer();
    play("stamp");
    buzz("success");
    useRewards.getState().recordEvent({
      type: "word-saved",
      total: Math.max(1, useProgress.getState().savedWordCount),
      difficulty: entry.difficulty,
    });
  };

  const panelNode = entry && (
    <WordPanel
      entry={entry}
      saved={entrySaved}
      pending={lookupState?.pending}
      speaking={speaking}
      onSpeak={speakWord}
      onSave={() => void save()}
      onRemove={() => void forgetWord(entry.word)}
    />
  );

  const line = stage === "saved" ? w.superSaved : stage === "tapped" ? w.superCheer : w.superPrompt;

  return (
    <div
      ref={rootRef}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-4xl lg:justify-center lg:py-10"
    >
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 ref={headingRef} tabIndex={-1} className="font-heading text-3xl leading-[1.05] font-extrabold outline-none lg:text-4xl">
            {w.superTitle}
          </h1>

          <div className="flex flex-1 flex-col justify-center gap-6 py-6 lg:flex-none lg:justify-start lg:gap-5 lg:py-0 lg:pt-5">
            <div className="flex items-end gap-2 lg:gap-4">
              <Owl
                priority="hero"
                size={isDesktop ? 148 : 136}
                mood={stage === "start" ? "idle" : "cheer"}
                reaction={reaction}
                className="mr-1 shrink-0"
              />
              <SpeechTag tail="left" className="mb-3 min-w-0 flex-1 px-4 py-3">
                <p aria-live="polite" className="text-[1.0625rem] leading-snug font-bold">
                  {stage === "start" && <span className="mb-0.5 block font-heading text-xl leading-tight">{t.welcome.owlHelloName(name)}</span>}
                  {line}
                </p>
              </SpeechTag>
            </div>

            <section
              aria-label={w.superPaperLabel}
              data-super-paper
              className="pad pt-0 pb-2 [--pad-text-size:1.5rem] [--pitch:2.875rem] lg:[--pad-text-size:1.625rem] lg:[--pitch:3.125rem]"
            >
              <div ref={textRef} className="pad-text">
                <ReaderText tokens={tokens} tappedIndex={tappedIndex} savedWords={savedSet} readingSentence={null} onWordTap={onWordTap} />
              </div>
            </section>

            <p data-slot="tap-hint" className="inline-flex min-h-[2.125rem] items-center gap-2 self-center rounded-full border-[1.5px] border-line bg-paper-2 px-3.5 text-[0.9375rem] font-bold">
              <Pointer aria-hidden="true" className="size-[1.125rem]" />
              {w.superHint}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-1 pt-2">
            <div ref={continueRef} data-super-rest>
              <Button
                type="button"
                size="xl"
                variant={stage === "start" ? "secondary" : "default"}
                className="w-full"
                onClick={onDone}
              >
                {w.superContinue}
              </Button>
            </div>
            <Button type="button" variant="link" className="self-center" data-super-rest onClick={onSkip}>
              {w.skip}
            </Button>
          </div>
        </div>

        {isDesktop && (
          <aside
            data-super-rest
            aria-label={t.popup.translationLabel}
            className={cn("min-h-[26rem] rounded-2xl border-[1.5px] bg-paper p-6", entry ? "border-line" : "grid place-items-center border-dashed border-line-strong")}
          >
            {panelNode ?? <Pointer aria-hidden="true" className="size-12 text-ink-2" strokeWidth={1.5} />}
          </aside>
        )}
      </div>

      {!isDesktop && (
        <Drawer open={sheetOpen && !!panelNode} onOpenChange={setSheetOpen} autoFocus>
          <DrawerContent
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              const i = lastTapRef.current;
              if (i !== null) textRef.current?.querySelector<HTMLElement>(`[data-token-index="${i}"]`)?.focus();
            }}
          >
            <DrawerTitle className="sr-only">{t.popup.sheetTitle(entry?.word ?? "")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t.popup.sheetTitle(entry?.word ?? "")}</DrawerDescription>
            <div className="max-h-[calc(60dvh-1rem)] overflow-y-auto overscroll-contain px-5 pt-3" data-vaul-no-drag>
              {panelNode}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
