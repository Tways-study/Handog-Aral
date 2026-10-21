"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ScanLine } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import DifficultyStamp from "@/components/DifficultyStamp";
import Mascot from "@/components/Mascot";
import StampStar from "@/components/StampStar";
import { Button } from "@/components/ui/button";
import { sampleBooks } from "@/data/books";
import { useT } from "@/hooks/useT";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { selectTotalStars, useProgress, useProgressHydrated } from "@/stores/progress";
import { useSettings, useSettingsHydrated } from "@/stores/settings";
import { JACKET_CLASS } from "./jacket";
import { needsWelcome } from "./onboarding";

const QUIZ_MIN_WORDS = 4;
/** Four rows below lg (the first viewport); one more at lg+, where the cover is taller. */
const RECENT_COUNT = 5;
const RECENT_MOBILE = 4;

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex h-[2.125rem] items-center gap-1.5 rounded-full border-[1.5px] border-line px-3 text-[0.9375rem] font-bold">
      {icon}
      {children}
    </li>
  );
}

export default function HomeScreen() {
  const t = useT();
  const router = useRouter();
  const { fadeRoute } = useMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const settingsReady = useSettingsHydrated();
  const progressReady = useProgressHydrated();
  const hydrated = settingsReady && progressReady;
  const childName = useSettings((s) => s.childName);
  const onboarded = useSettings((s) => s.onboarded);
  const currentBookId = useProgress((s) => s.currentBookId);
  const bookProgress = useProgress((s) => s.bookProgress);
  const streak = useProgress((s) => s.streak);
  const savedWordCount = useProgress((s) => s.savedWordCount);
  const stars = useProgress(selectTotalStars);
  const updateStreak = useProgress((s) => s.updateStreak);
  const words = useSavedWords();

  // Wait for the saved-words table too, so a user with words but a stale counter is never redirected.
  const redirecting = hydrated && words !== null && needsWelcome({ onboarded, childName, savedWordCount: Math.max(savedWordCount, words.length) });
  const ready = hydrated && words !== null && !redirecting;

  useEffect(() => {
    if (redirecting) router.replace("/welcome");
  }, [redirecting, router]);

  useEffect(() => {
    if (ready) updateStreak();
  }, [ready, updateStreak]);

  useEffect(() => {
    if (ready) return fadeRoute(rootRef.current);
  }, [ready, fadeRoute]);

  if (!ready) return <PageContainer><div ref={rootRef} aria-busy="true" className="min-h-[60vh]" /></PageContainer>;

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

  return (
    <PageContainer>
      <div ref={rootRef}>
        <PageHeader title={greeting} subtitle={sub} />
        <ul aria-label={t.home.tallyLabel} className="flex gap-2 pb-2">
          <Chip icon={<StampStar size={26} seed={stars} className="-my-1" />}>{t.home.chipStars(stars)}</Chip>
          <Chip icon={<Flame className="size-[1.25rem] text-margin" aria-hidden="true" />}>{t.home.chipStreak(streak)}</Chip>
        </ul>

        <div className="grid items-start gap-8 pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
          <section
            aria-label={t.home.coverLabel}
            className={cn(
              "relative rounded-[0.375rem_1.375rem_1.375rem_0.375rem] py-5 pr-5 pl-9 shadow-md",
              JACKET_CLASS[book.jacket],
            )}
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4 rounded-l-[0.375rem] bg-black/25" />
            <Mascot mood="idle" size={92} className="absolute -top-[2.9rem] right-4" />

            <div className="flex items-end gap-3">
              <div className="w-[78%] rounded-[0.625rem] border-2 border-black/10 bg-[#FFFDF7] px-3.5 py-2.5 text-[#1D2340] lg:w-[78%]">
                <p className="flex items-baseline gap-1.5 text-[0.8125rem] text-[#4A5070]">
                  {t.home.bookLabel}
                  <span className="flex-1 border-b-[1.5px] border-[#C3D3EE] font-heading text-xl leading-[1.15] font-bold text-[#1D2340]">
                    {book.title}
                  </span>
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5 text-[0.8125rem] text-[#4A5070]">
                  {t.home.collectedLabel}
                  <span className="flex-1 border-b-[1.5px] border-[#C3D3EE] text-[0.9375rem] font-bold text-[#1D2340]">
                    {t.home.chipWords(wordCount)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 text-[0.9375rem] font-bold">
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

            <Button asChild size="xl" className="mt-4 w-full">
              <Link href="/scan">
                <ScanLine aria-hidden="true" />
                {t.home.scanCta}
              </Link>
            </Button>
            <Link
              href={`/read/${book.id}`}
              className="mt-2 flex min-h-11 items-center justify-center text-[0.9375rem] font-bold underline underline-offset-4 outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t.home.continueReading}
            </Link>
          </section>

          <section aria-labelledby="recent-heading" className="flex flex-col overflow-hidden rounded-lg border border-line">
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
                <div className="pad-line flex items-start gap-3 pb-4 [line-height:1.5]">
                  <Mascot mood="think" size={64} className="mt-1" />
                  <div>
                    <p className="font-heading text-lg font-bold">{t.home.emptyTitle}</p>
                    <p className="text-ink-2">{t.home.emptyBody}</p>
                  </div>
                </div>
              )}
            </div>
            {words.length >= QUIZ_MIN_WORDS && (
              <div className="flex items-center justify-between gap-3 border-t border-line bg-paper-2 px-4 py-1.5">
                <p className="text-[0.9375rem] text-ink-2">{t.home.quizNudge}</p>
                <Button asChild variant="secondary" size="sm" className="shrink-0">
                  <Link href="/quiz">{t.home.quizCta}</Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
