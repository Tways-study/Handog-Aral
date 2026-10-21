/**
 * Settings is the adults' screen (parents and teachers), so every label is plain English in both
 * languages. The table is shared; Tagalog is the same object so the shape check holds.
 */
const english = {
  title: "Settings",
  subtitle: "For parents and teachers. Changes apply right away.",

  childHeading: "Child",
  nameLabel: "Child's name",
  nameHelp: "Shown in the greeting on the home screen.",
  namePlaceholder: "Type a name",

  languageHeading: "Language",
  languageLabel: "Home language",
  languageHelp: "Word meanings and the app's child-facing text use this language.",
  hiligaynon: "Hiligaynon",
  tagalog: "Filipino",

  readingHeading: "Reading",
  fontSizeLabel: "Text size",
  fontSizeHelp: "Scales the whole app, including the ruled lines.",
  small: "Small",
  medium: "Medium",
  large: "Large",
  dyslexiaLabel: "Dyslexia-friendly font",
  dyslexiaHelp: "Uses OpenDyslexic with wider spacing everywhere.",
  dyslexiaPreview: "The quick brown fox jumps over the lazy dog.",
  overlayLabel: "Colour overlay",
  overlayHelp: "Tints the paper behind the text. Some readers find a tint calmer.",
  overlayNone: "None",
  overlayYellow: "Yellow",
  overlayBlue: "Blue",
  overlayPink: "Pink",
  overlayPreview: "The owl reads a page by lamplight.",
  speedLabel: "Speech speed",
  speedHelp: "How fast words and sentences are read aloud.",
  slow: "Slow",
  normal: "Normal",
  fast: "Fast",
  listen: "Listen",
  listenSample: "The owl reads one page at a time.",

  appearanceHeading: "Appearance",
  themeLabel: "Theme",
  themeHelp: "Light is a day pad. Dark is a night pad.",
  light: "Light",
  dark: "Dark",
  system: "Same as device",

  appHeading: "App",

  offlineHeading: "Offline",
  connectionLabel: "Connection",
  online: "Online",
  offline: "Offline",
  packLabel: "Offline scanning pack",
  packHelp: "With the pack downloaded, scanning book pages works without internet.",
  packReady: (size: string) => `Downloaded (${size})`,
  packPartial: (done: string, total: string) => `Partly downloaded (${done} of ${total})`,
  packMissing: (total: string) => `Not downloaded (${total})`,
  packChecking: "Checking...",
  packUnknown: "Not available",
  download: "Download offline pack",
  downloadAgain: "Check pack again",
  downloading: "Downloading...",
  downloadingPct: (pct: number) => `Downloading, ${pct}%`,
  needOnline: "Connect to the internet to download.",
  packDone: "Offline pack downloaded. Scanning now works without internet.",
  packFailed: "The download did not finish. Try again when the connection is steadier.",
  pendingLabel: "Waiting lookups",
  pendingHelp: "Words looked up offline get a fuller explanation once you are back online.",
  pendingCount: (n: number) => (n === 0 ? "None waiting" : n === 1 ? "1 word waiting" : `${n} words waiting`),

  dataHeading: "Data",
  resetLabel: "Reset all progress",
  resetHelp: "Starts the child over on this device. Settings are kept.",
  resetButton: "Reset progress",
  resetTitle: "Reset all progress?",
  resetBody: "This cannot be undone. On this device it will delete:",
  resetItems: ["All saved words", "Stars, quiz scores and the daily streak", "Book progress", "Saved explanations and lookups waiting to upgrade"],
  resetKept: "Name, language and reading settings stay as they are.",
  resetCancel: "Keep my progress",
  resetConfirm: "Yes, delete everything",
  resetDone: "Progress was reset.",
  resetFailed: "Could not reset. Please try again.",

  aboutHeading: "About",
  appName: "Handog Aral",
  tagline: "Ang Imo Gabay sa Pagbasa",
  version: (v: string) => `Version ${v}`,
  owlCredit: "The owl is the reading companion. It keeps watch over every page.",
};

const hiligaynon = english;
const tagalog = english satisfies typeof hiligaynon;

export const settingsStrings = { hiligaynon, tagalog };
