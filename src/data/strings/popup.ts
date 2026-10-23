/** word panel strings. Filipino is the shape; English must match it key for key. */
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
};

const english = {
  sheetTitle: (w: string) => `Meaning of ${w}`,
  englishLabel: "In Filipino",
  translationLabel: "In English",
  speakBtn: "Listen",
  speakingBtn: "Listening...",
  saveBtn: "Save",
  savedBtn: "Saved",
  starEarned: "You earned a star",
  pending: "Looking up the meaning...",
  sourceAi: "Explained by AI",
  sourceCurated: "From the app's dictionary",
  sourceDictionary: "From a dictionary",
  sourceOffline: "This meaning is simple for now. It gets clearer when you are online.",
  close: "Close",
  firstTap: "You read it!",
  firstSave: "Your first word! Awesome!",
  savedAnnounce: (w: string) => `Saved ${w}`,
  listenWordHint: "Listen to how to read it",
} satisfies typeof tagalog;

export const popupStrings = { tagalog, english };
