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

/**
 * Core strings (nav, difficulty, shell) live here; each feature owns its own file under
 * ./strings/. Hiligaynon is the shape: Tagalog must match it key for key (see `satisfies`).
 */
const hiligaynon = {
    nav: {
      home: "Balay",
      books: "Mga Libro",
      scan: "I-Scan",
      vocabulary: "Bituon",
      settings: "Opsyon",
    },
    difficulty: { easy: "Dali", medium: "Medyo budlay", hard: "Mabudlay" },
    shell: {
      navHome: "Balay",
      navBooks: "Libro",
      navScan: "I-scan",
      navWords: "Pulong",
      navQuiz: "Pasulit",
      navSettings: "Settings",
      appName: "Handog Aral",
      mainNavLabel: "Pangunhon nga menu",
      skipToContent: "Laktawan sa sulod",
      loading: "Ginahanda ang imo pad...",
      offlineBanner: "Wala sang internet. Nagapadayon pa ang app, pero mas simple ang kahulugan tubtob makonek liwat.",
      offlinePageTitle: "Wala ka sang internet",
      offlinePageBody: "Indi ma-abri ang pahina nga ini kon wala sang konekson. Ang mga libro kag pulong nga natipon na sa telepono ara pa.",
      offlineRetry: "Probahi liwat",
      offlineHome: "Pauli sa Balay",
      updateAvailable: "May bag-o nga bersyon sang app.",
      updateAction: "I-update",
      upgradedWords: (n: number) => `Mas klaro na ang ${n} ka pulong.`,
    },
    home: homeStrings.hiligaynon,
    books: booksStrings.hiligaynon,
    vocabulary: vocabularyStrings.hiligaynon,
    scan: scanStrings.hiligaynon,
    quiz: quizStrings.hiligaynon,
    settings: settingsStrings.hiligaynon,
    popup: popupStrings.hiligaynon,
    bookCard: bookCardStrings.hiligaynon,
    welcome: welcomeStrings.hiligaynon,
    system: systemStrings.hiligaynon,
};

type Translation = typeof hiligaynon;

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
} satisfies Translation;

export const translations = { hiligaynon, tagalog };

export type Translations = Translation;
