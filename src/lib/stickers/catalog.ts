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
