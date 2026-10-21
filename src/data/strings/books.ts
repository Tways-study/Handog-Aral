/** books strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  title: "Mga Libro",
  subtitleDone: (n: number) => `${n} ka libro ang natapos mo na.`,
  subtitleNew: "Pili-a ang imo basahon.",
  shelfLabel: "Mga libro",
  wordCount: (n: number) => `${n} ka pulong`,
};

const tagalog = {
  title: "Mga Aklat",
  subtitleDone: (n: number) => `${n} aklat na ang natapos mo.`,
  subtitleNew: "Piliin ang babasahin mo.",
  shelfLabel: "Mga aklat",
  wordCount: (n: number) => `${n} salita`,
} satisfies typeof hiligaynon;

export const booksStrings = { hiligaynon, tagalog };
