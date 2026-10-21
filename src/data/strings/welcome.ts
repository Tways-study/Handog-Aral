/** welcome (first-run) strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  appName: "Handog Aral",
  tagline: "Ang Imo Gabay sa Pagbasa",
  // The owl's voice on the cover. REVIEW: native speaker (Hiligaynon).
  owlHello: "Kamusta! Ako si Kuwago. Basahon ta ang imo libro.",
  // After "Magsugod kita" the owl says the child's name. REVIEW: native speaker (Hiligaynon).
  owlHelloName: (name: string) => (name ? `Kamusta, ${name}!` : "Kamusta!"),
  nameLabel: "Ano ang imo ngalan?",
  namePlaceholder: "Isulat ang imo ngalan",
  languageLabel: "Ano nga pinulongan ang gusto mo?",
  optionHiligaynon: "Hiligaynon",
  optionTagalog: "Filipino",
  start: "Magsugod kita",
  skip: "Laktawan",
  // Step 2, "Una nga Superpower". REVIEW: native speaker (Hiligaynon) for every line below.
  superTitle: "Imo Una nga Superpower",
  superPrompt: "Pindota ang pulong nga indi mo kilala!",
  superHint: "Pindota ang pulong nga may tuldok",
  superCheer: "Nabasa mo na!",
  superSaved: "Natipigan na! Imo ini nga una nga pulong.",
  superPaperLabel: "Sample nga pahina",
  superContinue: "Sige, kadi ta na!",
};

const tagalog = {
  appName: "Handog Aral",
  tagline: "Ang Imo Gabay sa Pagbasa",
  // REVIEW: native speaker (Filipino).
  owlHello: "Kumusta! Ako si Kuwago. Babasahin natin ang libro mo.",
  // REVIEW: native speaker (Filipino).
  owlHelloName: (name: string) => (name ? `Kumusta, ${name}!` : "Kumusta!"),
  nameLabel: "Ano ang pangalan mo?",
  namePlaceholder: "Isulat ang pangalan mo",
  languageLabel: "Anong wika ang gusto mo?",
  optionHiligaynon: "Hiligaynon",
  optionTagalog: "Filipino",
  start: "Magsimula tayo",
  skip: "Laktawan",
  // REVIEW: native speaker (Filipino) for every line below.
  superTitle: "Ang Una Mong Superpower",
  superPrompt: "Pindutin ang salitang hindi mo kilala!",
  superHint: "Pindutin ang salitang may tuldok",
  superCheer: "Nabasa mo na!",
  superSaved: "Naitabi na! Ito ang una mong salita.",
  superPaperLabel: "Sample na pahina",
  superContinue: "Sige, tara na!",
} satisfies typeof hiligaynon;

export const welcomeStrings = { hiligaynon, tagalog };
