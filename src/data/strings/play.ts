/** Memory match strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  title: "Pares", // REVIEW: native speaker
  subtitle: "Pangitaa ang pulong kag ang kahulugan.",
  loading: "Ginahanda ang ulin...",
  notEnoughTitle: "Kulang pa ang mga pulong",
  notEnoughBody: (have: number, need: number) => `Kinahanglan ang ${need} ka pulong sa ulin. May ${have} ka pulong ka na. Mag-scan kag mag-save pa!`,
  scanBtn: "Mag-scan",
  moves: "Mga tikang",
  pairs: (found: number, total: number) => `${found} sang ${total} ka pares`,
  boardLabel: "Mga kard sang ulin",
  wordCard: (word: string) => `Pulong: ${word}`,
  meaningCard: (meaning: string) => `Kahulugan: ${meaning}`,
  faceDown: "Natabunan nga kard",
  faceDownIndex: (n: number) => `Kard ${n}, natabunan`,
  matched: "Pares",
  matchMsg: (word: string) => `Tama! Pares: ${word}`,
  missMsg: "Indi pa pares. Probahi liwat.",
  flipMsg: (text: string) => `Naabrihan: ${text}`,
  winTitle: "Daog ka!",
  winBody: (moves: number) => `Natapos mo sa ${moves} ka tikang.`,
  starsEarned: (n: number) => (n === 1 ? "Nakakuha ka sang 1 ka bituon" : `Nakakuha ka sang ${n} ka bituon`),
  playAgain: "Liwat",
  backToWords: "Balik sa mga pulong",
  reshuffle: "Bag-o nga ulin",
  // REVIEW: native speaker (owl voice)
  owlStart: "Pangitaa ang pulong kag ang kahulugan!",
  owlMatch: "Pares! Maayo gid!",
  owlMiss: "Hmm, indi pa. Probahi liwat!",
};

const tagalog = {
  title: "Pares", // REVIEW: native speaker
  subtitle: "Hanapin ang salita at ang kahulugan nito.",
  loading: "Inihahanda ang laro...",
  notEnoughTitle: "Kulang pa ang mga salita",
  notEnoughBody: (have: number, need: number) => `Kailangan ng ${need} salita sa laro. May ${have} ka nang salita. Mag-scan at mag-save pa!`,
  scanBtn: "Mag-scan",
  moves: "Mga galaw",
  pairs: (found: number, total: number) => `${found} sa ${total} na pares`,
  boardLabel: "Mga kard ng laro",
  wordCard: (word: string) => `Salita: ${word}`,
  meaningCard: (meaning: string) => `Kahulugan: ${meaning}`,
  faceDown: "Nakataob na kard",
  faceDownIndex: (n: number) => `Kard ${n}, nakataob`,
  matched: "Pares",
  matchMsg: (word: string) => `Tama! Pares: ${word}`,
  missMsg: "Hindi pa pares. Subukan ulit.",
  flipMsg: (text: string) => `Nabuksan: ${text}`,
  winTitle: "Panalo ka!",
  winBody: (moves: number) => `Natapos mo sa ${moves} na galaw.`,
  starsEarned: (n: number) => (n === 1 ? "Nakakuha ka ng 1 bituin" : `Nakakuha ka ng ${n} bituin`),
  playAgain: "Ulit",
  backToWords: "Balik sa mga salita",
  reshuffle: "Bagong laro",
  // REVIEW: native speaker (owl voice)
  owlStart: "Hanapin ang salita at ang kahulugan!",
  owlMatch: "Pares! Galing!",
  owlMiss: "Hmm, hindi pa. Subukan ulit!",
} satisfies typeof hiligaynon;

export const playStrings = { hiligaynon, tagalog };
