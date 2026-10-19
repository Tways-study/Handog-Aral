"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import DifficultyStamp, { StampShape } from "@/components/DifficultyStamp";
import Mascot from "@/components/Mascot";
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
        <div className="grid gap-3" role="status" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
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
                variant="outline"
                spacing={2}
                value={filter}
                onValueChange={(v) => v && setFilter(v as Filter)}
                aria-label={t.vocabulary.filterLabel}
                className="grid w-full grid-cols-2 sm:flex sm:flex-wrap"
              >
                <ToggleGroupItem value="all">{t.vocabulary.filterAll} ({total})</ToggleGroupItem>
                {LEVELS.map((l) => (
                  <ToggleGroupItem key={l} value={l}>
                    <StampShape level={l} className="text-current" />
                    {t.difficulty[l]} ({counts[l]})
                  </ToggleGroupItem>
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
                        className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 pl-[var(--pad-gutter)] text-left focus-visible:outline-solid focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-heading text-xl leading-[var(--pitch)] font-bold">{w.word}</span>
                          <span className="block truncate leading-[var(--pitch)] text-ink-2">{w.translation}</span>
                        </span>
                        <DifficultyStamp level={w.difficulty} showLabel={false} />
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => void say(w)} aria-label={t.vocabulary.speakWord(w.word)}>
                        <Volume2 aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {desktop && (
            <aside className="mt-4 hidden lg:block" aria-label={t.vocabulary.detailTitle}>
              <div className="sticky top-6 rounded-xl border-[1.5px] border-line bg-paper p-6">
                {detail ?? <p className="text-ink-2">{t.vocabulary.detailHint}</p>}
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
            <div className="overflow-y-auto px-5 pt-3 pb-6">{detail}</div>
          </DrawerContent>
        </Drawer>
      )}
    </PageContainer>
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
