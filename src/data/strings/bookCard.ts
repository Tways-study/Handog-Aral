/** bookCard strings (status text on a notebook cover). Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  statusNew: "Bag-o",
  statusInProgress: "Padayon",
  statusDone: "Tapos",
  progressText: (pct: number) => `${pct}% natapos na`,
};

const tagalog = {
  statusNew: "Bago",
  statusInProgress: "Tuloy",
  statusDone: "Tapos",
  progressText: (pct: number) => `${pct}% tapos na`,
} satisfies typeof hiligaynon;

export const bookCardStrings = { hiligaynon, tagalog };
