"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, BookOpen, ChevronRight, Flame, Gamepad2, RotateCcw, ScanLine, Volume2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import DifficultyStamp from "@/components/DifficultyStamp";
import BookCover from "@/components/BookCover";
import Owl, { type OwlReaction } from "@/components/owl/Owl";
import StampStar from "@/components/StampStar";
import StickerArt from "@/components/stickers/StickerArt";
import { Button } from "@/components/ui/button";
import { sampleBooks } from "@/data/books";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useT } from "@/hooks/useT";
import { HomeSkeleton } from "@/components/PageSkeleton";
import { useSavedWords } from "@/hooks/useSavedWords";
import { buzz } from "@/lib/haptics";
import { pageIn } from "@/lib/motionPages";
import { play } from "@/lib/sound";
import { orderStickers } from "@/lib/stickers/catalog";
import { STICKER_IDS, type StickerId } from "@/lib/stickers/ids";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { useProgress, useProgressHydrated } from "@/stores/progress";
import { selectAllStars, useRewards, useRewardsHydrated } from "@/stores/rewards";
import { useSettings, useSettingsHydrated } from "@/stores/settings";
import ShelfBar from "@/features/books/ShelfBar";
import { JACKET_CLASS } from "./jacket";
import { needsWelcome } from "./onboarding";
import SpeechTag from "./SpeechTag";

const QUIZ_MIN_WORDS = 4;
/** The memory game needs a few words to pair up. */
const PLAY_MIN_WORDS = 3;
/** Four rows below lg (the first viewport); one more at lg+, where the cover is taller. */
const RECENT_COUNT = 5;
const RECENT_MOBILE = 4;
const DESKTOP_QUERY = "(min-width: 1024px)";

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex min-h-[2.125rem] items-center gap-1.5 rounded-full border-[1.5px] border-line px-3 py-0.5 text-[0.9375rem] font-bold [html.font-large_&]:w-full">
      {icon}
      {children}
    </li>
  );
}

const ROW =
  "pressable flex min-h-16 items-center gap-3 rounded-lg border-[1.5px] border-line bg-card px-4 py-2.5 shadow-sm outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function HomeScreen() {
  const t = useT();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const settingsReady = useSettingsHydrated();
  const progressReady = useProgressHydrated();
  const rewardsReady = useRewardsHydrated();
  const hydrated = settingsReady && progressReady;
  const childName = useSettings((s) => s.childName);
  const onboarded = useSettings((s) => s.onboarded);
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const progress = useProgress();
  const { currentBookId, bookProgress, streak, savedWordCount, updateStreak } = progress;
  const bonusStars = useRewards((s) => s.bonusStars);
  const earned = useRewards((s) => s.earned);
  const stars = selectAllStars(progress, { bonusStars });
  const words = useSavedWords();
  const [reaction, setReaction] = useState<OwlReaction | undefined>();
  const streakSent = useRef(false);

  // Wait for the saved-words table too, so a user with words but a stale counter is never redirected.
  const redirecting = hydrated && words !== null && needsWelcome({ onboarded, childName, savedWordCount: Math.max(savedWordCount, words.length) });
  const ready = hydrated && words !== null && !redirecting;

  useEffect(() => {
    if (redirecting) router.replace("/welcome");
  }, [redirecting, router]);

  useEffect(() => {
    if (ready) updateStreak();
  }, [ready, updateStreak]);

  // Once per mount, after the streak has updated and the rewards store is loaded (a write before that would be overwritten).
  useEffect(() => {
    if (!ready || !rewardsReady || streakSent.current) return;
    streakSent.current = true;
    const days = useProgress.getState().streak;
    if (days > 0) useRewards.getState().recordEvent({ type: "streak", days });
  }, [ready, rewardsReady]);

  useEffect(() => {
    if (ready) return pageIn(rootRef.current);
  }, [ready]);

  const stickerPreview = useMemo(() => {
    const got = (Object.keys(earned) as StickerId[]).sort((a, b) => (earned[b] ?? 0) - (earned[a] ?? 0));
    const rest = orderStickers(earned, { words: savedWordCount, streak }).filter((id) => earned[id] === undefined);
    return { count: got.length, ids: [...got, ...rest].slice(0, 3) };
  }, [earned, savedWordCount, streak]);

  if (!ready) return <div ref={rootRef}><HomeSkeleton label={t.shell.loading} /></div>;

  const book = sampleBooks.find((b) => b.id === currentBookId) ?? sampleBooks[0];
  const pct = Math.max(0, Math.min(100, bookProgress[book.id] ?? 0));
  const hour = new Date().getHours();
  const [greeting, sub] =
    hour < 12
      ? [t.home.greetingMorning(childName), t.home.subMorning]
      : hour < 18
        ? [t.home.greetingAfternoon(childName), t.home.subAfternoon]
        : [t.home.greetingEvening(childName), t.home.subEvening];
  const wordCount = Math.max(savedWordCount, words.length);
  const recent = words.slice(0, RECENT_COUNT);
  const newest = words[0];
  const otherBooks = sampleBooks.filter((b) => b.id !== book.id);

  // Continue where you stopped; "Umpisahan ta" until the first word is saved; "Basaha liwat" once finished.
  const [readLabel, ReadIcon] =
    pct >= 100 ? ([t.home.readAgain, RotateCcw] as const) : pct > 0 ? ([t.home.continueReading, Bookmark] as const) : ([t.home.startReading, BookOpen] as const);

  const cheer = () => setReaction({ kind: "cheer", key: Date.now() });
  const listenNewest = () => {
    if (!newest) return;
    cheer();
    void speak(newest.word, { rate: ttsSpeed });
    useRewards.getState().recordEvent({ type: "listen" });
  };

  const owl = (
    <Owl
      priority="hero"
      size={isDesktop ? 148 : 100}
      mood={pct >= 100 ? "cheer" : "idle"}
      interactive
      title={t.home.owlName}
      reaction={reaction}
      onTap={() => {
        cheer();
        play("pop");
        buzz("tap");
      }}
      className={isDesktop ? undefined : "-mb-10 mr-1 shrink-0 [html.font-large_&]:self-end"}
    />
  );

  return (
    <PageContainer>
      <div ref={rootRef}>
        <div data-rise>
          <PageHeader title={greeting} subtitle={sub} />
          <ul aria-label={t.home.tallyLabel} className="flex flex-wrap gap-2 pb-2 [html.font-large_&]:grid [html.font-large_&]:grid-cols-2">
            <Chip icon={<StampStar size={26} seed={stars} className="-my-1" />}>{t.home.chipStars(stars)}</Chip>
            <Chip icon={<Flame className="size-[1.25rem] text-margin" aria-hidden="true" />}>{t.home.chipStreak(streak)}</Chip>
          </ul>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-10 gap-y-8 pt-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-stretch lg:pt-2">
          {/* The owl and what it has to say: over the cover on a phone, the stage above the pad at lg+. */}
          <div data-rise className="relative z-10 flex items-end justify-between gap-2 [@media(max-width:340px)]:[html.font-large_&]:flex-col [@media(max-width:340px)]:[html.font-large_&]:items-stretch lg:col-start-2 lg:row-start-1 lg:justify-start">
            <div className="min-w-0 flex-1 pb-1 lg:-mt-16 lg:-ml-5 lg:max-w-md lg:flex-none lg:pb-5">
              <SpeechTag tail={isDesktop ? "left" : "right"} className="px-3.5 py-2.5 lg:px-4 lg:py-3">
                {newest ? (
                  <>
                    <p className="text-[0.9375rem] leading-snug font-bold [@media(max-height:700px)]:hidden [html.font-large_&]:hidden">{t.home.growthWords(wordCount)}</p>
                    <button
                      type="button"
                      onClick={listenNewest}
                      className="pressable mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg bg-paper-2 px-2.5 text-left outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring"
                    >
                      <Volume2 aria-hidden="true" className="size-5 shrink-0" />
                      <span className="min-w-0">
                        <b className="block truncate font-heading text-[1.0625rem] leading-tight">{newest.word}</b>
                        <span className="block truncate text-sm text-ink-2">{newest.translation}</span>
                      </span>
                    </button>
                  </>
                ) : (
                  <p className="text-base leading-snug font-bold">{t.home.growthEmpty}</p>
                )}
              </SpeechTag>
            </div>
            {!isDesktop && owl}
          </div>

          <section
            data-rise
            aria-label={t.home.coverLabel}
            className={cn(
              "relative flex flex-col rounded-[0.375rem_1.375rem_1.375rem_0.375rem] py-5 pr-5 pl-9 shadow-md lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-[30rem] lg:py-7 lg:pr-7 lg:pl-12",
              JACKET_CLASS[book.jacket],
            )}
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4 rounded-l-[0.375rem] bg-black/25 lg:w-5" />
            {/* Desktop: the owl perches on the cover's top edge, in the gutter beside the greeting. */}
            {isDesktop && <div className="absolute -top-[8.75rem] right-3 z-10">{owl}</div>}

            <div className="rounded-[0.625rem] border-2 border-black/10 bg-label-paper px-3.5 py-2.5 text-label-ink lg:px-4 lg:py-3">
              <p className="flex items-baseline gap-1.5 text-[0.8125rem] text-label-ink-2">
                {t.home.bookLabel}
                <span className="flex-1 border-b-[1.5px] border-label-rule font-heading text-xl leading-[1.15] font-bold text-label-ink lg:text-2xl">
                  {book.title}
                </span>
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5 text-[0.8125rem] text-label-ink-2">
                {t.home.collectedLabel}
                <span className="flex-1 border-b-[1.5px] border-label-rule text-[0.9375rem] font-bold text-label-ink">
                  {t.home.chipWords(wordCount)}
                </span>
              </p>
            </div>

            <div aria-hidden="true" className="hidden min-h-0 flex-1 items-center justify-center py-6 lg:flex">
              <BookCover coverId={book.coverId} jacket={book.jacket} label={false} className="w-44 -rotate-3 drop-shadow-xl" />
            </div>

            {/* A phone has no room for the big cover, so a small tilted one sits beside the progress bar. Large text and dyslexia mode drop it. */}
            <div className="mt-2 flex items-end gap-3 text-[0.9375rem] font-bold lg:mt-0 lg:block">
              <div aria-hidden="true" className="order-last -mt-5 shrink-0 lg:hidden [html.font-large_&]:hidden [body.dyslexia-font_&]:hidden">
                <BookCover coverId={book.coverId} jacket={book.jacket} label={false} className="w-24 rotate-3 drop-shadow-lg" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2.5 pb-1 lg:pb-0">
                <div
                  role="progressbar"
                  aria-label={t.bookCard.progressText(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className="h-2.5 flex-1 overflow-hidden rounded-full bg-current/25"
                >
                  <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
                </div>
                <span aria-hidden="true">{pct}%</span>
              </div>
            </div>

            <Button asChild size="xl" className="mt-4 h-auto min-h-[3.75rem] w-full py-2 text-center whitespace-normal">
              <Link href={`/read/${book.id}`}>
                <ReadIcon aria-hidden="true" />
                {readLabel}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="mt-2.5 h-auto min-h-14 w-full py-2 text-center whitespace-normal">
              <Link href="/scan">
                <ScanLine aria-hidden="true" />
                {t.home.scanCta}
              </Link>
            </Button>
          </section>

          <section
            data-rise
            aria-labelledby="recent-heading"
            className="flex flex-col overflow-hidden rounded-lg border border-line lg:col-start-2 lg:row-start-2"
          >
            <div className="pad pb-1 lg:flex-1">
              <div className="pad-line flex items-center justify-between">
                <h2 id="recent-heading" className="font-heading text-lg font-bold">
                  {t.home.recentTitle}
                </h2>
                {recent.length > 0 && (
                  <Link
                    href="/words"
                    aria-label={t.home.recentViewAllLabel}
                    className="-my-2 inline-flex min-h-11 items-center text-[0.9375rem] font-bold underline underline-offset-4 outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring"
                  >
                    {t.home.recentViewAll}
                  </Link>
                )}
              </div>
              {recent.length > 0 ? (
                <ul>
                  {recent.map((w, i) => (
                    <li key={w.key} className={cn("pad-line items-center justify-between gap-3", i >= RECENT_MOBILE ? "hidden lg:flex" : "flex")}>
                      <b className="font-heading text-[1.1875rem] font-bold">{w.word}</b>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-ink-2">{w.translation}</span>
                        <DifficultyStamp level={w.difficulty} showLabel={false} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="pad-line pb-4 [line-height:1.5]">
                  <p className="font-heading text-lg font-bold">{t.home.emptyTitle}</p>
                  <p className="text-ink-2">{t.home.emptyBody}</p>
                </div>
              )}
            </div>
            {words.length >= QUIZ_MIN_WORDS && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 border-t border-line bg-paper-2 px-4 py-1.5">
                <p className="text-[0.9375rem] text-ink-2">{t.home.quizNudge}</p>
                <Button asChild variant="secondary" size="sm" className="shrink-0">
                  <Link href="/quiz">{t.home.quizCta}</Link>
                </Button>
              </div>
            )}
          </section>
        </div>

        <section data-rise aria-label={t.home.morePlaces} className="pt-10 lg:pt-12">
          <ul className={cn("grid gap-3", words.length >= PLAY_MIN_WORDS && "lg:grid-cols-2")}>
            <li>
              <Link href="/stickers" className={ROW}>
                <span aria-hidden="true" className="flex shrink-0 -space-x-2.5">
                  {stickerPreview.ids.map((id) => (
                    <StickerArt key={id} id={id} locked={earned[id] === undefined} size={44} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-lg leading-tight font-bold">{t.home.stickersTitle}</span>
                  <span className="block text-[0.9375rem] text-ink-2">{t.home.stickersCount(stickerPreview.count, STICKER_IDS.length)}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-2" />
              </Link>
            </li>
            {words.length >= PLAY_MIN_WORDS && (
              <li>
                <Link href="/play" className={ROW}>
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper-2">
                    <Gamepad2 className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-lg leading-tight font-bold">{t.home.playTitle}</span>
                    <span className="block text-[0.9375rem] text-ink-2">{t.home.playHint}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-2" />
                </Link>
              </li>
            )}
          </ul>
        </section>

        {otherBooks.length > 0 && (
          <section data-rise aria-labelledby="other-books-heading" className="pt-10 lg:pt-12">
            <div className="flex items-center justify-between gap-3 pb-3">
              <h2 id="other-books-heading" className="font-heading text-xl font-bold lg:text-2xl">
                {t.home.otherBooksTitle}
              </h2>
              <Link
                href="/books"
                aria-label={t.home.otherBooksViewAllLabel}
                className="inline-flex min-h-11 items-center text-[0.9375rem] font-bold underline underline-offset-4 outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-ring"
              >
                {t.home.otherBooksViewAll}
              </Link>
            </div>
            <ul aria-label={t.home.otherBooksLabel} className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-3 lg:gap-x-8">
              {otherBooks.map((b) => {
                const bpct = Math.max(0, Math.min(100, bookProgress[b.id] ?? 0));
                return (
                  <li key={b.id}>
                    <Link
                      href={`/read/${b.id}`}
                      className="group flex flex-col gap-3 rounded-lg outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring lg:flex-row lg:items-center lg:gap-4"
                    >
                      <div className="w-full max-w-[9.5rem] shrink-0 transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-active:translate-y-0 motion-safe:group-active:scale-[0.98] lg:w-28">
                        <BookCover coverId={b.coverId} jacket={b.jacket} className="drop-shadow-md" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-[1.0625rem] leading-tight font-bold text-pretty">
                          {b.title}
                          <span className="sr-only"> {t.bookCard.progressText(bpct)}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <ShelfBar pct={bpct} />
                          <span aria-hidden="true" className="w-11 shrink-0 text-right text-sm whitespace-nowrap font-bold text-ink-2 tabular-nums">
                            {bpct}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
