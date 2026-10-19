"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, RotateCcw, Volume2, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { useMotion } from "@/lib/motion";
import { buildQuiz, MIN_QUIZ_WORDS, type Quiz } from "@/lib/quiz";
import { speak } from "@/lib/tts";
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
        <div className="px-5 lg:px-8" role="status" aria-label={t.quiz.loading}>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <QuizRound key={round} words={words} onRetry={() => setRound((r) => r + 1)} />
      )}
    </PageContainer>
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

  useEffect(() => {
    if (answered && correct) return stampIn(stampRef.current);
  }, [answered, correct, stampIn]);

  return (
    <div className="px-5 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <p className="shrink-0 font-bold" aria-live="polite">
            {t.quiz.progress(index + 1, total)}
          </p>
          <Progress value={(index / total) * 100} aria-label={t.quiz.progress(index + 1, total)} />
        </div>

        <div className="pad rounded-xl border-[1.5px] border-line py-[calc(var(--pitch)*0.5)]">
          <div className="pad-line flex items-center justify-between gap-3">
            <h2 className="font-heading text-4xl leading-none font-extrabold break-words">{q.word}</h2>
            <Button variant="ink" size="icon-lg" onClick={() => void speak(q.word, { rate: ttsSpeed })} aria-label={`${t.quiz.speak}: ${q.word}`}>
              <Volume2 aria-hidden="true" />
            </Button>
          </div>
          <p className="pad-line text-ink-2">{q.phonetic}</p>
          <p className="pad-line">{q.english}</p>
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
                  aria-label={t.quiz.optionLabel(LETTERS[i], opt)}
                  className={
                    "flex min-h-14 w-full items-center gap-3 rounded-lg border-[1.5px] px-3 py-2 text-left text-lg font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring " +
                    (state === "right"
                      ? "border-success bg-success/15 text-ink"
                      : state === "wrong"
                        ? "border-destructive bg-destructive/10 text-ink"
                        : "border-line bg-paper text-ink enabled:hover:bg-paper-2 disabled:opacity-70")
                  }
                >
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md bg-paper-2 font-heading text-lg">
                    {LETTERS[i]}
                  </span>
                  <span className="flex-1" aria-hidden="true">
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
                <span ref={stampRef} className="grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-success text-success">
                  <Check aria-hidden="true" className="size-7" strokeWidth={3} />
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

function QuizResults({ quiz, picks, onRetry }: { quiz: Quiz; picks: number[]; onRetry: () => void }) {
  const t = useT();
  const recorded = useRef(false);
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q, i) => picks[i] === q.answerIndex).length;
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

  return (
    <div className="px-5 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <Mascot mood={good ? "cheer" : "think"} size={88} />
          <div>
            <h2 className="font-heading text-3xl leading-tight font-extrabold" data-testid="quiz-score">
              {t.quiz.scoreLine(score, total)}
            </h2>
            <p className="text-ink-2">{message}</p>
          </div>
        </div>
        <p className="mt-3 font-bold">
          {t.quiz.starsLine(stars)}
          <span className="mx-2 text-ink-2" aria-hidden="true">
            /
          </span>
          {t.quiz.highScoreLine(highScore)}
        </p>

        <h3 className="mt-6 mb-2 font-heading text-xl font-bold">{t.quiz.reviewTitle}</h3>
        <ol className="pad rounded-xl border-[1.5px] border-line" aria-label={t.quiz.reviewTitle}>
          {quiz.questions.map((q, i) => {
            const ok = picks[i] === q.answerIndex;
            return (
              <li key={q.id} className="py-[calc(var(--pitch)*0.5)]">
                <p className="pad-line flex items-center gap-2 font-heading text-xl font-bold">
                  {ok ? <Check aria-hidden="true" className="size-5 text-success" strokeWidth={3} /> : <X aria-hidden="true" className="size-5 text-destructive-text" strokeWidth={3} />}
                  {q.word}
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
