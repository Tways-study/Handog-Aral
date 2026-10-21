/** Celebration moments. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  newSticker: "Bag-o nga sticker!",
  ok: "Sige!",
  seeBook: "Tan-awa sa libro",
  closeLabel: "Isara",
  dialogLabel: "Pagselebrar",
  more: (n: number) => `May ${n} pa nga sunod`,
  stickerBody: (hint: string) => hint,
  wonMatch: "Daog ka!",
};

const tagalog = {
  newSticker: "Bagong sticker!",
  ok: "Sige!",
  seeBook: "Tingnan sa aklat",
  closeLabel: "Isara",
  dialogLabel: "Pagdiriwang",
  more: (n: number) => `May ${n} pa na susunod`,
  stickerBody: (hint: string) => hint,
  wonMatch: "Panalo ka!",
} satisfies typeof hiligaynon;

export const rewardsStrings = { hiligaynon, tagalog };
