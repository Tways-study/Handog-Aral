/** word panel strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  sheetTitle: (w: string) => `Kahulugan sang ${w}`,
  englishLabel: "Sa English",
  translationLabel: "Sa Hiligaynon",
  speakBtn: "Pamatii",
  speakingBtn: "Ginapamatii...",
  saveBtn: "Tipigi",
  savedBtn: "Natipigan na",
  starEarned: "Nakakuha ka sang bituon",
  pending: "Ginapangita ang kahulugan...",
  sourceAi: "Gin-explain sang AI",
  sourceCurated: "Halin sa diksyunaryo sang app",
  sourceDictionary: "Halin sa diksyunaryo",
  sourceOffline: "Simple lang ini nga kahulugan karon. Mas klaro na ini kon may internet.",
  close: "Isara",
  firstTap: "Nabasa mo na!",
  firstSave: "Una mo ini nga pulong! Ayos!",
  savedAnnounce: (w: string) => `Natipigan ang ${w}`,
  listenWordHint: "Pamatii kon paano ini basahon",
};

const tagalog = {
  sheetTitle: (w: string) => `Kahulugan ng ${w}`,
  englishLabel: "Sa English",
  translationLabel: "Sa Filipino",
  speakBtn: "Pakinggan",
  speakingBtn: "Pinakikinggan...",
  saveBtn: "I-save",
  savedBtn: "Naka-save na",
  starEarned: "Nakakuha ka ng bituin",
  pending: "Hinahanap ang kahulugan...",
  sourceAi: "Ipinaliwanag ng AI",
  sourceCurated: "Mula sa diksyunaryo ng app",
  sourceDictionary: "Mula sa diksyunaryo",
  sourceOffline: "Payak lang ang kahulugang ito ngayon. Magiging mas malinaw ito kapag may internet.",
  close: "Isara",
  firstTap: "Nabasa mo na!",
  firstSave: "Una mo itong salita! Ang galing!",
  savedAnnounce: (w: string) => `Na-save ang ${w}`,
  listenWordHint: "Pakinggan kung paano ito basahin",
} satisfies typeof hiligaynon;

export const popupStrings = { hiligaynon, tagalog };
