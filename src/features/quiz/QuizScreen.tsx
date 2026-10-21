"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { EmptyQuiz } from "@/components/art";
import StampCheck from "@/components/StampCheck";
import StampStar from "@/components/StampStar";
import Owl, { type OwlMood, type OwlReaction } from "@/components/owl/Owl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import OwlTag from "@/features/reader/OwlTag";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { buzz } from "@/lib/haptics";
import { useMotion } from "@/lib/motion";
import { stampLand } from "@/lib/motionReader";
import { realEnglish, realPhonetic } from "@/lib/phonetic";
import { buildQuiz, MIN_QUIZ_WORDS, type Quiz } from "@/lib/quiz";
import { play } from "@/lib/sound";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { useMoments } from "@/stores/moments";
import { selectTotalStars, useProgress } from "@/stores/progress";
import { useRewards } from "@/stores/rewards";
import { useSettings } from "@/stores/settings";
import type { SavedWord } from "@/stores/db";

const LETTERS = ["A", "B", "C", "D"];
const DESKTOP = "(min-width: 1024px)";
/** Right answers in a row that earn the owl its one-time hop. */
const HOP_STREAK = 3;

export default function QuizScreen() {
  const t = useT();
  const words = useSavedWords();
  const [round, setRound] = useState(0);

  return (
    <PageContainer flush>
      <div className="px-5 lg:px-8">
        <PageHeader title={t.quiz.title} />
      </div>
      {words === null ? (
        <QuizSkeleton />
      ) : (
        <QuizRound key={round} words={words} onRetry={() => setRound((r) => r + 1)} />
      )}
    </PageContainer>
  );
}

/** Same skeleton of the question screen (progress, word card on the rules, four answers, Next) so nothing jumps. */
function QuizSkeleton() {
  const t = useT();
  return (
    <div className="px-5 lg:px-8" role="status" aria-busy="true" aria-label={t.quiz.loading} data-testid="quiz-loading">
      <div className="max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 flex-1 rounded-full" />
        </div>
        <div className="pad mt-[5.5rem] rounded-xl border-[1.5px] border-line py-[calc(var(--pitch)*0.5)]">
          <div className="pad-line flex items-center">
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="pad-line flex items-center">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="pad-line flex items-center">
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
        <Skeleton className="mt-4 mb-2 h-5 w-64 max-w-full" />
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-[calc(3.5rem+1.5rem)] h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function NotEnough({ have }: { have: number }) {
  const t = useT();
  return (
    <div className="mx-5 flex flex-col items-center gap-4 rounded-xl bg-paper-2 px-6 py-10 text-center lg:mx-8" data-testid="quiz-not-enough">
      <EmptyQuiz size={176} />
      <h2 className="font-heading text-2xl font-bold">{t.quiz.notEnoughTitle}</h2>
      <p className="font-bold">{t.quiz.notEnoughNeed(have, MIN_QUIZ_WORDS)}</p>
      <p className="max-w-prose text-ink-2">{t.quiz.notEnoughBody}</p>
      <Button asChild size="lg" variant="secondary">
        <Link href="/scan">{t.quiz.scanBtn}</Link>
      </Button>
    </div>
  );
}

/** What the owl does right after an answer. */
type Reply = { kind: "cheer" | "think" | "hop"; streak: number };

/** One quiz attempt. Mounted with a new key on retry, so the lazy initialiser reshuffles a NEW quiz. */
function QuizRound({ words, onRetry }: { words: SavedWord[]; onRetry: () => void }) {
  const [quiz] = useState<Quiz | null>(() => buildQuiz(words));
  // The very first quiz this child ever takes gets a greeting from the owl (once, ever).
  const [intro] = useState(() => (quiz ? useMoments.getState().claim("firstQuiz") : false));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [hopped, setHopped] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);

  if (!quiz) return <NotEnough have={words.length} />;

  const total = quiz.questions.length;
  if (picks.length === total && chosen === null) {
    return <QuizResults quiz={quiz} picks={picks} onRetry={onRetry} />;
  }

  const choose = (i: number) => {
    if (chosen !== null) return;
    const right = i === quiz.questions[index].answerIndex;
    const run = right ? streak + 1 : 0;
    setChosen(i);
    setStreak(run);
    if (right) {
      play("chime");
      buzz("success");
      const hop = run === HOP_STREAK && !hopped;
      if (hop) setHopped(true);
      setReply({ kind: hop ? "hop" : "cheer", streak: run });
    } else {
      play("error-soft");
      setReply({ kind: "think", streak: 0 });
    }
  };

  return (
    <QuestionView
      quiz={quiz}
      index={index}
      chosen={chosen}
      reply={reply}
      intro={intro}
      onChoose={choose}
      onNext={() => {
        if (chosen === null) return;
        setPicks((p) => [...p, chosen]);
        setChosen(null);
        setReply(null);
        setIndex((i) => i + 1);
      }}
    />
  );
}

function QuestionView({
  quiz,
  index,
  chosen,
  reply,
  intro,
  onChoose,
  onNext,
}: {
  quiz: Quiz;
  index: number;
  chosen: number | null;
  reply: Reply | null;
  intro: boolean;
  onChoose: (i: number) => void;
  onNext: () => void;
}) {
  const t = useT();
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const desktop = useMediaQuery(DESKTOP);
  const { online } = useOnlineStatus();
  const nextRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(104);
  const stampRef = useRef<HTMLSpanElement>(null);
  const q = quiz.questions[index];
  const total = quiz.questions.length;
  const answered = chosen !== null;
  const correct = chosen === q.answerIndex;
  const last = index + 1 >= total;
  const phonetic = realPhonetic(q.phonetic, q.word);
  const english = realEnglish(q.english);
  // While the offline banner is showing the page is shorter: the question card tightens up.
  const compact = !online;

  // The bar is fixed above the nav, so the page keeps exactly its height free at the bottom (it grows when the bar wraps).
  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBarH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Moving on is the one thing left to do, so focus goes straight to "Sunod" once an answer is in.
  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);

  useEffect(() => {
    if (answered && correct) return stampLand(stampRef.current, { from: 1.15 });
  }, [answered, correct]);

  const mood: OwlMood = !answered ? (index === 0 && intro ? "wave" : "idle") : correct ? "cheer" : "think";
  // A new key each step: a small wave when a new question arrives, the owl's reply when the child answers.
  const reaction: OwlReaction = { kind: !answered ? "wave" : (reply?.kind ?? "cheer"), key: index * 2 + (answered ? 1 : 0) };
  const tag = answered
    ? correct && reply?.kind === "hop"
      ? t.quiz.streakCheer
      : !correct
        ? t.quiz.tryAgainKind
        : null
    : index === 0 && intro
      ? t.quiz.intro(total)
      : null;
  const owlSize = compact ? 72 : 88;

  const owl = (
    <div className="flex items-end gap-1.5">
      {tag && (
        <OwlTag tail="right" className="mb-3 max-w-[13rem] py-1.5 text-[0.9375rem] leading-snug font-bold" role="status">
          {tag}
        </OwlTag>
      )}
      <Owl mood={mood} size={owlSize} priority="hero" reaction={reaction} />
    </div>
  );

  const bar = (
    <div
      ref={barRef}
      data-slot="feedback-bar"
      className="fixed inset-x-0 z-30 border-t-[1.5px] border-line bg-background px-5 pt-2.5 pb-7 lg:static lg:z-auto lg:mt-4 lg:border-t-0 lg:bg-transparent lg:p-0"
      style={desktop ? undefined : { bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 lg:max-w-none lg:flex-nowrap">
        <div className="flex min-h-14 min-w-0 flex-[1_1_10rem] items-center gap-3" role="status" aria-live="polite" data-testid="quiz-feedback">
          {answered ? (
            <>
              {correct && (
                <span ref={stampRef} className="inline-grid size-12 shrink-0 place-items-center">
                  <StampCheck size={46} seed={index} />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-heading text-xl leading-tight font-bold">{correct ? t.quiz.correct : t.quiz.wrong}</p>
                {!correct && <p className="line-clamp-2 text-[0.9375rem] leading-snug text-ink-2 [overflow-wrap:anywhere]">{t.quiz.answerWas(q.options[q.answerIndex])}</p>}
              </div>
            </>
          ) : (
            <p className="text-[0.9375rem] font-bold text-ink-2">{t.quiz.pickOne}</p>
          )}
        </div>
        <Button
          ref={nextRef}
          size="lg"
          variant="ink"
          className="min-w-28 flex-[1_0_auto] disabled:border-input disabled:text-ink-2 lg:w-44 lg:flex-none"
          disabled={!answered}
          onClick={onNext}
        >
          {last ? t.quiz.seeResults : t.quiz.next}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="px-5 lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-10">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <p className="shrink-0 font-bold tabular-nums" aria-live="polite">
              {t.quiz.progress(index + 1, total)}
            </p>
            <Progress value={(index / total) * 100} aria-label={t.quiz.progress(index + 1, total)} />
          </div>

          <div className="relative">
            {/* The owl perches on the card's top edge. In flow, so a long speech tag (dyslexia, Large) pushes the card down instead of covering the progress. */}
            {!desktop && (
              <div className="pointer-events-none relative z-10 -mb-2 flex items-end justify-end pr-2" style={{ minHeight: owlSize }}>
                {owl}
              </div>
            )}
            <div className={cn("pad rounded-xl border-[1.5px] border-line", compact ? "py-[calc(var(--pitch)*0.25)]" : "py-[calc(var(--pitch)*0.5)]")}>
              <div className="pad-line flex items-center justify-between gap-3">
                <h2 className={cn("font-heading leading-none font-extrabold break-words [overflow-wrap:anywhere]", compact ? "text-3xl" : "text-4xl")}>{q.word}</h2>
                <Button variant="ink" size="icon-lg" onClick={() => void speak(q.word, { rate: ttsSpeed })} aria-label={`${t.quiz.speak}: ${q.word}`}>
                  <Volume2 aria-hidden="true" />
                </Button>
              </div>
              {compact ? (
                (phonetic || english) && <p className="pad-line text-ink-2">{[phonetic, english].filter(Boolean).join(" · ")}</p>
              ) : (
                <>
                  {phonetic && <p className="pad-line text-ink-2">{phonetic}</p>}
                  {english && <p className="pad-line">{english}</p>}
                </>
              )}
            </div>
          </div>

          <p id={`quiz-prompt-${index}`} className={cn("font-bold", compact ? "mt-3 mb-1.5" : "mt-4 mb-2")}>
            {t.quiz.prompt}
          </p>
          <RadioGroup
            aria-labelledby={`quiz-prompt-${index}`}
            value={chosen === null ? "" : String(chosen)}
            onValueChange={(v) => onChoose(Number(v))}
            disabled={answered}
            className={compact ? "gap-2" : "gap-3"}
          >
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answerIndex;
              const isChosen = i === chosen;
              const state = !answered ? "idle" : isAnswer ? "right" : isChosen ? "wrong" : "idle";
              return (
                <RadioGroupItem
                  key={opt}
                  value={String(i)}
                  data-answer={state}
                  className={cn(
                    "pressable group flex min-h-14 w-full items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2 text-left text-lg font-bold text-ink",
                    state === "right" && "border-success bg-success/15 disabled:border-success disabled:bg-success/15 disabled:text-ink",
                    state === "wrong" && "border-warning bg-warning/20 disabled:border-warning disabled:bg-warning/20 disabled:text-ink",
                    state === "idle" &&
                      "border-line bg-card shadow-tile enabled:hover:bg-secondary enabled:active:shadow-pressed disabled:border-line disabled:bg-paper disabled:text-ink-2 disabled:shadow-none",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg font-heading text-lg",
                      state === "right" ? "bg-success text-success-foreground" : state === "wrong" ? "bg-warning text-warning-foreground" : "bg-secondary group-enabled:group-hover:bg-card",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{opt}</span>
                  {state === "right" && (
                    <>
                      <Check aria-hidden="true" className="size-6 shrink-0 text-success" />
                      <span className="sr-only">{t.quiz.rightAnswer}</span>
                    </>
                  )}
                  {state === "wrong" && (
                    <>
                      <X aria-hidden="true" className="size-6 shrink-0 text-warning-text" />
                      <span className="sr-only">{t.quiz.yourAnswer}</span>
                    </>
                  )}
                </RadioGroupItem>
              );
            })}
          </RadioGroup>
          {bar}
          {!desktop && <div aria-hidden="true" style={{ height: barH }} />}
        </div>
        {desktop && (
          <div className="hidden pt-12 lg:flex lg:flex-col lg:items-center" data-slot="quiz-owl">
            <div className="flex flex-col items-center gap-3">
              {tag && (
                <OwlTag tail="bottom" className="max-w-[16rem] text-center text-base font-bold" role="status">
                  {tag}
                </OwlTag>
              )}
              <Owl mood={mood} size={168} priority="hero" reaction={reaction} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** One slot of the stamp row: a rubber star stamped for a right answer (staggered, once), an empty dashed ring for the rest. */
function ResultStamp({ index, earned }: { index: number; earned: boolean }) {
  const { stampIn } = useMotion();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (earned) return stampIn(ref.current, { delay: 0.3 + index * 0.14 });
  }, [earned, index, stampIn]);
  return earned ? (
    <span ref={ref} className="inline-grid size-12 place-items-center" data-stamp="earned">
      <StampStar size={46} seed={index} />
    </span>
  ) : (
    <span className="inline-grid size-12 place-items-center" data-stamp="missed">
      <span className="size-9 rounded-full border-[1.5px] border-dashed border-line-strong" />
    </span>
  );
}

function QuizResults({ quiz, picks, onRetry }: { quiz: Quiz; picks: number[]; onRetry: () => void }) {
  const t = useT();
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const recorded = useRef(false);
  const total = quiz.questions.length;
  const right = quiz.questions.filter((q, i) => picks[i] === q.answerIndex);
  const missed = quiz.questions.filter((q, i) => picks[i] !== q.answerIndex);
  const score = right.length;
  // The best score before this attempt, read once at mount (the store is hydrated before any screen renders).
  const [previousBest] = useState(() => useProgress.getState().quizHighScore);
  const highScore = useProgress((s) => s.quizHighScore);
  const stars = useProgress(selectTotalStars);

  // Exactly once per completed quiz, never during render.
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    useProgress.getState().recordQuizResult(score, total);
    // After the stamps have landed, so a sticker dialog does not cover the result. Not cancelled on purpose.
    setTimeout(() => useRewards.getState().recordEvent({ type: "quiz-finished", score, total }), 1500);
  }, [score, total]);

  const ratio = total ? score / total : 0;
  const message = score === total ? t.quiz.messagePerfect : ratio >= 0.6 ? t.quiz.messageGood : t.quiz.messageTry;
  const mood: OwlMood = ratio >= 0.8 ? "cheer" : ratio >= 0.6 ? "wave" : "think";
  const beaten = previousBest > 0 && score > previousBest;

  return (
    <div className="px-5 lg:px-8">
      <div className="max-w-2xl">
        <section className="rounded-xl bg-paper-2 px-5 py-6" aria-label={t.quiz.scoreLine(score, total)}>
          <div className="flex items-center gap-4">
            <Owl mood={mood} size={112} priority="hero" reaction={{ kind: mood === "cheer" ? "cheer" : "hop", key: 1 }} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-baseline gap-x-2 font-heading leading-none font-extrabold" data-testid="quiz-score">
                <span className="text-7xl tabular-nums lg:text-8xl">{score}</span>{" "}
                <span className="text-xl leading-tight font-bold">{t.quiz.scoreRest(total)}</span>
              </h2>
              <p className="mt-2 font-bold text-ink-2">{message}</p>
            </div>
          </div>

          {/* Stars fill from the left: as many as the child got right. */}
          <div className="mt-5 flex flex-wrap gap-1" role="img" aria-label={t.quiz.starsFilled(score, total)} data-testid="quiz-stamps">
            {quiz.questions.map((q, i) => (
              <ResultStamp key={q.id} index={i} earned={i < score} />
            ))}
          </div>

          {beaten && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-mango px-4 py-2 font-bold text-mango-fg" data-testid="quiz-new-best">
              <Trophy aria-hidden="true" className="size-5 shrink-0" />
              {t.quiz.newBest(score)}
            </p>
          )}

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-bold tabular-nums">
            <span>{t.quiz.starsLine(stars)}</span>
            <span>{t.quiz.highScoreLine(highScore)}</span>
          </p>
        </section>

        {right.length > 0 && (
          <section className="mt-6" aria-labelledby="quiz-right-title" data-testid="quiz-right">
            <h3 id="quiz-right-title" className="mb-2 font-heading text-xl font-bold">
              {t.quiz.rightTitle}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {right.map((q) => (
                <li key={q.id} className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-success bg-success/15 px-3.5 font-heading text-lg font-bold">
                  <Check aria-hidden="true" className="size-5 shrink-0 text-success" strokeWidth={3} />
                  <span className="[overflow-wrap:anywhere]">{q.word}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {missed.length > 0 && (
          <section className="mt-6" aria-labelledby="quiz-retry-title" data-testid="quiz-retry">
            <h3 id="quiz-retry-title" className="font-heading text-xl font-bold">
              {t.quiz.retryTitle}
            </h3>
            <p className="mt-0.5 mb-3 text-ink-2">{t.quiz.retryBody}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {missed.map((q) => {
                const phonetic = realPhonetic(q.phonetic, q.word);
                return (
                  <li key={q.id} className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-line bg-card p-4 shadow-tile" data-testid="quiz-retry-card">
                    <p className="font-heading text-2xl leading-tight font-extrabold [overflow-wrap:anywhere]">{q.word}</p>
                    {phonetic && <p className="-mt-1 text-ink-2">{phonetic}</p>}
                    <p className="text-ink-2">
                      {t.quiz.meansLabel}: <span className="font-bold text-ink">{q.options[q.answerIndex]}</span>
                    </p>
                    <Button type="button" variant="secondary" size="sm" className="mt-1 w-fit" onClick={() => void speak(q.word, { rate: ttsSpeed })}>
                      <Volume2 aria-hidden="true" />
                      <span>{t.popup.speakBtn}</span>
                      <span className="sr-only">{q.word}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="ink" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            {t.quiz.retry}
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/words">{t.quiz.viewWords}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
