"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import Mascot from "@/components/Mascot";
import StampCheck from "@/components/StampCheck";
import StampStar from "@/components/StampStar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { useMotion } from "@/lib/motion";
import { realEnglish, realPhonetic } from "@/lib/phonetic";
import { buildQuiz, MIN_QUIZ_WORDS, type Quiz } from "@/lib/quiz";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { selectTotalStars, useProgress } from "@/stores/progress";
import { useSettings } from "@/stores/settings";
import type { SavedWord } from "@/stores/db";

const LETTERS = ["A", "B", "C", "D"];

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
        <div className="pad rounded-xl border-[1.5px] border-line py-[calc(var(--pitch)*0.5)]">
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
      <Mascot mood="think" size={96} />
      <h2 className="font-heading text-2xl font-bold">{t.quiz.notEnoughTitle}</h2>
      <p className="font-bold">{t.quiz.notEnoughNeed(have, MIN_QUIZ_WORDS)}</p>
      <p className="max-w-prose text-ink-2">{t.quiz.notEnoughBody}</p>
      <Button asChild size="lg">
        <Link href="/scan">
          <Camera aria-hidden="true" />
          {t.quiz.scanBtn}
        </Link>
      </Button>
    </div>
  );
}

/** One quiz attempt. Mounted with a new key on retry, so the lazy initialiser reshuffles a NEW quiz. */
function QuizRound({ words, onRetry }: { words: SavedWord[]; onRetry: () => void }) {
  const [quiz] = useState<Quiz | null>(() => buildQuiz(words));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [picks, setPicks] = useState<number[]>([]);

  if (!quiz) return <NotEnough have={words.length} />;

  const total = quiz.questions.length;
  if (picks.length === total && chosen === null) {
    return <QuizResults quiz={quiz} picks={picks} onRetry={onRetry} />;
  }
  return (
    <QuestionView
      quiz={quiz}
      index={index}
      chosen={chosen}
      onChoose={(i) => setChosen(i)}
      onNext={() => {
        if (chosen === null) return;
        setPicks((p) => [...p, chosen]);
        setChosen(null);
        setIndex((i) => i + 1);
      }}
    />
  );
}

function QuestionView({
  quiz,
  index,
  chosen,
  onChoose,
  onNext,
}: {
  quiz: Quiz;
  index: number;
  chosen: number | null;
  onChoose: (i: number) => void;
  onNext: () => void;
}) {
  const t = useT();
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const { stampIn } = useMotion();
  const stampRef = useRef<HTMLSpanElement>(null);
  const q = quiz.questions[index];
  const total = quiz.questions.length;
  const answered = chosen !== null;
  const correct = chosen === q.answerIndex;
  const last = index + 1 >= total;
  const phonetic = realPhonetic(q.phonetic, q.word);
  const english = realEnglish(q.english);

  useEffect(() => {
    if (answered && correct) return stampIn(stampRef.current);
  }, [answered, correct, stampIn]);

  return (
    <div className="px-5 lg:px-8">
      <div className="max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <p className="shrink-0 font-bold tabular-nums" aria-live="polite">
            {t.quiz.progress(index + 1, total)}
          </p>
          <Progress value={(index / total) * 100} aria-label={t.quiz.progress(index + 1, total)} />
        </div>

        <div className="pad rounded-xl border-[1.5px] border-line py-[calc(var(--pitch)*0.5)]">
          <div className="pad-line flex items-center justify-between gap-3">
            <h2 className="font-heading text-4xl leading-none font-extrabold break-words [overflow-wrap:anywhere]">{q.word}</h2>
            <Button variant="ink" size="icon-lg" onClick={() => void speak(q.word, { rate: ttsSpeed })} aria-label={`${t.quiz.speak}: ${q.word}`}>
              <Volume2 aria-hidden="true" />
            </Button>
          </div>
          {phonetic && <p className="pad-line text-ink-2">{phonetic}</p>}
          {english && <p className="pad-line">{english}</p>}
        </div>

        <p className="mt-4 mb-2 font-bold">{t.quiz.prompt}</p>
        <ul className="grid gap-3" aria-label={t.quiz.prompt}>
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answerIndex;
            const isChosen = i === chosen;
            const state = !answered ? "idle" : isAnswer ? "right" : isChosen ? "wrong" : "idle";
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => onChoose(i)}
                  data-state={state}
                  className={cn(
                    "pressable group flex min-h-14 w-full items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2 text-left text-lg font-bold text-ink outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    state === "right" && "border-success bg-success/15 disabled:border-success disabled:bg-success/15 disabled:text-ink",
                    state === "wrong" && "border-destructive bg-destructive/10 disabled:border-destructive disabled:bg-destructive/10 disabled:text-ink",
                    state === "idle" &&
                      "border-line bg-card shadow-tile enabled:hover:bg-secondary enabled:active:shadow-pressed disabled:border-line disabled:bg-paper disabled:text-ink-2 disabled:shadow-none",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg font-heading text-lg",
                      state === "right" ? "bg-success text-success-foreground" : state === "wrong" ? "bg-destructive text-destructive-foreground" : "bg-secondary group-enabled:group-hover:bg-card",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    {opt}
                  </span>
                  {state === "right" && <Check aria-hidden="true" className="size-6 shrink-0 text-success" />}
                  {state === "wrong" && <X aria-hidden="true" className="size-6 shrink-0 text-destructive-text" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 mb-3 min-h-[3.5rem]" role="status" aria-live="polite">
          {answered && (
            <div className="flex items-center gap-3">
              {correct && (
                <span ref={stampRef} className="inline-grid size-14 shrink-0 place-items-center">
                  <StampCheck size={52} seed={index} />
                </span>
              )}
              <div>
                <p className="font-heading text-xl font-bold">{correct ? t.quiz.correct : t.quiz.wrong}</p>
                {!correct && <p className="text-ink-2">{t.quiz.answerWas(q.options[q.answerIndex])}</p>}
              </div>
            </div>
          )}
        </div>
        <Button size="lg" className="w-full" disabled={!answered} onClick={onNext}>
          {last ? t.quiz.seeResults : t.quiz.next}
        </Button>
      </div>
    </div>
  );
}

/** One slot of the stamp row: a rubber star stamped for a right answer (staggered, once), an empty dashed ring for a miss. */
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
  const recorded = useRef(false);
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q, i) => picks[i] === q.answerIndex).length;
  // The best score before this attempt, read once at mount (the store is hydrated before any screen renders).
  const [previousBest] = useState(() => useProgress.getState().quizHighScore);
  const highScore = useProgress((s) => s.quizHighScore);
  const stars = useProgress(selectTotalStars);

  // Exactly once per completed quiz, never during render.
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    useProgress.getState().recordQuizResult(score, total);
  }, [score, total]);

  const good = score / total >= 0.6;
  const message = score === total ? t.quiz.messagePerfect : good ? t.quiz.messageGood : t.quiz.messageTry;
  const beaten = previousBest > 0 && score > previousBest;

  return (
    <div className="px-5 lg:px-8">
      <div className="max-w-2xl">
        <section className="rounded-xl bg-paper-2 px-5 py-6" aria-label={t.quiz.scoreLine(score, total)}>
          <div className="flex items-center gap-4">
            <Mascot mood={good ? "cheer" : "think"} size={96} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-baseline gap-x-2 font-heading leading-none font-extrabold" data-testid="quiz-score">
                <span className="text-7xl tabular-nums lg:text-8xl">{score}</span>{" "}
                <span className="text-xl leading-tight font-bold">{t.quiz.scoreRest(total)}</span>
              </h2>
              <p className="mt-2 font-bold text-ink-2">{message}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1" aria-hidden="true" data-testid="quiz-stamps">
            {quiz.questions.map((q, i) => (
              <ResultStamp key={q.id} index={i} earned={picks[i] === q.answerIndex} />
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

        <h3 className="mt-8 mb-2 font-heading text-xl font-bold">{t.quiz.reviewTitle}</h3>
        <ol className="pad rounded-xl border-[1.5px] border-line" aria-label={t.quiz.reviewTitle}>
          {quiz.questions.map((q, i) => {
            const ok = picks[i] === q.answerIndex;
            return (
              <li key={q.id} className="py-[calc(var(--pitch)*0.5)]">
                <p className="pad-line flex items-center gap-2 font-heading text-xl font-bold">
                  <span
                    aria-hidden="true"
                    className={cn("grid size-6 shrink-0 place-items-center rounded-full", ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}
                  >
                    {ok ? <Check className="size-4" strokeWidth={3.2} /> : <X className="size-4" strokeWidth={3.2} />}
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{q.word}</span>
                  <span className="font-body text-sm font-bold text-ink-2">{ok ? t.quiz.gotIt : t.quiz.missed}</span>
                </p>
                <p className="pad-line text-ink-2">
                  {t.quiz.yourAnswer}: <span className="font-bold text-ink">{q.options[picks[i]]}</span>
                </p>
                {!ok && (
                  <p className="pad-line text-ink-2">
                    {t.quiz.rightAnswer}: <span className="font-bold text-ink">{q.options[q.answerIndex]}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={onRetry}>
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
