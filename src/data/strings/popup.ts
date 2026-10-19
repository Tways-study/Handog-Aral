/** popup strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  englishLabel: "English",
  translationLabel: "🗣 Hiligaynon",
  exampleLabel: "✏️ Halimbawa",
  speakBtn: "Paminawa",
  speakingBtn: "Itigil",
  saveBtn: "I-save",
  savedBtn: "Natuon Na! ✓",
};

const tagalog = {
  englishLabel: "Ingles",
  translationLabel: "🇵🇭 Filipino",
  exampleLabel: "✏️ Halimbawa",
  speakBtn: "Pakinggan",
  speakingBtn: "Itigil",
  saveBtn: "I-save",
  savedBtn: "Natutuhan Na! ✓",
} satisfies typeof hiligaynon;

export const popupStrings = { hiligaynon, tagalog };
