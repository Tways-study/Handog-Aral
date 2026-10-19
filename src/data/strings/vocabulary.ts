/** vocabulary strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  title: "Mga Pulong 🌟",
  subtitleWords: (n: number) => `${n} pulong natuon mo na!`,
  subtitleEmpty: "Wala pa sang natuon nga pulong.",
  filterAll: "Tanan",
  filterEasy: "😊 Dali",
  filterMedium: "🤔 Medyo",
  filterHard: "💪 Budlay",
  statEasy: "😊 Dali",
  statMedium: "🤔 Medyo",
  statHard: "💪 Budlay",
  diffEasy: "Dali",
  diffMedium: "Medyo",
  diffHard: "Budlay",
  emptyTitle: "Wala pa sang natuon nga pulong.",
  emptyBody: "Mag-scan sang libro para magsugod! 📖",
  searchPlaceholder: "Pangita-a ang pulong...",
  noResults: "Wala sang nakit-an. Subukan ang isa pa ka search!",
};

const tagalog = {
  title: "Talasalitaan 🌟",
  subtitleWords: (n: number) => `${n} salita na ang natutuhan mo!`,
  subtitleEmpty: "Wala pang natutunan na salita.",
  filterAll: "Lahat",
  filterEasy: "😊 Madali",
  filterMedium: "🤔 Katamtaman",
  filterHard: "💪 Mahirap",
  statEasy: "😊 Madali",
  statMedium: "🤔 Katamtaman",
  statHard: "💪 Mahirap",
  diffEasy: "Madali",
  diffMedium: "Katamtaman",
  diffHard: "Mahirap",
  emptyTitle: "Wala pang natutunan na salita.",
  emptyBody: "Mag-scan ng libro para makapagsimula! 📖",
  searchPlaceholder: "Hanapin ang salita...",
  noResults: "Walang nahanap. Subukan ang ibang paghahanap!",
} satisfies typeof hiligaynon;

export const vocabularyStrings = { hiligaynon, tagalog };
