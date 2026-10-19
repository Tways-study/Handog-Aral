"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, ImagePlus, Keyboard, ScanLine, Sparkles, Square, Volume2, WifiOff } from "lucide-react";
import CameraScanner from "@/components/CameraScanner";
import Mascot from "@/components/Mascot";
import ReaderText from "@/components/ReaderText";
import WordPanel from "@/components/WordPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { sampleBooks } from "@/data/books";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { normalizeWord } from "@/lib/dictionary/normalize";
import { useMotion } from "@/lib/motion";
import { findSentence, tokenize, type Token } from "@/lib/tokenize";
import { speak, stop } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { forgetWord, learnWord } from "@/lib/vocabulary";
import type { ResolvedExplanation } from "@/shared/schemas";
import { useProgress } from "@/stores/progress";
import { useSettings } from "@/stores/settings";
import { ocrErrorKey } from "./errors";
import { useScanJob } from "./useScanJob";
import { useWordLookup } from "./useWordLookup";

export const DESKTOP_QUERY = "(min-width: 1024px)";

export default function ReaderScreen({ bookId }: { bookId?: string }) {
  const t = useT();
  const s = t.scan;
  const language = useSettings((x) => x.language);
  const ttsSpeed = useSettings((x) => x.ttsSpeed);
  const colorOverlay = useSettings((x) => x.colorOverlay);
  const setCurrentBookId = useProgress((x) => x.setCurrentBookId);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const saved = useSavedWords();
  const { markWord, enterPanel } = useMotion();

  const book = useMemo(() => (bookId ? (sampleBooks.find((b) => b.id === bookId) ?? null) : null), [bookId]);
  const scan = useScanJob();
  const { state: lookupState, lookup, clear: clearLookup } = useWordLookup(language);

  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [readingSentence, setReadingSentence] = useState<number | null>(null);
  const [wordSpeaking, setWordSpeaking] = useState(false);

  const textRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const runRef = useRef(0);
  const wordRunRef = useRef(0);
  const lastTapRef = useRef<number | null>(null);

  const text = book ? book.text : typed || scan.state.text;
  const tokens = useMemo(() => tokenize(text), [text]);
  const scanned = !book && !!text;

  useEffect(() => {
    if (bookId) setCurrentBookId(bookId);
  }, [bookId, setCurrentBookId]);

  useEffect(
    () => () => {
      runRef.current++;
      void stop();
    },
    [],
  );

  const savedSet = useMemo(() => new Set((saved ?? []).map((w) => normalizeWord(w.word))), [saved]);

  // Marker sweep on the tapped word.
  const tappedIndex = lookupState?.tokenIndex ?? null;
  useEffect(() => {
    if (tappedIndex === null) return;
    const el = textRef.current?.querySelector<HTMLElement>(`[data-token-index="${tappedIndex}"]`);
    return markWord(el);
  }, [tappedIndex, markWord]);

  // The docked panel arrives once, when the first word is chosen.
  const hasSelection = lookupState !== null;
  useEffect(() => {
    if (isDesktop && hasSelection) return enterPanel(panelRef.current, { from: "right" });
  }, [isDesktop, hasSelection, enterPanel]);

  const stopListening = useCallback(() => {
    runRef.current++;
    setListening(false);
    setReadingSentence(null);
    void stop();
  }, []);

  const toggleListen = () => {
    if (listening) return stopListening();
    const run = ++runRef.current;
    setListening(true);
    void speak(text, {
      rate: ttsSpeed,
      onSentence: (i) => {
        if (run !== runRef.current) return;
        setReadingSentence(i);
        const el = textRef.current?.querySelector<HTMLElement>(`[data-sentence="${i}"]`);
        el?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      },
    }).finally(() => {
      if (run !== runRef.current) return;
      setListening(false);
      setReadingSentence(null);
    });
  };

  const onWordTap = (token: Token) => {
    lastTapRef.current = token.index;
    setSheetOpen(true);
    void lookup(token.value, findSentence(tokens, token.index), token.index);
  };

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

  const speakWord = () => {
    if (!entry) return;
    const run = ++wordRunRef.current;
    setWordSpeaking(true);
    void speak(entry.word, { rate: ttsSpeed }).finally(() => {
      if (run === wordRunRef.current) setWordSpeaking(false);
    });
  };

  const panelNode = entry && (
    <WordPanel
      entry={entry}
      saved={entrySaved}
      pending={lookupState?.pending}
      speaking={wordSpeaking}
      onSpeak={speakWord}
      onSave={() => void learnWord(entry, book ? book.id : null)}
      onRemove={() => void forgetWord(entry.word)}
    />
  );

  const resetForNewText = () => {
    stopListening();
    clearLookup();
    setSheetOpen(false);
    setTyped("");
    setDraft("");
    scan.reset();
    setCurrentBookId(null);
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    setShowCamera(false);
    stopListening();
    clearLookup();
    void scan.start(file);
  };

  const errKey = ocrErrorKey(scan.state.error);
  const overlayClass = colorOverlay !== "none" ? `overlay-${colorOverlay}` : "";

  // ---- start / scanning (no text yet) ----
  if (!text) {
    const scanning = scan.state.status === "scanning";
    return (
      <div className="mx-auto w-full max-w-[var(--content-max)] pb-nav">
        <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 lg:px-8 lg:pt-8">
          <h1 className="font-heading text-2xl leading-[1.1] font-bold lg:text-4xl">{s.title}</h1>
          <p className="mt-1 text-[0.9375rem] text-ink-2 lg:text-base">{s.startPrompt}</p>
        </header>
        <div className={cn("pad mx-5 min-h-[22rem] rounded-xl border-[1.5px] border-line py-6 lg:mx-8", overlayClass)}>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              handleFile(f);
            }}
          />
          <div aria-live="polite" className="pad-line">
            {scan.state.status === "error" && errKey && (
              <span role="alert" className="font-bold">
                {s[errKey]}{" "}
                {errKey === "errorOfflinePack" && (
                  <Link href="/settings" className="underline underline-offset-4">
                    {s.openSettings}
                  </Link>
                )}
              </span>
            )}
          </div>
          {scanning ? (
            <div className="pad-line flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <Mascot mood="think" size={56} />
                <p className="text-lg font-bold" role="status">
                  {s.scanning}
                </p>
              </div>
              <Progress value={scan.state.progress} aria-label={s.scanning} className="max-w-sm" />
              <p className="text-sm text-ink-2">{s.scanningPercent(scan.state.progress)}</p>
              <Button type="button" variant="secondary" className="w-fit" onClick={scan.cancel}>
                {s.cancel}
              </Button>
            </div>
          ) : typing ? (
            <form
              className="pad-line flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) setTyped(draft.trim());
              }}
            >
              <Label htmlFor="reader-draft" className="text-base font-bold">
                {s.typeLabel}
              </Label>
              <textarea
                id="reader-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={s.typePlaceholder}
                rows={8}
                className="w-full resize-none rounded-lg border-[1.5px] border-line bg-paper p-3 text-xl leading-normal outline-none placeholder:text-ink-2 focus-visible:outline-3 focus-visible:outline-ring"
              />
              <div className="flex flex-wrap gap-2.5">
                <Button type="submit" size="lg" disabled={!draft.trim()}>
                  {s.showText}
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={() => setTyping(false)}>
                  {s.cancel}
                </Button>
              </div>
            </form>
          ) : (
            <div className="pad-line flex flex-col gap-3 pt-2">
              <Mascot mood="idle" size={72} />
              <Button type="button" size="xl" className="w-full max-w-sm" onClick={() => setShowCamera(true)}>
                <Camera aria-hidden="true" />
                {s.openCamera}
              </Button>
              <div className="flex flex-wrap gap-2.5">
                <Button type="button" size="lg" variant="secondary" onClick={() => galleryRef.current?.click()}>
                  <ImagePlus aria-hidden="true" />
                  {s.pickGallery}
                </Button>
                <Button type="button" size="lg" variant="secondary" onClick={() => setTyping(true)}>
                  <Keyboard aria-hidden="true" />
                  {s.typeText}
                </Button>
              </div>
            </div>
          )}
        </div>
        {showCamera && <CameraScanner onCapture={handleFile} onClose={() => setShowCamera(false)} />}
      </div>
    );
  }

  // ---- reading ----
  const title = book ? book.title : s.pageTitle;
  const backHref = book ? "/books" : "/";
  const listenLabel = listening ? s.stopListen : isDesktop ? s.listen : s.listenShort;
  const ListenIcon = listening ? Square : Volume2;

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_25rem]">
      <section className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b-[1.5px] border-line bg-paper px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 lg:static lg:px-8 lg:py-4">
          {!isDesktop && (
            <Button asChild variant="ghost" size="icon">
              <Link href={backHref} aria-label={s.back}>
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-lg leading-tight font-bold lg:text-2xl">{title}</h1>
            <p className="truncate text-sm text-ink-2">{s.tapHint}</p>
          </div>
          {isDesktop ? (
            <>
              <Button type="button" variant="ink" onClick={toggleListen} aria-pressed={listening}>
                <ListenIcon aria-hidden="true" />
                {listenLabel}
              </Button>
              {book ? (
                <Button asChild variant="secondary">
                  <Link href="/scan">
                    <ScanLine aria-hidden="true" />
                    {s.newPage}
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetForNewText();
                    setShowCamera(true);
                  }}
                >
                  <ScanLine aria-hidden="true" />
                  {s.newPage}
                </Button>
              )}
            </>
          ) : (
            <Button type="button" variant="ink" size="icon" onClick={toggleListen} aria-pressed={listening} aria-label={listenLabel}>
              <ListenIcon aria-hidden="true" />
            </Button>
          )}
        </header>

        <div className={cn("pad flex-1 pb-nav", overlayClass)}>
          {scanned && scan.state.source && (
            <div className="pad-line flex items-center" aria-live="polite">
              <span className="sr-only">{s.scanDone}</span>
              <Badge variant="outline">
                {scan.state.source === "ai" ? <Sparkles aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
                {scan.state.source === "ai" ? s.sourceAi : s.sourceOffline}
              </Badge>
            </div>
          )}
          <div ref={textRef} className="pad-text pt-[calc(var(--pitch)*0.5-0.2rem)] lg:max-w-[calc(64ch+var(--pad-gutter)+1.25rem)]">
            <ReaderText tokens={tokens} tappedIndex={tappedIndex} savedWords={savedSet} readingSentence={readingSentence} onWordTap={onWordTap} />
          </div>
          {scanned && (
            <div className="pad-line mt-4 flex flex-wrap items-center gap-2.5">
              {scan.state.source && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetForNewText();
                    setShowCamera(true);
                  }}
                >
                  <Camera aria-hidden="true" />
                  {s.rescan}
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForNewText();
                  setTyping(true);
                }}
              >
                <Keyboard aria-hidden="true" />
                {s.newText}
              </Button>
            </div>
          )}
        </div>
      </section>

      {isDesktop && (
        <aside aria-label={t.popup.translationLabel} className="border-l-[1.5px] border-line bg-paper lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
          <div ref={panelRef} className="p-7">
            {panelNode ?? (
              <div className="flex flex-col items-center gap-3 pt-16 text-center">
                <Mascot mood="think" size={96} />
                <h2 className="font-heading text-2xl font-bold">{s.emptyPanelTitle}</h2>
                <p className="max-w-[16rem] text-base text-ink-2">{s.emptyPanelBody}</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {!isDesktop && (
        <Drawer open={sheetOpen && !!panelNode} onOpenChange={setSheetOpen}>
          <DrawerContent
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              const i = lastTapRef.current;
              if (i !== null) textRef.current?.querySelector<HTMLElement>(`[data-token-index="${i}"]`)?.focus();
            }}
          >
            <DrawerTitle className="sr-only">{t.popup.sheetTitle(entry?.word ?? "")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t.popup.sheetTitle(entry?.word ?? "")}</DrawerDescription>
            <div className="max-h-[75dvh] overflow-y-auto px-5 pt-3 pb-6" data-vaul-no-drag>
              {panelNode}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {showCamera && <CameraScanner onCapture={handleFile} onClose={() => setShowCamera(false)} />}
    </div>
  );
}
