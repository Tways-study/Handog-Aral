import { homeStrings } from "./strings/home";
import { booksStrings } from "./strings/books";
import { vocabularyStrings } from "./strings/vocabulary";
import { scanStrings } from "./strings/scan";
import { quizStrings } from "./strings/quiz";
import { settingsStrings } from "./strings/settings";
import { popupStrings } from "./strings/popup";
import { bookCardStrings } from "./strings/bookCard";
import { welcomeStrings } from "./strings/welcome";
import { systemStrings } from "./strings/system";
import { stickersStrings } from "./strings/stickers";
import { playStrings } from "./strings/play";
import { rewardsStrings } from "./strings/rewards";

/**
 * Core strings (nav, difficulty, shell) live here; each feature owns its own file under
 * ./strings/. Filipino is the shape: English must match it key for key (see `satisfies`).
 */
const tagalog = {
    nav: {
      home: "Tahanan",
      books: "Mga Libro",
      scan: "I-Scan",
      vocabulary: "Salita",
      settings: "Setting",
    },
    difficulty: { easy: "Madali", medium: "Katamtaman", hard: "Mahirap" },
    shell: {
      navHome: "Tahanan",
      navBooks: "Aklat",
      navScan: "I-scan",
      navWords: "Salita",
      navQuiz: "Pagsusulit",
      navSettings: "Settings",
      appName: "Handog Aral",
      mainNavLabel: "Pangunahing menu",
      skipToContent: "Lumaktaw sa nilalaman",
      loading: "Inihahanda ang iyong pad...",
      offlineBanner: "Walang internet. Gumagana pa rin ang app, pero mas payak ang mga kahulugan hanggang makakonekta ulit.",
      offlinePageTitle: "Walang internet",
      offlinePageBody: "Hindi mabuksan ang pahinang ito kapag walang koneksyon. Nandito pa rin ang mga aklat at salitang nakatipon na sa telepono.",
      offlineRetry: "Subukan ulit",
      offlineHome: "Bumalik sa Tahanan",
      updateAvailable: "May bagong bersyon ng app.",
      updateAction: "I-update",
      upgradedWords: (n: number) => `Mas malinaw na ang ${n} salita.`,
    },
    home: homeStrings.tagalog,
    books: booksStrings.tagalog,
    vocabulary: vocabularyStrings.tagalog,
    scan: scanStrings.tagalog,
    quiz: quizStrings.tagalog,
    settings: settingsStrings.tagalog,
    popup: popupStrings.tagalog,
    bookCard: bookCardStrings.tagalog,
    welcome: welcomeStrings.tagalog,
    system: systemStrings.tagalog,
    stickers: stickersStrings.tagalog,
    play: playStrings.tagalog,
    rewards: rewardsStrings.tagalog,
};

const english = {
    nav: {
      home: "Home",
      books: "Books",
      scan: "Scan",
      vocabulary: "Stars",
      settings: "Settings",
    },
    difficulty: { easy: "Easy", medium: "Medium", hard: "Hard" },
    shell: {
      navHome: "Home",
      navBooks: "Books",
      navScan: "Scan",
      navWords: "Words",
      navQuiz: "Quiz",
      navSettings: "Settings",
      appName: "Handog Aral",
      mainNavLabel: "Main menu",
      skipToContent: "Skip to content",
      loading: "Getting your pad ready...",
      offlineBanner: "No internet. The app still works, but meanings are simpler until you are back online.",
      offlinePageTitle: "You are offline",
      offlinePageBody: "This page cannot open without a connection. The books and words already saved on your phone are still here.",
      offlineRetry: "Try again",
      offlineHome: "Back to Home",
      updateAvailable: "A new version of the app is ready.",
      updateAction: "Update",
      upgradedWords: (n: number) => (n === 1 ? "1 word is clearer now." : `${n} words are clearer now.`),
    },
    home: homeStrings.english,
    books: booksStrings.english,
    vocabulary: vocabularyStrings.english,
    scan: scanStrings.english,
    quiz: quizStrings.english,
    settings: settingsStrings.english,
    popup: popupStrings.english,
    bookCard: bookCardStrings.english,
    welcome: welcomeStrings.english,
    system: systemStrings.english,
    stickers: stickersStrings.english,
    play: playStrings.english,
    rewards: rewardsStrings.english,
} satisfies typeof tagalog;

export const translations = { tagalog, english };

export type Translations = typeof tagalog;
