"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, RotateCcw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import CardBack from "@/components/art/CardBack";
import Owl, { type OwlReaction } from "@/components/owl/Owl";
import SpeechTag from "@/features/home/SpeechTag";
import StampCheck from "@/components/StampCheck";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useT } from "@/hooks/useT";
import { buzz } from "@/lib/haptics";
import {
  bonusStarsFor,
  buildDeck,
  canPlay,
  flip,
  isMatched,
  MIN_MATCH_WORDS,
  newGame,
  pairableWords,
  resolveMismatch,
  type MatchCard,
  type MatchGame,
} from "@/lib/match";
import { confettiBurst, flipCard, popIn } from "@/lib/motion";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useRewards } from "@/stores/rewards";
import type { SavedWord } from "@/stores/db";

/** A wrong pair stays visible this long, then flips back by itself (a tap flips it back sooner). */
export const MISMATCH_MS = 900;

export default function MatchScreen() {
  const t = useT();
  const words = useSavedWords();
  const [round, setRound] = useState(0);

  return (
    <PageContainer>
      <PageHeader title={t.play.title} subtitle={t.play.subtitle} />
      {words === null ? (
        <div role="status" aria-busy="true" aria-label={t.play.loading} className="grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : !canPlay(words) ? (
        <NotEnough have={pairableWords(words).length} />
      ) : (
        <Round key={round} words={words} onAgain={() => setRound((r) => r + 1)} />
      )}
    </PageContainer>
  );
}

function NotEnough({ have }: { have: number }) {
  const t = useT();
  return (
    <div className="flex max-w-2xl flex-col items-center gap-4 rounded-xl bg-paper-2 px-6 py-10 text-center" data-testid="play-not-enough">
      <Owl mood="think" size={112} />
      <h2 className="font-heading text-2xl font-bold">{t.play.notEnoughTitle}</h2>
      <p className="max-w-prose text-ink-2">{t.play.notEnoughBody(have, MIN_MATCH_WORDS)}</p>
      <Button asChild size="lg">
        <Link href="/scan">
          <Camera aria-hidden="true" />
          {t.play.scanBtn}
        </Link>
      </Button>
    </div>
  );
}

function Round({ words, onAgain }: { words: SavedWord[]; onAgain: () => void }) {
  const t = useT();
  const [game, setGame] = useState<MatchGame>(() => newGame(buildDeck(words)!));
  const gameRef = useRef(game);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState("");
  const [owlSays, setOwlSays] = useState<"start" | "match" | "miss">("start");
  const [reaction, setReaction] = useState<OwlReaction | undefined>();
  const [stars, setStars] = useState(0);
  const won = useRef(false);
  const grid = useRef<HTMLUListElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const commit = useCallback((next: MatchGame) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onFlip = useCallback(
    (index: number) => {
      const before = gameRef.current;
      const next = flip(before, index);
      if (next === before) return;
      if (timer.current) clearTimeout(timer.current);
      commit(next);
      const card = next.cards[index];
      if (next.matchedPairs.length > before.matchedPairs.length) {
        play("chime");
        buzz("tap");
        setOwlSays("match");
        setReaction({ kind: "cheer", key: Date.now() });
        setMessage(t.play.matchMsg(next.cards[index].kind === "word" ? card.text : next.cards.find((c) => c.pairId === card.pairId && c.kind === "word")!.text));
      } else if (next.mismatch) {
        play("error-soft");
        setOwlSays("miss");
        setReaction({ kind: "think", key: Date.now() });
        setMessage(t.play.missMsg);
        const moves = next.moves;
        timer.current = setTimeout(() => {
          if (gameRef.current.mismatch && gameRef.current.moves === moves) commit(resolveMismatch(gameRef.current));
        }, MISMATCH_MS);
      } else {
        play("flip");
        setMessage(t.play.flipMsg(card.text));
      }
    },
    [commit, t],
  );

  // The win happens exactly once per round.
  useEffect(() => {
    if (!game.won || won.current) return;
    won.current = true;
    const rewards = useRewards.getState();
    const before = rewards.bonusStars;
    rewards.addBonusStars(bonusStarsFor(game.moves, game.pairs));
    setStars(useRewards.getState().bonusStars - before);
    rewards.recordEvent({ type: "match-won" });
    play("chime");
    buzz("success");
    confettiBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.3 }, { count: 16 });
  }, [game.won, game.moves, game.pairs]);

  function onKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (!grid.current) return;
    const cols = columnsNow(grid.current);
    const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols } as Record<string, number | undefined>)[e.key];
    if (!step) return;
    const buttons = Array.from(grid.current.querySelectorAll<HTMLButtonElement>("button"));
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    const to = Math.max(0, Math.min(buttons.length - 1, at + step));
    e.preventDefault();
    buttons[to].focus();
  }

  if (game.won) return <Win game={game} stars={stars} onAgain={onAgain} />;

  const owlLine = owlSays === "match" ? t.play.owlMatch : owlSays === "miss" ? t.play.owlMiss : t.play.owlStart;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
      {/* The owl cheers a match and thinks over a miss. Above the board on a phone, the quiet right column at lg+. */}
      <div className="mb-3 lg:order-2 lg:sticky lg:top-6 lg:mb-0 lg:flex lg:flex-col lg:items-center lg:gap-4 lg:pt-6">
        <div className="flex items-end gap-2 lg:flex-col lg:items-center lg:gap-3">
          <SpeechTag tail={isDesktop ? "bottom" : "right"} className="min-w-0 flex-1 px-3.5 py-2.5 lg:flex-none lg:text-center" data-testid="owl-says">
            <p className="text-[0.9375rem] leading-snug font-bold lg:text-base">{owlLine}</p>
          </SpeechTag>
          <Owl priority="hero" size={isDesktop ? 152 : 80} mood="idle" reaction={reaction} className="shrink-0" />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-bold lg:mt-0 lg:flex-col lg:gap-1 lg:text-center">
          <p className="tabular-nums" data-testid="moves">
            {t.play.moves}: <span data-testid="moves-count">{game.moves}</span>
          </p>
          <p className="tabular-nums text-ink-2">{t.play.pairs(game.matchedPairs.length, game.pairs)}</p>
        </div>
      </div>
      <ul
        ref={grid}
        aria-label={t.play.boardLabel}
        onKeyDown={onKeyDown}
        className="pad grid grid-cols-2 gap-2 p-2 before:hidden min-[340px]:grid-cols-3 sm:grid-cols-4 sm:gap-3 sm:p-4 lg:order-1 lg:max-w-2xl [html.font-large_&]:max-sm:grid-cols-2"
        data-testid="board"
      >
        {game.cards.map((card, i) => (
          <li key={card.id} className="min-w-0">
            <Card card={card} index={i} up={game.faceUp.includes(i) || isMatched(game, i)} matched={isMatched(game, i)} onFlip={() => onFlip(i)} />
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status" aria-live="polite" data-testid="announce">
        {message}
      </p>
    </div>
  );
}

function columnsNow(el: HTMLElement): number {
  return getComputedStyle(el).gridTemplateColumns.split(" ").length || 3;
}

function Card({ card, index, up, matched, onFlip }: { card: MatchCard; index: number; up: boolean; matched: boolean; onFlip: () => void }) {
  const t = useT();
  const inner = useRef<HTMLSpanElement>(null);
  const prev = useRef(false);
  const stamp = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prev.current === up) return;
    prev.current = up;
    return flipCard(inner.current, up);
  }, [up]);
  useEffect(() => {
    if (matched && stamp.current) return popIn(stamp.current);
  }, [matched]);

  return (
    <button
      type="button"
      onClick={onFlip}
      data-state={matched ? "matched" : up ? "up" : "down"}
      data-kind={card.kind}
      className="pressable relative block h-24 w-full rounded-2xl outline-none [perspective:700px] focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-32"
    >
      <span ref={inner} className="absolute inset-0 block [transform-style:preserve-3d]">
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] border-indigo bg-indigo text-indigo-fg shadow-tile [backface-visibility:hidden]"
          aria-hidden={up || undefined}
        >
          <CardBack className="w-11 sm:w-14" />
          <span aria-hidden="true" className="rounded-md bg-paper px-2.5 font-heading text-base leading-snug sm:text-lg font-bold text-ink tabular-nums">
            {index + 1}
          </span>
          {!up && <span className="sr-only">{t.play.faceDownIndex(index + 1)}</span>}
        </span>
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] bg-card p-2 text-center shadow-tile [backface-visibility:hidden] [transform:rotateY(180deg)]",
            matched ? "border-success border-2" : "border-ink",
          )}
          aria-hidden={!up || undefined}
        >
          <span
            className={cn(
              "font-bold [overflow-wrap:anywhere] text-ink",
              card.kind === "word" ? "font-heading text-lg leading-tight sm:text-xl" : "text-sm leading-tight sm:text-base",
            )}
          >
            <span className="sr-only">{card.kind === "word" ? t.play.wordCard("") : t.play.meaningCard("")}</span>
            {card.text}
          </span>
          {matched && (
            <span ref={stamp} className="absolute -top-2 -right-2 inline-grid" data-testid="match-stamp">
              <StampCheck size={30} seed={index} />
              <span className="sr-only">{t.play.matched}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function Win({ game, stars, onAgain }: { game: MatchGame; stars: number; onAgain: () => void }) {
  const t = useT();
  const words = useMemo(() => game.cards.filter((c) => c.kind === "word"), [game.cards]);
  return (
    <div className="flex max-w-2xl flex-col gap-4" data-testid="play-win">
      <section className="flex flex-col items-center gap-3 rounded-xl bg-paper-2 px-5 py-6 text-center" role="status">
        <Owl mood="cheer" size={128} reaction={{ kind: "cheer", key: 1 }} />
        <h2 className="font-heading text-3xl font-extrabold">{t.play.winTitle}</h2>
        <p className="font-bold tabular-nums">{t.play.winBody(game.moves)}</p>
        {stars > 0 && <p className="font-bold" data-testid="win-stars">{t.play.starsEarned(stars)}</p>}
      </section>
      <ul className="pad py-[calc(var(--pitch)*0.5)]" aria-label={t.play.title}>
        {words.map((w) => (
          <li key={w.id} className="pad-line flex flex-wrap items-center gap-x-2">
            <StampCheck size={24} seed={w.text.length} className="shrink-0" />
            <span className="font-heading text-lg font-bold">{w.text}</span>
            <span className="text-ink-2">{game.cards.find((c) => c.pairId === w.pairId && c.kind === "meaning")?.text}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={onAgain}>
          <RotateCcw aria-hidden="true" />
          {t.play.playAgain}
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/words">{t.play.backToWords}</Link>
        </Button>
      </div>
    </div>
  );
}
