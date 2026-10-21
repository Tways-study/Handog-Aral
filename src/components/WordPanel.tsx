"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookmarkPlus, Info, Sparkles, Volume2, WifiOff } from "lucide-react";
import DifficultyStamp from "@/components/DifficultyStamp";
import StampCheck from "@/components/StampCheck";
import StampStar from "@/components/StampStar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/hooks/useT";
import { useMotion } from "@/lib/motion";
import { pulseOnce } from "@/lib/motionReader";
import { realEnglish, realPhonetic } from "@/lib/phonetic";
import { cn } from "@/lib/utils";
import type { ResolvedExplanation } from "@/shared/schemas";

/**
 * Word explanation, shared by the reader (drawer below lg, docked column at lg+) and the vocabulary
 * list. It owns no data fetching and no container: callers wrap it in a Drawer / docked column.
 * Home-language explanation leads. Blocks reserve a minimum height only for a word whose content could still
 * change in place (a pending lookup, or an `offline` entry awaiting its upgrade, and the settled
 * entry that replaces it) so that swap never shifts the layout; any other entry sizes to its content.
 */
export interface WordPanelProps {
  entry: ResolvedExplanation;
  /** Whether the word is in the child's saved vocabulary. */
  saved: boolean;
  onSave: () => void;
  onRemove: () => void;
  onSpeak: () => void;
  speaking?: boolean;
  /** True while a better explanation is being fetched; the layout must not shift when it arrives. */
  pending?: boolean;
  /** The first-ever tap: the home-language well glows and pulses once so the child sees where the meaning is. */
  emphasize?: boolean;
}

/** Splits `text` around the first whole-word match of `word` so it can be marked. */
function markWordIn(text: string, word: string): ReactNode {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^\\p{L}])(${esc})(?![\\p{L}])`, "iu").exec(text);
  if (!m) return text;
  const start = m.index + m[1].length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-marker px-0.5 text-ink">{m[2]}</mark>
      {text.slice(start + m[2].length)}
    </>
  );
}

export default function WordPanel({ entry, saved, onSave, onRemove, onSpeak, speaking = false, pending = false, emphasize = false }: WordPanelProps) {
  const t = useT();
  const { stampIn } = useMotion();
  const stampRef = useRef<HTMLSpanElement>(null);
  const saveIconRef = useRef<HTMLSpanElement>(null);
  const starRef = useRef<HTMLSpanElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const prevSource = useRef(entry.source);
  const prevSaved = useRef(saved);

  const loading = pending && !entry.translation;
  // An offline entry is provisional: its reserve is held for the word after the upgrade lands, so the
  // in-place swap to the settled entry never shrinks the panel. A plain pending lookup reserves only while pending.
  const [heldWord, setHeldWord] = useState<string | null>(null);
  const offline = entry.source === "offline";
  // (the reader's placeholder while a lookup is pending is also `offline`; that is covered by `pending`)
  if (offline && !pending && heldWord !== entry.word) setHeldWord(entry.word);
  const reserve = pending || offline || heldWord === entry.word;
  const phonetic = realPhonetic(entry.phonetic, entry.word);
  const english = realEnglish(entry.english);
  const showExample = !loading && !!entry.example;

  // An offline entry upgraded in place: a small stamp-in on the difficulty stamp, no layout change.
  useEffect(() => {
    const was = prevSource.current;
    prevSource.current = entry.source;
    if (was === "offline" && entry.source !== "offline") return stampIn(stampRef.current);
  }, [entry.source, stampIn]);

  useEffect(() => {
    if (emphasize) return pulseOnce(wellRef.current);
  }, [emphasize]);

  useEffect(() => {
    const was = prevSaved.current;
    prevSaved.current = saved;
    if (!was && saved) {
      const a = stampIn(starRef.current);
      const b = stampIn(saveIconRef.current);
      return () => (a(), b());
    }
  }, [saved, stampIn]);

  const p = t.popup;
  const sourceText =
    entry.source === "ai" ? p.sourceAi : entry.source === "curated" ? p.sourceCurated : entry.source === "dictionary" ? p.sourceDictionary : p.sourceOffline;
  const SourceIcon = entry.source === "ai" ? Sparkles : entry.source === "offline" ? WifiOff : Info;

  return (
    <div data-slot="word-panel" data-source={entry.source} data-pending={loading || undefined} data-reserve={reserve || undefined}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[min(2.25rem,9.5vw)] leading-none font-extrabold break-words [overflow-wrap:anywhere] lg:text-[2.75rem]">{entry.word}</h2>
          {(phonetic || reserve) && <p className={cn("mt-1 text-base text-ink-2 [overflow-wrap:anywhere]", reserve && "min-h-6")}>{phonetic}</p>}
          <div className={cn("mt-2", reserve && "min-h-[1.625rem]")}>
            {!loading && (
              <span ref={stampRef} className="inline-flex">
                <DifficultyStamp level={entry.difficulty} />
              </span>
            )}
          </div>
        </div>
        {saved && (
          <span ref={starRef} className="inline-flex shrink-0 self-center">
            <StampStar size={52} seed={entry.word.length} label={p.starEarned} />
          </span>
        )}
        <Button type="button" variant="ink" size="icon-lg" className="size-14" onClick={onSpeak} aria-label={`${p.speakBtn}: ${entry.word}`}>
          <Volume2 aria-hidden="true" />
        </Button>
      </div>

      <div
        ref={wellRef}
        data-slot="home-well"
        data-emphasis={emphasize || undefined}
        className={cn("mt-4 rounded-xl bg-paper-2 px-4 py-3.5 transition-colors duration-300", reserve && "min-h-[7rem]", emphasize && "bg-marker/45")}
      >
        <p className="text-[0.8125rem] font-bold text-ink-2">{p.translationLabel}</p>
        <p className="mt-1 text-xl leading-normal font-bold" lang={entry.language === "tagalog" ? "tl" : "hil"}>
          {loading ? <span className="font-normal text-ink-2">{p.pending}</span> : entry.translation}
        </p>
      </div>

      {(english || reserve) && (
        <div className={cn("mt-3 px-1", reserve && "min-h-[4.5rem]")}>
          {(english || loading) && <p className="text-[0.8125rem] font-bold text-ink-2">{p.englishLabel}</p>}
          {loading ? (
            <div className="mt-2 grid gap-2" data-slot="pending-lines">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : (
            <p className="mt-0.5 text-[1.0625rem] leading-relaxed">{english}</p>
          )}
        </div>
      )}

      {(showExample || reserve) && (
        <div
          className={cn(
            "mt-3 border-t-[1.5px] border-dashed px-1 pt-3 text-[1.0625rem] leading-relaxed text-ink-2",
            showExample ? "border-line" : "border-transparent",
            reserve && "min-h-[4.75rem]",
          )}
        >
          {showExample ? (
            markWordIn(entry.example!, entry.word)
          ) : loading ? (
            <div className="grid gap-2 pt-1" data-slot="pending-lines">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : null}
        </div>
      )}

      <div className={cn("mt-3 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-ink-2", reserve && "min-h-10")}>
        <SourceIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {loading ? (
          <span className="block flex-1 pt-1" data-slot="pending-lines">
            <Skeleton className="h-3 w-2/3" />
          </span>
        ) : (
          <span>{sourceText}</span>
        )}
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 mt-2 grid grid-cols-2 gap-2.5 bg-background px-5 pt-3 pb-6 lg:static lg:mx-0 lg:mt-4 lg:bg-transparent lg:p-0">
        <Button type="button" variant="secondary" size="lg" className="h-14" onClick={onSpeak} aria-busy={speaking}>
          <Volume2 aria-hidden="true" />
          {speaking ? p.speakingBtn : p.speakBtn}
        </Button>
        <Button
          type="button"
          size="lg"
          variant={saved ? "secondary" : "default"}
          className="h-14"
          aria-pressed={saved}
          onClick={saved ? onRemove : onSave}
          disabled={loading}
        >
          <span ref={saveIconRef} className="inline-flex">
            {saved ? <StampCheck size={26} seed={entry.word.length} /> : <BookmarkPlus aria-hidden="true" />}
          </span>
          {saved ? p.savedBtn : p.saveBtn}
        </Button>
      </div>
    </div>
  );
}
