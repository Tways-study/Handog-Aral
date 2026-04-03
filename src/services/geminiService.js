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

export async function explainWord({ word, sentence, targetLanguage }) {
  // Check fallback first
  const lower = word.toLowerCase();
  const fallback = fallbackWords[lower];

  const ai = getGenAI();
  if (!ai) {
    if (fallback) return fallback;
    return {
      word,
      phonetic: `/${word}/`,
      english: "A word found in your reading.",
      translation: "Tan-awa sa diksyunaryo ang buot silingon sini.",
      emoji: "📖",
      difficulty: "medium",
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

Your task:
1. Give a simple, one-sentence English definition (Grade 2 reading level, max 15 words).
2. ${languageInstruction} Give a fun, relatable explanation using local Filipino context (carabao, rice fields, jeepney, palengke, etc.) — max 20 words.
3. Give the phonetic pronunciation in simple syllables (e.g., /SNOH/ for "snow").
4. Suggest one relevant emoji that represents the word visually.
5. Classify the word difficulty: easy / medium / hard.

Respond ONLY in this exact JSON format, no markdown, no backticks:
{
  "word": "${word}",
  "phonetic": "/pronunciation/",
  "english": "Simple English definition here.",
  "translation": "Hiligaynon or Filipino explanation here.",
  "emoji": "🎯",
  "difficulty": "medium"
}
`;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    if (fallback) return fallback;
    return {
      word,
      phonetic: `/${word}/`,
      english: "A word found in your reading.",
      translation: "Tan-awa sa diksyunaryo ang buot silingon sini.",
      emoji: "📖",
      difficulty: "medium",
    };
  }
}
