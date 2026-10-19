/** welcome (first-run) strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  appName: "Handog Aral",
  tagline: "Ang Imo Gabay sa Pagbasa",
  intro: "Kamusta! Tabangan ta ikaw magbasa sang English.",
  nameLabel: "Ano ang imo ngalan?",
  namePlaceholder: "Isulat ang imo ngalan",
  languageLabel: "Ano nga pinulongan ang gusto mo?",
  optionHiligaynon: "Hiligaynon",
  optionTagalog: "Filipino",
  start: "Magsugod kita",
  skip: "Laktawan",
};

const tagalog = {
  appName: "Handog Aral",
  tagline: "Ang Imo Gabay sa Pagbasa",
  intro: "Kumusta! Tutulungan kitang magbasa ng English.",
  nameLabel: "Ano ang pangalan mo?",
  namePlaceholder: "Isulat ang pangalan mo",
  languageLabel: "Anong wika ang gusto mo?",
  optionHiligaynon: "Hiligaynon",
  optionTagalog: "Filipino",
  start: "Magsimula tayo",
  skip: "Laktawan",
} satisfies typeof hiligaynon;

export const welcomeStrings = { hiligaynon, tagalog };
