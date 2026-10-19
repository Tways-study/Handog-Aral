"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BookmarkCheck, BookmarkPlus, Info, Sparkles, Volume2, WifiOff } from "lucide-react";
import DifficultyStamp from "@/components/DifficultyStamp";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import { useMotion } from "@/lib/motion";
import type { ResolvedExplanation } from "@/shared/schemas";

/**
 * Word explanation, shared by the reader (drawer below lg, docked column at lg+) and the vocabulary
 * list. It owns no data fetching and no container: callers wrap it in a Drawer / docked column.
 * Home-language explanation leads; blocks keep a minimum height so a pending lookup, or an offline
 * entry upgraded in place, never shifts the layout.
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

export default function WordPanel({ entry, saved, onSave, onRemove, onSpeak, speaking = false, pending = false }: WordPanelProps) {
  const t = useT();
  const { stampIn } = useMotion();
  const stampRef = useRef<HTMLSpanElement>(null);
  const saveIconRef = useRef<HTMLSpanElement>(null);
  const prevSource = useRef(entry.source);
  const prevSaved = useRef(saved);

  const loading = pending && !entry.translation;

  // An offline entry upgraded in place: a small stamp-in on the difficulty stamp, no layout change.
  useEffect(() => {
    const was = prevSource.current;
    prevSource.current = entry.source;
    if (was === "offline" && entry.source !== "offline") return stampIn(stampRef.current);
  }, [entry.source, stampIn]);

  useEffect(() => {
    const was = prevSaved.current;
    prevSaved.current = saved;
    if (!was && saved) return stampIn(saveIconRef.current);
  }, [saved, stampIn]);

  const p = t.popup;
  const sourceText =
    entry.source === "ai" ? p.sourceAi : entry.source === "curated" ? p.sourceCurated : entry.source === "dictionary" ? p.sourceDictionary : p.sourceOffline;
  const SourceIcon = entry.source === "ai" ? Sparkles : entry.source === "offline" ? WifiOff : Info;

  return (
    <div data-slot="word-panel" data-source={entry.source} data-pending={loading || undefined}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[2.25rem] leading-none font-extrabold break-words lg:text-[2.75rem]">{entry.word}</h2>
          <p className="mt-1 min-h-6 text-base text-ink-2">{entry.phonetic}</p>
          <div className="mt-2 min-h-[1.625rem]">
            {!loading && (
              <span ref={stampRef} className="inline-flex">
                <DifficultyStamp level={entry.difficulty} />
              </span>
            )}
          </div>
        </div>
        <Button type="button" variant="ink" size="icon-lg" className="size-14" onClick={onSpeak} aria-label={`${p.speakBtn}: ${entry.word}`}>
          <Volume2 aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-4 min-h-[6.5rem] rounded-xl bg-paper-2 px-4 py-3.5">
        <p className="text-[0.8125rem] font-bold text-ink-2">{p.translationLabel}</p>
        <p className="mt-1 text-xl leading-normal font-bold" lang={entry.language === "tagalog" ? "tl" : "hil"}>
          {loading ? <span className="font-normal text-ink-2">{p.pending}</span> : entry.translation}
        </p>
      </div>

      <div className="mt-3 min-h-[4.5rem] px-1">
        <p className="text-[0.8125rem] font-bold text-ink-2">{p.englishLabel}</p>
        <p className="mt-0.5 text-[1.0625rem] leading-relaxed">{loading ? "" : entry.english}</p>
      </div>

      <div className="mt-3 min-h-[4.75rem] border-t-[1.5px] border-dashed border-line px-1 pt-3 text-[1.0625rem] leading-relaxed text-ink-2">
        {!loading && entry.example ? markWordIn(entry.example, entry.word) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button type="button" variant="secondary" size="lg" className="h-14" onClick={onSpeak} aria-busy={speaking}>
          <Volume2 aria-hidden="true" />
          {speaking ? p.speakingBtn : p.speakBtn}
        </Button>
        <Button type="button" size="lg" className="h-14" aria-pressed={saved} onClick={saved ? onRemove : onSave} disabled={loading}>
          <span ref={saveIconRef} className="inline-flex">
            {saved ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
          </span>
          {saved ? p.savedBtn : p.saveBtn}
        </Button>
      </div>

      <p className="mt-3 flex min-h-10 items-start gap-1.5 text-[0.8125rem] leading-snug text-ink-2">
        <SourceIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{loading ? "" : sourceText}</span>
      </p>
    </div>
  );
}
