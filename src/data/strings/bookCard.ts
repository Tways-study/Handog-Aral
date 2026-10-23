/** bookCard strings (status text on a notebook cover). Filipino is the shape; English must match it key for key. */
const tagalog = {
  statusNew: "Bago",
  statusInProgress: "Tuloy",
  statusDone: "Tapos",
  progressText: (pct: number) => `${pct}% tapos na`,
};

const english = {
  statusNew: "New",
  statusInProgress: "Keep going",
  statusDone: "Done",
  progressText: (pct: number) => `${pct}% done`,
} satisfies typeof tagalog;

export const bookCardStrings = { tagalog, english };
