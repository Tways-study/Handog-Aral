import { GoogleGenerativeAI } from "@google/generative-ai";
import fallbackWords from "../data/fallbackWords";

let genAI = null;

function getGenAI() {
  const key =
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem("handog-gemini-key");
  if (!key || key === "your_api_key_here") return null;
  if (!genAI) genAI = new GoogleGenerativeAI(key);
  return genAI;
}

export function hasApiKey() {
  const key =
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem("handog-gemini-key");
  return key && key !== "your_api_key_here";
}

export function setApiKey(key) {
  localStorage.setItem("handog-gemini-key", key);
  genAI = new GoogleGenerativeAI(key);
}

export function clearApiKey() {
  localStorage.removeItem("handog-gemini-key");
  genAI = null;
}

const PART_OF_SPEECH_EMOJI = {
  noun: "📦",
  verb: "⚡",
  adjective: "🎨",
  adverb: "💨",
  preposition: "🔗",
  conjunction: "🔄",
  pronoun: "👤",
  interjection: "❗",
  exclamation: "❗",
};

// Generates a basic local Hiligaynon/Filipino translation when Gemini is unavailable.
// Uses part-of-speech templates so the result is more meaningful than a bare placeholder.
function generateLocalTranslation(word, english, pos, targetLanguage) {
  const isHiligaynon = targetLanguage !== "tagalog";
  const shortDef = english.length > 60 ? english.slice(0, 57) + "…" : english;

  const templates = isHiligaynon
    ? {
        verb: `Buhat — "${word}" nagakahulugan: ${shortDef}`,
        noun: `"${word}" — isa ka butang ukon tawo: ${shortDef}`,
        adjective: `Nagahulagway — "${word}" nagpakita sang: ${shortDef}`,
        adverb: `Paagi — "${word}" nagahulagway kung paano: ${shortDef}`,
        default: `"${word}" sa English nagakahulugan: ${shortDef}`,
      }
    : {
        verb: `Gawa — "${word}" nangangahulugang: ${shortDef}`,
        noun: `"${word}" — isang bagay o tao: ${shortDef}`,
        adjective: `Naglalarawan — "${word}" nagpapakita ng: ${shortDef}`,
        adverb: `Paraan — "${word}" naglalarawan kung paano: ${shortDef}`,
        default: `"${word}" sa English nangangahulugang: ${shortDef}`,
      };

  return templates[pos] || templates.default;
}

async function lookupDictionaryAPI(word, targetLanguage) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;

    const entry = data[0];
    const meaning = entry.meanings?.[0];
    const def = meaning?.definitions?.[0];
    const phonetic =
      entry.phonetics?.find((p) => p.text)?.text || `/${word}/`;
    const english = def?.definition
      ? def.definition.charAt(0).toUpperCase() + def.definition.slice(1)
      : "An English word.";
    const example = def?.example || null;
    const pos = meaning?.partOfSpeech || "";
    const emoji = PART_OF_SPEECH_EMOJI[pos] || "📖";
    const wordLen = word.length;
    const difficulty = wordLen <= 4 ? "easy" : wordLen <= 7 ? "medium" : "hard";

    const translation = generateLocalTranslation(word, english, pos, targetLanguage);

    return { word, phonetic, english, translation, emoji, difficulty, example };
  } catch {
    return null;
  }
}

export async function explainWord({ word, sentence, targetLanguage }) {
  const lower = word.toLowerCase();
  const fallback = fallbackWords[lower];

  const ai = getGenAI();
  if (!ai) {
    if (fallback)
      return {
        ...fallback,
        translation:
          targetLanguage === "tagalog" ? fallback.tagalog : fallback.hiligaynon,
      };
    const dictResult = await lookupDictionaryAPI(word, targetLanguage);
    if (dictResult) return dictResult;
    return {
      word,
      phonetic: `/${word}/`,
      english: "A word found in your reading.",
      translation:
        targetLanguage === "tagalog"
          ? "Hanapin sa diksyunaryo ang kahulugan nito."
          : "Tan-awa sa diksyunaryo ang buot silingon sini.",
      emoji: "📖",
      difficulty: "easy",
      example: null,
    };
  }

  const languageInstruction =
    targetLanguage === "hiligaynon"
      ? "Explain in Hiligaynon (Ilonggo dialect spoken in Western Visayas, Philippines)."
      : "Explain in simple Filipino/Tagalog.";

  const prompt = `
You are a friendly literacy tutor helping a Filipino child aged 6-12 understand English words.

The child tapped the word: "${word}"
It appeared in this sentence: "${sentence}"

IMPORTANT: Explain ANY type of word — including common/short words like articles (a, an, the), pronouns (I, he, she, it, we, they), prepositions (in, on, at, to, for, of, with), conjunctions (and, but, or, so), verbs (is, are, was, has, can, go), adverbs (very, just, only, also), and nouns/adjectives. Every word has a meaning worth learning.

Your task:
1. Give a simple, one-sentence English definition appropriate to how the word is used in the sentence (Grade 2 reading level, max 15 words).
2. ${languageInstruction} Give a fun, relatable explanation using local Filipino context (carabao, rice fields, jeepney, palengke, baryo, etc.) — max 20 words.
3. Give the phonetic pronunciation in simple syllables (e.g., /SNOH/ for "snow", /duh/ for "the").
4. Suggest one relevant emoji that represents the word visually.
5. Classify the word difficulty: easy / medium / hard.
6. Write one short example sentence (max 10 words) using the word in a simple, child-friendly context.

Respond ONLY in this exact JSON format, no markdown, no backticks:
{
  "word": "${word}",
  "phonetic": "/pronunciation/",
  "english": "Simple English definition here.",
  "translation": "Hiligaynon or Filipino explanation here.",
  "emoji": "🎯",
  "difficulty": "easy",
  "example": "The dog ran fast."
}
`;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Strip all markdown fences and find the JSON object
    const cleaned = text.replace(/```[a-z]*\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    if (fallback)
      return {
        ...fallback,
        translation:
          targetLanguage === "tagalog" ? fallback.tagalog : fallback.hiligaynon,
      };
    const dictResult = await lookupDictionaryAPI(word, targetLanguage);
    if (dictResult) return dictResult;
    return {
      word,
      phonetic: `/${word}/`,
      english: "A word found in your reading.",
      translation:
        targetLanguage === "tagalog"
          ? "Hanapin sa diksyunaryo ang kahulugan nito."
          : "Tan-awa sa diksyunaryo ang buot silingon sini.",
      emoji: "📖",
      difficulty: "easy",
      example: null,
    };
  }
}
