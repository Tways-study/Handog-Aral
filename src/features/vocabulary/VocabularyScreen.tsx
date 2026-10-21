"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import DifficultyStamp, { StampShape } from "@/components/DifficultyStamp";
import EmptyPanelPrompt from "@/components/EmptyPanelPrompt";
import Mascot from "@/components/Mascot";
import PadSkeleton from "@/components/PadSkeleton";
import WordPanel from "@/components/WordPanel";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { MIN_QUIZ_WORDS } from "@/lib/quiz";
import { speak, stop } from "@/lib/tts";
import { forgetWord } from "@/lib/vocabulary";
import { useSettings } from "@/stores/settings";
import type { SavedWord } from "@/stores/db";
import { useDesktop } from "./useDesktop";

type Filter = "all" | "easy" | "medium" | "hard";
const LEVELS = ["easy", "medium", "hard"] as const;

export function filterWords(words: SavedWord[], query: string, filter: Filter): SavedWord[] {
  const q = query.trim().toLowerCase();
  return words.filter(
    (w) =>
      (filter === "all" || w.difficulty === filter) &&
      (!q || w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q) || w.english.toLowerCase().includes(q)),
  );
}

export default function VocabularyScreen() {
  const t = useT();
  const words = useSavedWords();
  const desktop = useDesktop();
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { easy: 0, medium: 0, hard: 0 };
    for (const w of words ?? []) c[w.difficulty]++;
    return c;
  }, [words]);
  const shown = useMemo(() => filterWords(words ?? [], query, filter), [words, query, filter]);
  const selected = words?.find((w) => w.key === selectedKey) ?? null;

  async function say(w: SavedWord) {
    setSpeakingKey(w.key);
    try {
      await speak(w.word, { rate: ttsSpeed });
    } finally {
      setSpeakingKey((k) => (k === w.key ? null : k));
    }
  }

  async function remove(w: SavedWord) {
    setSelectedKey(null);
    void stop();
    await forgetWord(w.word);
    toast(t.vocabulary.removed(w.word));
  }

  const total = words?.length ?? 0;
  const detail = selected && (
    <WordPanel
      entry={selected}
      saved
      onSave={() => {}}
      onRemove={() => void remove(selected)}
      onSpeak={() => void say(selected)}
      speaking={speakingKey === selected.key}
    />
  );

  return (
    <PageContainer>
      <PageHeader title={t.vocabulary.title} subtitle={words === null ? undefined : total ? t.vocabulary.subtitleWords(total) : t.vocabulary.subtitleEmpty} />

      {words === null ? (
        <div className="grid gap-3" data-testid="words-loading">
          <Skeleton className="h-12 w-full rounded-[0.875rem]" />
          <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
          <PadSkeleton rows={6} label={t.shell.loading} className="-mx-5 mt-1 lg:mx-0 lg:rounded-xl lg:border-[1.5px] lg:border-line" />
        </div>
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8">
          <div className="min-w-0">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="word-search" className="sr-only">
                  {t.vocabulary.searchLabel}
                </Label>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-2" />
                  <Input
                    id="word-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.vocabulary.searchPlaceholder}
                    className="pl-11 text-base"
                    autoComplete="off"
                  />
                </div>
              </div>
              <ToggleGroup
                type="single"
                spacing={2}
                value={filter}
                onValueChange={(v) => v && setFilter(v as Filter)}
                aria-label={t.vocabulary.filterLabel}
                data-testid="word-filter"
                className="grid w-full grid-cols-[repeat(auto-fit,minmax(4.25rem,1fr))] gap-2 rounded-2xl border-[1.5px] border-line bg-secondary p-1.5"
              >
                <FilterItem value="all" label={t.vocabulary.filterAll} count={total} />
                {LEVELS.map((l) => (
                  <FilterItem key={l} value={l} label={t.difficulty[l]} count={counts[l]} level={l} />
                ))}
              </ToggleGroup>
              <p className="sr-only">{t.vocabulary.countsLabel(counts.easy, counts.medium, counts.hard)}</p>
              {total < MIN_QUIZ_WORDS ? (
                <div className="flex items-center gap-3">
                  <p className="shrink-0 font-bold">{t.vocabulary.unlockQuiz(MIN_QUIZ_WORDS - total)}</p>
                  <Progress value={(total / MIN_QUIZ_WORDS) * 100} aria-label={t.vocabulary.unlockQuiz(MIN_QUIZ_WORDS - total)} />
                </div>
              ) : (
                <p className="font-bold">
                  {t.vocabulary.quizReady}{" "}
                  <Link href="/quiz" className="underline underline-offset-4">
                    {t.vocabulary.takeQuiz}
                  </Link>
                </p>
              )}
            </div>

            <div className="-mx-5 mt-4 lg:mx-0">
              {shown.length === 0 ? (
                <div className="mx-5 flex flex-col items-center gap-3 rounded-xl bg-paper-2 px-6 py-10 text-center lg:mx-0" data-testid="no-matches">
                  <Mascot mood="think" size={80} />
                  <h2 className="font-heading text-xl font-bold">{t.vocabulary.noResultsTitle}</h2>
                  <p className="text-ink-2">{t.vocabulary.noResultsBody}</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    {t.vocabulary.clearFilters}
                  </Button>
                </div>
              ) : (
                <ul className="pad lg:rounded-xl lg:border-[1.5px] lg:border-line" aria-label={t.vocabulary.listLabel}>
                  {shown.map((w) => (
                    <li key={w.key} className="flex h-[calc(var(--pitch)*2)] items-center gap-1 pr-3" data-testid="word-row">
                      <button
                        type="button"
                        onClick={() => setSelectedKey(w.key)}
                        aria-label={t.vocabulary.openWord(w.word)}
                        aria-current={w.key === selectedKey ? "true" : undefined}
                        className="flex h-full min-w-0 flex-1 cursor-pointer touch-manipulation items-center justify-between gap-3 pl-[var(--pad-gutter)] text-left outline-none transition-colors hover:bg-secondary/60 active:bg-secondary aria-[current=true]:bg-secondary aria-[current=true]:shadow-[inset_0_0_0_2px_var(--line-strong)] focus-visible:outline-solid focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-heading text-xl leading-[var(--pitch)] font-bold tracking-normal">{w.word}</span>
                          <span className="block truncate leading-[var(--pitch)] text-ink-2">{w.translation}</span>
                        </span>
                      </button>
                      {/* one cell, one paper backing: the rule never shows between or around the icons */}
                      <span className="flex shrink-0 items-center gap-1 rounded-md bg-paper">
                        <DifficultyStamp level={w.difficulty} showLabel={false} />
                        <Button variant="ghost" size="icon" onClick={() => void say(w)} aria-label={t.vocabulary.speakWord(w.word)}>
                          <Volume2 aria-hidden="true" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {desktop && (
            <aside className="mt-4 hidden lg:block" aria-label={t.vocabulary.detailTitle}>
              <div className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain rounded-xl border-[1.5px] border-line bg-paper p-6 shadow-sm">
                {detail ?? <EmptyPanelPrompt title={t.vocabulary.detailEmptyTitle} body={t.vocabulary.detailHint} />}
              </div>
            </aside>
          )}
        </div>
      )}

      {!desktop && (
        <Drawer open={!!selected} onOpenChange={(o) => !o && setSelectedKey(null)}>
          <DrawerContent>
            <DrawerTitle className="sr-only">{selected?.word ?? t.vocabulary.detailTitle}</DrawerTitle>
            <DrawerDescription className="sr-only">{t.vocabulary.detailTitle}</DrawerDescription>
            <div className="max-h-[calc(60dvh-1rem)] overflow-y-auto overscroll-contain px-5 pt-3" data-vaul-no-drag>{detail}</div>
          </DrawerContent>
        </Drawer>
      )}
    </PageContainer>
  );
}

function FilterItem({ value, label, count, level }: { value: Filter; label: string; count: number; level?: (typeof LEVELS)[number] }) {
  return (
    <ToggleGroupItem
      value={value}
      className="h-auto min-h-14 w-full flex-col-reverse justify-center gap-0.5 rounded-xl px-1.5 py-1.5 leading-tight data-[state=on]:shadow-sm"
    >
      <span className="text-[0.8125rem] font-bold [overflow-wrap:anywhere]">{label}</span>
      <span className="flex items-center gap-1.5 font-heading text-lg font-extrabold tabular-nums">
        {level && <StampShape level={level} className="size-[18px] text-current" />}
        {count}
      </span>
    </ToggleGroupItem>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-paper-2 px-6 py-12 text-center" data-testid="words-empty">
      <Mascot size={110} />
      <h2 className="font-heading text-2xl font-bold">{t.vocabulary.emptyTitle}</h2>
      <p className="max-w-prose text-ink-2">{t.vocabulary.emptyBody}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/scan">{t.vocabulary.emptyScan}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/books">{t.vocabulary.emptyBooks}</Link>
        </Button>
      </div>
    </div>
  );
}
