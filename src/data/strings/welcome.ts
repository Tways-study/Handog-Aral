/** welcome (first-run) strings. Filipino is the shape; English must match it key for key. */
const tagalog = {
  appName: "Handog Aral",
  tagline: "Ang Iyong Gabay sa Pagbasa",
  // REVIEW: native speaker (Filipino).
  owlHello: "Kumusta! Ako si Kuwago. Babasahin natin ang libro mo.",
  // REVIEW: native speaker (Filipino).
  owlHelloName: (name: string) => (name ? `Kumusta, ${name}!` : "Kumusta!"),
  nameLabel: "Ano ang pangalan mo?",
  namePlaceholder: "Isulat ang pangalan mo",
  languageLabel: "Sa anong wika ipapaliwanag ang mga salita?",
  optionEnglish: "English",
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
};

const english = {
  appName: "Handog Aral",
  tagline: "Your Reading Guide",
  owlHello: "Hello! I am Owl. Let's read your book.",
  owlHelloName: (name: string) => (name ? `Hello, ${name}!` : "Hello!"),
  nameLabel: "What is your name?",
  namePlaceholder: "Type your name",
  languageLabel: "Which language should explain the words?",
  optionEnglish: "English",
  optionTagalog: "Filipino",
  start: "Let's start",
  skip: "Skip",
  superTitle: "Your First Superpower",
  superPrompt: "Tap a word you do not know!",
  superHint: "Tap the word with the dot",
  superCheer: "You read it!",
  superSaved: "Saved! This is your first word.",
  superPaperLabel: "Sample page",
  superContinue: "Okay, let's go!",
} satisfies typeof tagalog;

export const welcomeStrings = { tagalog, english };
