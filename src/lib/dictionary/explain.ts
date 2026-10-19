import { explainRemote } from "@/lib/api";
import type { Language, ResolvedExplanation } from "@/shared/schemas";
import { enqueue, getCached, getDictionaryEntry, putCached, touch } from "@/stores/db";
import { normalizeWord } from "./normalize";

export { normalizeWord } from "./normalize";

export interface ExplainInput {
  word: string;
  sentence: string;
  language: Language;
}

export const DICTIONARY_API_TIMEOUT_MS = 4000;

const PART_OF_SPEECH_EMOJI: Record<string, string> = {
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

export const OFFLINE_TEXT: Record<Language, string> = {
  hiligaynon: "Wala pa sang paathag. Ipakita namon kon may internet na.",
  tagalog: "Wala pang paliwanag. Ipapakita namin kapag may internet na.",
};

// Ported from src/lib/geminiService.ts (same behavior).
export function generateLocalTranslation(word: string, english: string, pos: string, targetLanguage: Language): string {
  const isHiligaynon = targetLanguage !== "tagalog";
  const shortDef = english.length > 60 ? english.slice(0, 57) + "…" : english;

  const templates: Record<string, string> = isHiligaynon
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

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

/** Ported from lookupDictionaryAPI in geminiService.ts, plus timeout and AbortSignal support. */
export async function lookupDictionaryAPI(
  word: string,
  language: Language,
  signal?: AbortSignal,
): Promise<ResolvedExplanation | null> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), DICTIONARY_API_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;

    const entry = data[0];
    const meaning = entry.meanings?.[0];
    const def = meaning?.definitions?.[0];
    const phonetic = entry.phonetics?.find((p: { text?: string }) => p.text)?.text || `/${word}/`;
    const english = def?.definition ? def.definition.charAt(0).toUpperCase() + def.definition.slice(1) : "An English word.";
    const example = def?.example || null;
    const pos = meaning?.partOfSpeech || "";
    const emoji = PART_OF_SPEECH_EMOJI[pos] || "📖";
    const wordLen = word.length;
    const difficulty = wordLen <= 4 ? "easy" : wordLen <= 7 ? "medium" : "hard";
    const translation = generateLocalTranslation(word, english, pos, language);

    return { word, phonetic, english, translation, emoji, difficulty, example, source: "dictionary", language };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function offlinePlaceholder(word: string, language: Language): ResolvedExplanation {
  return {
    word,
    phonetic: `/${word}/`,
    english: "No explanation saved yet.",
    translation: OFFLINE_TEXT[language],
    emoji: "📖",
    difficulty: "easy",
    example: null,
    source: "offline",
    language,
  };
}

/**
 * Resolves a word: cache, curated dictionary, Gemini proxy, dictionaryapi.dev, then an offline
 * placeholder (queued for upgrade). Rejects with an AbortError when `signal` aborts.
 */
export async function explain(input: ExplainInput, opts: { signal?: AbortSignal } = {}): Promise<ResolvedExplanation> {
  const { signal } = opts;
  const { language } = input;
  const word = normalizeWord(input.word);
  const sentence = input.sentence ?? "";
  throwIfAborted(signal);

  // 1. Cache (offline placeholders are provisional, so they never short-circuit).
  const cached = await getCached(word, language);
  throwIfAborted(signal);
  if (cached && cached.source !== "offline") {
    void touch(cached.key);
    return {
      word: cached.word,
      phonetic: cached.phonetic,
      english: cached.english,
      translation: cached.translation,
      emoji: cached.emoji,
      difficulty: cached.difficulty,
      example: cached.example,
      source: cached.source,
      language: cached.language,
    };
  }

  // 2. Curated dictionary.
  const curated = await getDictionaryEntry(word);
  throwIfAborted(signal);
  if (curated) {
    const translation = curated[language];
    if (translation) {
      return {
        word,
        phonetic: curated.phonetic,
        english: curated.english,
        translation,
        emoji: curated.emoji,
        difficulty: curated.difficulty,
        example: curated.example,
        source: "curated",
        language,
      };
    }
  }

  // 3. Gemini proxy.
  const remote = await explainRemote({ word, sentence, language }, { signal });
  throwIfAborted(signal);
  if (remote.ok) {
    const result: ResolvedExplanation = { ...remote.data, word, source: "ai", language };
    await putCached(result);
    return result;
  }

  // 4. dictionaryapi.dev with a local template translation.
  const dict = await lookupDictionaryAPI(word, language, signal);
  throwIfAborted(signal);
  if (dict) {
    await putCached(dict);
    return dict;
  }

  // 5. Offline placeholder, upgraded later by the lookup queue.
  const offline = offlinePlaceholder(word, language);
  await putCached(offline);
  await enqueue({ word, sentence, language });
  return offline;
}
