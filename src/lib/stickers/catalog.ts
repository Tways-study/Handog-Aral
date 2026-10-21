import type { OwlOutfit } from "@/stores/settings";
import { stickersStrings } from "@/data/strings/stickers";
import type { Language } from "@/shared/schemas";
import { STICKER_RULES, type StickerRule } from "./evaluate";
import { STICKER_IDS, type StickerId } from "./ids";

/** Which sticker unlocks which owl outfit. */
export const OUTFIT_UNLOCKS: Record<Exclude<OwlOutfit, "none">, StickerId> = {
  glasses: "five-words",
  cap: "first-book",
  bow: "streak-3",
};

export const OUTFITS: readonly OwlOutfit[] = ["none", "glasses", "cap", "bow"];

export interface StickerEntry {
  id: StickerId;
  /** The outfit this sticker unlocks, if any. */
  outfit: Exclude<OwlOutfit, "none"> | null;
  rule: StickerRule;
}

export const STICKER_CATALOG: readonly StickerEntry[] = STICKER_IDS.map((id) => ({
  id,
  outfit: (Object.keys(OUTFIT_UNLOCKS) as (keyof typeof OUTFIT_UNLOCKS)[]).find((o) => OUTFIT_UNLOCKS[o] === id) ?? null,
  rule: STICKER_RULES[id],
}));

export function stickerTitle(id: StickerId, language: Language): string {
  return stickersStrings[language].titles[id];
}

/** The one-line "how to earn" hint. */
export function stickerHint(id: StickerId, language: Language): string {
  return stickersStrings[language].hints[id];
}

/** An outfit is wearable when it is "none" or its sticker is earned. */
export function isOutfitUnlocked(outfit: OwlOutfit, earned: Partial<Record<StickerId, number>>): boolean {
  return outfit === "none" || earned[OUTFIT_UNLOCKS[outfit]] !== undefined;
}

/**
 * How far a locked sticker is, roughly: words and streak stickers by what is left to reach, a one-tap first-time
 * sticker as one step, the long ones last. Only used to order the book (nearest first), never to award anything.
 */
function stepsLeft(id: StickerId, progress: { words: number; streak: number }): number {
  const words: Partial<Record<StickerId, number>> = { "first-word": 1, "five-words": 5, "ten-words": 10, "twenty-five-words": 25 };
  const streak: Partial<Record<StickerId, number>> = { "streak-3": 3, "streak-7": 7 };
  if (words[id] !== undefined) return Math.max(1, words[id]! - progress.words);
  if (streak[id] !== undefined) return Math.max(1, streak[id]! - progress.streak);
  if (id === "first-book" || id === "all-books") return 40;
  return 2;
}

/** Earned first (catalog order), then the locked ones the child is nearest to; ties keep catalog order. */
export function orderStickers(earned: Partial<Record<StickerId, number>>, progress: { words: number; streak: number }): StickerId[] {
  const got = STICKER_IDS.filter((id) => earned[id] !== undefined);
  const rest = STICKER_IDS.filter((id) => earned[id] === undefined)
    .map((id, i) => ({ id, i, d: stepsLeft(id, progress) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.id);
  return [...got, ...rest];
}
