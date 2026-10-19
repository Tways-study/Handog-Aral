/** books strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  title: "Mga Libro 📚",
  subtitleCompleted: (n: number) => `${n} libro na ang natapos mo!`,
  subtitleNew: "Pili-a ang imo basahon!",
  statTotal: "Mga Libro",
  statInProgress: "Ginapadayon",
  statCompleted: "Natapos",
};

const tagalog = {
  title: "Mga Libro 📚",
  subtitleCompleted: (n: number) => `${n} libro na ang natapos mo!`,
  subtitleNew: "Piliin ang iyong babasahin!",
  statTotal: "Mga Libro",
  statInProgress: "Isinasagawa",
  statCompleted: "Natapos",
} satisfies typeof hiligaynon;

export const booksStrings = { hiligaynon, tagalog };
