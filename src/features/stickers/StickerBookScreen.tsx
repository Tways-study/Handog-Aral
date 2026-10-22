"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Ban, Camera, Check, GraduationCap, Gamepad2, Glasses, Lock, Ribbon, Sparkles, Star, type LucideIcon } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import Owl, { type OwlReaction } from "@/components/owl/Owl";
import StickerArt from "@/components/stickers/StickerArt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/hooks/useT";
import { buzz } from "@/lib/haptics";
import { popIn, wiggle } from "@/lib/motion";
import { play } from "@/lib/sound";
import { isOutfitUnlocked, orderStickers, OUTFITS, OUTFIT_UNLOCKS, stickerTitle } from "@/lib/stickers/catalog";
import { STICKER_IDS, type StickerId } from "@/lib/stickers/ids";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress";
import { selectUnseen, useRewards, useRewardsHydrated } from "@/stores/rewards";
import { useSettings, type OwlOutfit } from "@/stores/settings";

/** How long the page must have been on screen before its NEW markers count as looked at. */
const LOOKED_AT_MS = 1800;

const OUTFIT_ICON: Record<OwlOutfit, LucideIcon> = { none: Ban, glasses: Glasses, cap: GraduationCap, bow: Ribbon };

export default function StickerBookScreen() {
  const t = useT();
  const name = useSettings((s) => s.childName);
  const ready = useRewardsHydrated();
  const earned = useRewards((s) => s.earned);
  const count = Object.keys(earned).length;

  return (
    <PageContainer>
      <PageHeader
        title={t.stickers.title}
        subtitle={t.stickers.subtitle(name)}
      />
      <p className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-mango px-4 font-bold text-mango-fg tabular-nums" data-testid="sticker-count">
        <Star aria-hidden="true" className="size-5" />
        {t.stickers.count(count, STICKER_IDS.length)}
      </p>
      {ready && (
        <Tabs defaultValue="stickers">
          <TabsList className="h-auto! w-full sm:w-fit">
            <TabsTrigger value="stickers" className="min-h-11 min-w-0 flex-1 whitespace-normal sm:flex-none sm:px-6">
              {t.stickers.tabStickers}
            </TabsTrigger>
            <TabsTrigger value="owl" className="min-h-11 min-w-0 flex-1 whitespace-normal sm:flex-none sm:px-6">
              {t.stickers.tabOwl}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stickers" className="mt-2">
            <StickerPage />
          </TabsContent>
          <TabsContent value="owl" className="mt-2">
            <Wardrobe />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}

function StickerPage() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const earned = useRewards((s) => s.earned);
  const seen = useRewards((s) => s.seen);
  const markSeen = useRewards((s) => s.markSeen);
  const looked = useRef(false);
  const count = Object.keys(earned).length;
  const words = useProgress((p) => p.savedWordCount);
  const streak = useProgress((p) => p.streak);
  const order = useMemo(() => orderStickers(earned, { words, streak }), [earned, words, streak]);

  // The NEW markers stay while the child is on the page; they clear once she has really looked
  // (the page was open long enough) and then left. A flash visit keeps them.
  useEffect(() => {
    const clear = () => {
      if (looked.current) for (const sticker of selectUnseen(useRewards.getState())) useRewards.getState().markSeen(sticker);
    };
    const onHide = () => document.visibilityState === "hidden" && clear();
    const id = setTimeout(() => (looked.current = true), LOOKED_AT_MS);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", clear);
    return () => {
      clearTimeout(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", clear);
      clear();
    };
  }, []);

  const fmt = (ms: number) => new Date(ms).toLocaleDateString(language === "tagalog" ? "fil-PH" : "en-PH", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-4">
      {count === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-paper-2 px-5 py-8 text-center" data-testid="stickers-empty">
          <Owl mood="think" size={112} />
          <h2 className="font-heading text-2xl font-bold">{t.stickers.emptyTitle}</h2>
          <p className="max-w-prose text-ink-2">{t.stickers.emptyBody}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/scan">
                <Camera aria-hidden="true" />
                {t.stickers.emptyScan}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/play">
                <Gamepad2 aria-hidden="true" />
                {t.stickers.emptyPlay}
              </Link>
            </Button>
          </div>
        </div>
      )}
      <ul
        aria-label={t.stickers.gridLabel}
        className="pad grid grid-cols-2 gap-x-3 gap-y-5 py-3 sm:grid-cols-3 sm:gap-x-4 sm:py-4 lg:grid-cols-4 [&>li]:min-w-0"
        data-testid="sticker-grid"
      >
        {order.map((id, i) => {
          const at = earned[id];
          const isNew = at !== undefined && !seen.includes(id);
          return at !== undefined ? (
            <EarnedSticker key={id} id={id} index={i} date={fmt(at)} isNew={isNew} onSeen={() => markSeen(id)} />
          ) : (
            <LockedSticker key={id} id={id} />
          );
        })}
      </ul>
    </div>
  );
}

const tilt = (i: number) => ((i % 5) - 2) * 1.2;

function EarnedSticker({ id, index, date, isNew, onSeen }: { id: StickerId; index: number; date: string; isNew: boolean; onSeen: () => void }) {
  const t = useT();
  const language = useSettings((s) => s.language);
  const art = useRef<HTMLSpanElement>(null);
  const title = stickerTitle(id, language);
  return (
    <li data-sticker={id} data-state="earned">
      <button
        type="button"
        onClick={() => {
          if (art.current) popIn(art.current);
          play("pop");
          buzz("tap");
          onSeen();
        }}
        className="pressable relative flex h-full w-full flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 text-center outline-none hover:bg-paper-2 focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isNew && (
          <span
            data-testid="new-marker"
            className="absolute -top-2 -right-1 inline-flex items-center gap-1 rounded-full bg-mango px-2 py-0.5 text-xs font-extrabold text-mango-fg shadow-tile"
          >
            <Sparkles aria-hidden="true" className="size-3.5" />
            {t.stickers.newMarker}
          </span>
        )}
        <span ref={art} className="inline-grid" style={{ transform: `rotate(${tilt(index)}deg)` }}>
          <StickerArt id={id} size={96} />
        </span>
        <span className="font-heading text-base leading-tight font-bold text-balance [overflow-wrap:anywhere]">{title}</span>
        <span className="text-sm text-ink-2">{t.stickers.earnedOn(date)}</span>
      </button>
    </li>
  );
}

function LockedSticker({ id }: { id: StickerId }) {
  const t = useT();
  const language = useSettings((s) => s.language);
  return (
    <li data-sticker={id} data-state="locked">
      <div className="flex h-full flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line-strong bg-paper/80 px-2 pt-4 pb-3 text-center">
        <StickerArt id={id} locked size={96} />
        <span className="text-sm font-bold text-ink-2">{t.stickers.locked}</span>
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{t.stickers.hints[id]}</span>
        <span className="sr-only">{stickerTitle(id, language)}</span>
      </div>
    </li>
  );
}

function Wardrobe() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const outfit = useSettings((s) => s.owlOutfit);
  const setOwlOutfit = useSettings((s) => s.setOwlOutfit);
  const earned = useRewards((s) => s.earned);
  const [reaction, setReaction] = useState<OwlReaction | undefined>();
  const itemRefs = useRef<Partial<Record<OwlOutfit, HTMLElement | null>>>({});

  function choose(next: string) {
    if (!next) return;
    const value = next as OwlOutfit;
    if (!isOutfitUnlocked(value, earned)) {
      const node = itemRefs.current[value];
      if (node) wiggle(node);
      play("error-soft");
      return;
    }
    setOwlOutfit(value);
    setReaction((r) => ({ kind: "cheer", key: (r?.key ?? 0) + 1 }));
    play("pop");
    buzz("tap");
  }

  return (
    <div className="flex flex-col items-center gap-4 pb-4" data-testid="wardrobe">
      <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-paper-2 px-4 py-6 text-center">
        <Owl mood="idle" outfit={outfit} size={160} reaction={reaction} interactive onTap={() => setReaction((r) => ({ kind: "hop", key: (r?.key ?? 0) + 1 }))} />
        <h2 className="font-heading text-2xl font-bold">{t.stickers.wardrobeTitle}</h2>
        <p className="max-w-prose text-ink-2">{t.stickers.wardrobeBody}</p>
        <p className="font-bold" role="status" data-testid="wearing">
          {t.stickers.wearing(t.stickers.outfits[outfit])}
        </p>
      </div>
      <ToggleGroup
        type="single"
        value={outfit}
        onValueChange={choose}
        aria-label={t.stickers.outfitGroup}
        spacing={2}
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {OUTFITS.map((o) => {
          const unlocked = isOutfitUnlocked(o, earned);
          const Icon = OUTFIT_ICON[o];
          return (
            <ToggleGroupItem
              key={o}
              value={o}
              ref={(node) => {
                itemRefs.current[o] = node;
              }}
              aria-disabled={!unlocked || undefined}
              data-locked={!unlocked || undefined}
              className={cn(
                "relative h-auto min-h-24 flex-col gap-1 rounded-2xl border-[1.5px] border-line bg-card px-2 py-3 text-ink shadow-tile data-[state=on]:border-ink data-[state=on]:bg-mango data-[state=on]:text-mango-fg",
                !unlocked && "border-dashed border-line-strong bg-paper text-ink-2 shadow-none",
              )}
            >
              {unlocked ? <Icon aria-hidden="true" className="size-6" /> : <Lock aria-hidden="true" className="size-6" />}
              <span className="font-heading text-base font-bold">{t.stickers.outfits[o]}</span>
              {outfit === o && <Check aria-hidden="true" className="absolute top-2 right-2 size-5" strokeWidth={3} />}
              {o !== "none" && !unlocked && (
                <span className="text-xs leading-tight font-normal text-balance">{t.stickers.unlockedBy(stickerTitle(OUTFIT_UNLOCKS[o], language))}</span>
              )}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
