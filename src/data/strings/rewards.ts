/** Celebration moments. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  newSticker: "Bag-o nga sticker!",
  ok: "Sige!",
  seeBook: "Tan-awa sa libro",
  closeLabel: "Isara",
  dialogLabel: "Pagselebrar",
  more: (n: number) => `May ${n} pa nga sunod`,
  outfitUnlocked: (name: string) => `Bag-o nga isul-ob sang kuwago: ${name}`,
};

const tagalog = {
  newSticker: "Bagong sticker!",
  ok: "Sige!",
  seeBook: "Tingnan sa aklat",
  closeLabel: "Isara",
  dialogLabel: "Pagdiriwang",
  more: (n: number) => `May ${n} pa na susunod`,
  outfitUnlocked: (name: string) => `Bagong isusuot ng kuwago: ${name}`,
} satisfies typeof hiligaynon;

export const rewardsStrings = { hiligaynon, tagalog };
