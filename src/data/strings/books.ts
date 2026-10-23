/** books strings. Filipino is the shape; English must match it key for key. */
const tagalog = {
  title: "Mga Aklat",
  subtitleDone: (n: number) => `${n} aklat na ang natapos mo.`,
  subtitleNew: "Piliin ang babasahin mo.",
  shelfLabel: "Mga aklat",
  wordCount: (n: number) => `${n} salita`,
  // REVIEW: native speaker (Filipino).
  emptyTitle: "Wala pang aklat sa estante",
  emptyBody: "Pagbalik mo, may mga aklat nang mababasa.",
};

const english = {
  title: "Books",
  subtitleDone: (n: number) => (n === 1 ? "You have finished 1 book." : `You have finished ${n} books.`),
  subtitleNew: "Pick something to read.",
  shelfLabel: "Books",
  wordCount: (n: number) => (n === 1 ? "1 word" : `${n} words`),
  emptyTitle: "No books on the shelf yet",
  emptyBody: "Come back soon. There will be books to read.",
} satisfies typeof tagalog;

export const booksStrings = { tagalog, english };
