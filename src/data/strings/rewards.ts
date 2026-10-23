/** Celebration moments. Filipino is the shape; English must match it key for key. */
const tagalog = {
  newSticker: "Bagong sticker!",
  ok: "Sige!",
  seeBook: "Tingnan sa aklat",
  closeLabel: "Isara",
  dialogLabel: "Pagdiriwang",
  more: (n: number) => `May ${n} pa na susunod`,
  outfitUnlocked: (name: string) => `Bagong isusuot ng kuwago: ${name}`,
};

const english = {
  newSticker: "New sticker!",
  ok: "Okay!",
  seeBook: "See in the book",
  closeLabel: "Close",
  dialogLabel: "Celebration",
  more: (n: number) => `${n} more coming up`,
  outfitUnlocked: (name: string) => `New owl outfit: ${name}`,
} satisfies typeof tagalog;

export const rewardsStrings = { tagalog, english };
