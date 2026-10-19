/** bookCard strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  statusNew: "Bag-o",
  statusInProgress: "Ginapadayon",
  statusAlmost: "Malapit na!",
  statusDone: "Natapos! 🎉",
  progressText: (pct: number) => `${pct}% natapos na`,
};

const tagalog = {
  statusNew: "Bago",
  statusInProgress: "Isinasagawa",
  statusAlmost: "Malapit na!",
  statusDone: "Natapos! 🎉",
  progressText: (pct: number) => `${pct}% natapos na`,
} satisfies typeof hiligaynon;

export const bookCardStrings = { hiligaynon, tagalog };
