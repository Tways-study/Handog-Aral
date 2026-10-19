/** quiz strings. Hiligaynon is the shape; Tagalog must match it key for key. */
const hiligaynon = {
  notEnoughTitle: "Kulang pa ang mga pulong!",
  notEnoughBody:
    "Kinahanglan mo sang labing menos 4 ka pulong para mag-quiz.\nMag-scan sang libro kag tap-a ang mga bag-o nga pulong!",
  scanBtn: "Mag-Scan",
  highScoreTitle: "Pinaka-mataas na Score",
  highScoreSub: (score: number, total: number) => `${score}/${total} tama`,
  resultPerfect: "Perpekto! Ikaw ang champion!",
  resultGreat: "Maayo gid ka! Dugang pa!",
  resultGood: "Maayo! Padayon lang!",
  resultOk: "Sige pa, you can do it!",
  header: "Vocabulary Quiz 🧠",
  questionLabel: (cur: number, total: number) => `Pangutana ${cur} / ${total}`,
  questionPrompt: "Ano ang buot sipdon sini sa Hiligaynon?",
  nextBtn: "Sunod nga Pangutana",
  resultsBtn: "Tan-awa ang Resulta 🏆",
  retryBtn: "Liwat",
  viewVocabBtn: "Tan-awa ang Pulong",
};

const tagalog = {
  notEnoughTitle: "Hindi pa sapat ang mga salita!",
  notEnoughBody:
    "Kailangan mo ng hindi bababa sa 4 na salita para mag-quiz.\nMag-scan ng libro at i-tap ang mga bagong salita!",
  scanBtn: "Mag-Scan",
  highScoreTitle: "Pinakamataas na Puntos",
  highScoreSub: (score: number, total: number) => `${score}/${total} tama`,
  resultPerfect: "Perpekto! Ikaw ang kampeon!",
  resultGreat: "Napakagaling! Magpatuloy!",
  resultGood: "Magaling! Patuloy lang!",
  resultOk: "Sige pa, kaya mo ito!",
  header: "Vocabulary Quiz 🧠",
  questionLabel: (cur: number, total: number) => `Tanong ${cur} / ${total}`,
  questionPrompt: "Ano ang kahulugan nito sa Filipino?",
  nextBtn: "Susunod na Tanong",
  resultsBtn: "Tingnan ang Resulta 🏆",
  retryBtn: "Ulitin",
  viewVocabBtn: "Tingnan ang Salita",
} satisfies typeof hiligaynon;

export const quizStrings = { hiligaynon, tagalog };
