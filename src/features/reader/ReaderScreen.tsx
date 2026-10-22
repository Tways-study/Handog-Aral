"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Keyboard, ScanLine, Sparkles, Square, Volume2, WifiOff } from "lucide-react";
import CameraScanner from "@/components/CameraScanner";
import ReaderText from "@/components/ReaderText";
import WordPanel from "@/components/WordPanel";
import Owl, { type OwlMood, type OwlReaction } from "@/components/owl/Owl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sampleBooks } from "@/data/books";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { normalizeWord } from "@/lib/dictionary/normalize";
import { buzz } from "@/lib/haptics";
import { motionAllowed, useMotion } from "@/lib/motion";
import { flyToTab, lineDevelop, type LineGroup } from "@/lib/motionReader";
import { play } from "@/lib/sound";
import { findSentence, tokenize, type Token } from "@/lib/tokenize";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { forgetWord, learnWord, recordSaveRewards } from "@/lib/vocabulary";
import type { ResolvedExplanation } from "@/shared/schemas";
import { useMoments } from "@/stores/moments";
import { useProgress } from "@/stores/progress";
import { useRewards } from "@/stores/rewards";
import { useSettings } from "@/stores/settings";
import { ocrErrorKey } from "./errors";
import { wordFromSurfaceClick } from "./nearestWord";
import OwlTag from "./OwlTag";
import { PaneOwl, PeekOwl } from "./ReaderOwl";
import SaveStamp, { type StampSpot } from "./SaveStamp";
import { ScanProgress, ScanTiles } from "./ScanStart";
import { useReadAlong } from "./useReadAlong";
import { useScanJob } from "./useScanJob";
import { useWordLookup } from "./useWordLookup";
import WordSheet, { type SheetMoment } from "./WordSheet";

export const DESKTOP_QUERY = "(min-width: 1024px)";

/** The nav tab for a destination: whichever of the bottom bar / rail links is actually on screen. */
function visibleTab(href: string): HTMLElement | null {
  const links = Array.from(document.querySelectorAll<HTMLElement>(`a[href^="${href}"]`));
  return links.find((a) => a.getBoundingClientRect().width > 0) ?? null;
}

function popTab(tab: "home" | "books" | "words" | "quiz") {
  window.dispatchEvent(new CustomEvent("handog:pop-tab", { detail: tab }));
}

/** Lines of the page for the "develop" reveal: source lines, or sentences when a scan came back as one block. */
function developGroups(root: HTMLElement | null): LineGroup[] {
  if (!root) return [];
  const byLine = new Map<string, Element[]>();
  root.querySelectorAll("[data-line]").forEach((el) => {
    const k = el.getAttribute("data-line") ?? "0";
    byLine.set(k, [...(byLine.get(k) ?? []), el]);
  });
  if (byLine.size >= 3) return Array.from(byLine.values());
  const sentences = Array.from(root.querySelectorAll("[data-sentence]"));
  return sentences.length > byLine.size ? sentences : Array.from(byLine.values());
}

export default function ReaderScreen({ bookId }: { bookId?: string }) {
  const t = useT();
  const s = t.scan;
  const p = t.popup;
  const language = useSettings((x) => x.language);
  const ttsSpeed = useSettings((x) => x.ttsSpeed);
  const colorOverlay = useSettings((x) => x.colorOverlay);
  const dyslexia = useSettings((x) => x.dyslexiaFont);
  const setCurrentBookId = useProgress((x) => x.setCurrentBookId);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const saved = useSavedWords();
  const { markWord, enterPanel } = useMotion();

  const book = useMemo(() => (bookId ? (sampleBooks.find((b) => b.id === bookId) ?? null) : null), [bookId]);
  const scan = useScanJob({ onDone: (r) => onScanDone(r) });
  const { state: lookupState, lookup, clear: clearLookup } = useWordLookup(language);

  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wordSpeaking, setWordSpeaking] = useState(false);
  const [moment, setMoment] = useState<SheetMoment | null>(null);
  const [reaction, setReaction] = useState<OwlReaction | undefined>(undefined);
  const [emphasize, setEmphasize] = useState(false);
  const [stamp, setStamp] = useState<StampSpot | null>(null);
  const [scanLine, setScanLine] = useState<{ text: string; mood: OwlMood } | null>(null);

  const textRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const wordRunRef = useRef(0);
  const lastTapRef = useRef<number | null>(null);
  const keyRef = useRef(10);
  const momentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledScan = useRef<unknown>(null);
  const clearStamp = useCallback(() => setStamp(null), [setStamp]);

  const text = book ? book.text : typed || scan.state.text;
  const tokens = useMemo(() => tokenize(text), [text]);
  const scanned = !book && !!text;
  const { listening, readingSentence, speakingToken, toggle: toggleListen, halt: stopListening } = useReadAlong({ text, tokens, rate: ttsSpeed, textRef });

  useEffect(() => {
    if (bookId) setCurrentBookId(bookId);
  }, [bookId, setCurrentBookId]);

  // Opening a bundled book counts toward "opened every book" (the rewards engine ignores repeats).
  useEffect(() => {
    if (bookId && book) useRewards.getState().recordEvent({ type: "book-opened", bookId });
  }, [bookId, book]);

  useEffect(
    () => () => {
      if (momentTimer.current) clearTimeout(momentTimer.current);
    },
    [],
  );

  const savedSet = useMemo(() => new Set((saved ?? []).map((w) => normalizeWord(w.word))), [saved]);
  const pageSavedCount = useMemo(() => {
    const seen = new Set<string>();
    for (const tok of tokens) {
      if (tok.kind !== "word") continue;
      const n = normalizeWord(tok.value);
      if (savedSet.has(n)) seen.add(n);
    }
    return seen.size;
  }, [tokens, savedSet]);

  /** The owl reacts for a moment: its tag text, its mood, and one reaction. Desktop shows it in the pane, mobile on the sheet. */
  const showMoment = (text: string, mood: OwlMood, ms: number, tagDelay = 0) => {
    if (momentTimer.current) clearTimeout(momentTimer.current);
    const key = ++keyRef.current;
    // `tagDelay`: the owl pops at once but its words wait (the big stamp is landing and must not be talked over).
    setMoment({ key, text: tagDelay ? "" : text, mood });
    setReaction({ kind: mood === "cheer" ? "cheer" : "hop", key });
    if (tagDelay) setTimeout(() => setMoment((m) => (m && m.key === key ? { ...m, text } : m)), tagDelay);
    momentTimer.current = setTimeout(() => setMoment(null), ms + tagDelay);
  };

  /** A scan just came back: whoosh, the owl cheers, the child is told once, and a moment later the rewards engine hears about it. */
  const onScanDone = (result: { text: string; source: "ai" | "offline" }) => {
    if (!result.text.trim()) return;
    play("whoosh");
    const first = useMoments.getState().claim("scanRead");
    if (first) {
      setScanLine({ text: s.scanRead, mood: "cheer" });
      showMoment(s.scanRead, "cheer", 2600);
    } else {
      setScanLine({ text: s.tapHint, mood: "cheer" });
      setReaction({ kind: "cheer", key: ++keyRef.current });
    }
    setTimeout(() => setScanLine((cur) => (cur ? { text: s.tapHint, mood: "idle" } : cur)), first ? 2600 : 1600);
    // Not cancelled on purpose: leaving the page must not lose the child's first-scan sticker.
    setTimeout(() => useRewards.getState().recordEvent({ type: "scan-done" }), 1300);
  };

  // Desktop: the pane owl waves once after the page loads.
  useEffect(() => {
    if (!isDesktop) return;
    const id = setTimeout(() => setReaction({ kind: "wave", key: 1 }), 900);
    return () => clearTimeout(id);
  }, [isDesktop]);

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

  // A fresh scan: the text develops onto the ruled paper line by line (before paint, so it never flashes), the owl
  // cheers, and a moment later the rewards engine hears about it so a sticker dialog does not cover the reveal.
  const scanState = scan.state;
  useLayoutEffect(() => {
    if (scanState.status !== "done" || !scanState.text || handledScan.current === scanState) return;
    handledScan.current = scanState;
    return lineDevelop(developGroups(textRef.current));
  }, [scanState]);
  /** Keep the tapped word above the sheet: a word in the lower half would otherwise end up hidden behind it. */
  const bringWordClear = (el: HTMLElement | null) => {
    if (!el || isDesktop) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
    if (r.bottom > vh * 0.46 || r.top < headerBottom + 8) {
      window.scrollBy({ top: r.top - Math.max(vh * 0.26, headerBottom + 24), behavior: motionAllowed() ? "smooth" : "auto" });
    }
  };

  const onWordTap = (token: Token) => {
    lastTapRef.current = token.index;
    bringWordClear(textRef.current?.querySelector<HTMLElement>(`[data-token-index="${token.index}"]`) ?? null);
    // The very first word this child ever taps: the owl says so, the well glows once.
    if (useMoments.getState().claim("firstTap")) {
      play("pop");
      showMoment(p.firstTap, "cheer", 1800);
      setEmphasize(true);
      setTimeout(() => setEmphasize(false), 1800);
    }
    setSheetOpen(true);
    void lookup(token.value, findSentence(tokens, token.index), token.index);
  };

  // Taps that land near a word, not on it, choose the nearest word within ~24 px. Real controls keep their own taps.
  const onSurfaceClick = (e: MouseEvent<HTMLElement>) => {
    const idx = wordFromSurfaceClick(e, e.currentTarget);
    const tok = idx === null ? undefined : tokens[idx];
    if (tok && tok.kind === "word") onWordTap(tok);
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
    useRewards.getState().recordEvent({ type: "listen" });
    void speak(entry.word, { rate: ttsSpeed }).finally(() => {
      if (run === wordRunRef.current) setWordSpeaking(false);
    });
  };

  /** Save: the stamp lands on the word, a star flies to the Pulong tab, then the rewards engine is told. */
  const saveEntry = async () => {
    if (!entry) return;
    const forBook = book ? book.id : null;
    const first = useMoments.getState().claim("firstSave"); // before the save, while the child still has no history
    const result = await learnWord(entry, forBook);
    const el = lastTapRef.current === null ? null : textRef.current?.querySelector<HTMLElement>(`[data-token-index="${lastTapRef.current}"]`);
    const box = el?.getBoundingClientRect();
    if (box) setStamp({ key: ++keyRef.current, left: box.left, top: box.top, width: box.width, height: box.height });
    play("stamp");
    buzz("success");
    if (first) showMoment(p.firstSave, "cheer", 2200, 1000);
    setTimeout(() => {
      flyToTab(box ?? null, visibleTab("/words"), { onArrive: () => popTab("words") });
    }, 650);
    // After the stamp and the flight, so a sticker dialog never lands on top of them.
    setTimeout(() => recordSaveRewards(entry, forBook, result), 1400);
  };

  const panelNode = entry && (
    <WordPanel
      entry={entry}
      saved={entrySaved}
      pending={lookupState?.pending}
      speaking={wordSpeaking}
      emphasize={emphasize}
      onSpeak={speakWord}
      onSave={() => void saveEntry()}
      onRemove={() => void forgetWord(entry.word)}
    />
  );

  const resetForNewText = () => {
    stopListening();
    clearLookup();
    setSheetOpen(false);
    setTyped("");
    setDraft("");
    setScanLine(null);
    handledScan.current = null;
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
    const hasError = scan.state.status === "error" && !!errKey;
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
            {hasError && (
              <span role="alert" className="font-bold [overflow-wrap:anywhere]">
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
            <ScanProgress progress={scan.state.progress} onCancel={scan.cancel} />
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
                className="w-full resize-none rounded-lg border-[1.5px] border-line bg-paper p-3 text-xl leading-normal outline-none placeholder:text-ink-2 focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring"
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
            <ScanTiles
              onCamera={() => setShowCamera(true)}
              onGallery={() => galleryRef.current?.click()}
              onType={() => setTyping(true)}
            />
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
  const paneTag = moment?.text || (pageSavedCount > 0 ? s.owlPageSaved(pageSavedCount) : ((scanned && scanLine?.text) || s.owlHello));
  const peekTag = pageSavedCount > 0 ? s.owlPageSaved(pageSavedCount) : s.owlHello;

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_25rem]">
      <section className="flex min-w-0 flex-1 flex-col">
        <header
          ref={headerRef}
          className="sticky top-0 z-30 flex items-center gap-2.5 border-b-[1.5px] border-line bg-paper px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 lg:static lg:px-8 lg:py-4"
        >
          {!isDesktop && (
            <Button asChild variant="ghost" size="icon">
              <Link href={backHref} aria-label={s.back}>
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-2 font-heading text-lg leading-tight font-bold [overflow-wrap:anywhere] lg:text-2xl">{title}</h1>
            <p className="line-clamp-2 text-sm leading-snug text-ink-2">{s.tapHint}</p>
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

        {/* The reading surface: a tap near a word (between words, between lines) picks the nearest word. */}
        <div
          className={cn("pad flex-1 shadow-none pb-[calc(var(--nav-h)+env(safe-area-inset-bottom,0px)+5.5rem)] lg:pb-8", overlayClass)}
          onClick={onSurfaceClick}
          data-slot="reading-surface"
        >
          <div ref={contentRef}>
            {scanned && scan.state.source && (
              <div className="pad-line flex items-center" aria-live="polite">
                <span className="sr-only">{s.scanDone}</span>
                <Badge variant="outline">
                  {scan.state.source === "ai" ? <Sparkles aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
                  {scan.state.source === "ai" ? s.sourceAi : s.sourceOffline}
                </Badge>
              </div>
            )}
            {scanned && scanLine && !isDesktop && (
              <div className="flex h-[calc(var(--pitch)*2)] items-center gap-2 pl-[calc(var(--pad-gutter)-0.5rem)] pr-5" data-slot="scan-moment">
                <Owl mood={scanLine.mood} size={64} reaction={reaction} className="-mb-2" />
                <OwlTag tail="left" className="min-w-0 py-1.5 text-[0.9375rem] leading-snug font-bold" role="status">
                  {scanLine.text}
                </OwlTag>
              </div>
            )}
            <div
              ref={textRef}
              className={cn("pad-text pt-[calc(var(--pitch)*0.22)] lg:max-w-[calc(64ch+var(--pad-gutter)+1.25rem)]", dyslexia && "max-sm:[word-spacing:0.2em]")}
            >
              <ReaderText
                tokens={tokens}
                tappedIndex={tappedIndex}
                savedWords={savedSet}
                readingSentence={readingSentence}
                speakingToken={speakingToken}
                onWordTap={onWordTap}
              />
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
        </div>
      </section>

      {isDesktop && (
        <aside aria-label={t.popup.translationLabel} className="border-l-[1.5px] border-line bg-paper lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
          <div className="px-7 pt-6">
            <PaneOwl tag={paneTag} mood={moment?.mood ?? "idle"} reaction={reaction} />
          </div>
          <div ref={panelRef} className="p-7 pt-5">
            {panelNode ?? (
              <div data-slot="empty-panel" className="px-2 py-8 text-center">
                <h2 className="font-heading text-2xl font-bold">{s.emptyPanelTitle}</h2>
                <p className="mx-auto mt-2 max-w-[16rem] text-base text-ink-2">{s.emptyPanelBody}</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {!isDesktop && (
        <>
          <PeekOwl contentRef={contentRef} hidden={sheetOpen} tag={peekTag} />
          <WordSheet
            open={sheetOpen && !!panelNode}
            onOpenChange={setSheetOpen}
            title={t.popup.sheetTitle(entry?.word ?? "")}
            moment={moment}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              const i = lastTapRef.current;
              if (i !== null) textRef.current?.querySelector<HTMLElement>(`[data-token-index="${i}"]`)?.focus();
            }}
          >
            {panelNode}
          </WordSheet>
        </>
      )}

      <SaveStamp spot={stamp} onDone={clearStamp} />
      {showCamera && <CameraScanner onCapture={handleFile} onClose={() => setShowCamera(false)} />}
    </div>
  );
}
