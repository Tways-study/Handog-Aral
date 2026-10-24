import { explainRemote } from "@/lib/api";
import type { Language, ResolvedExplanation } from "@/shared/schemas";
import { enqueue, getCached, getDictionaryEntry, getFilipinoEntry, putCached, touch } from "@/stores/db";
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
  tagalog: "Wala pang paliwanag. Ipapakita namin kapag may internet na.",
  english: "No explanation yet. We will show it when you are online.",
};

/** What the offline placeholder says in the word's own language (the "definition" line). */
const OFFLINE_DEFINITION: Record<Language, string> = {
  tagalog: "No explanation saved yet.",
  english: "Wala pang paliwanag na naka-save.",
};

/** A templated Filipino framing around an English definition (only used for English words, i.e. the "tagalog" language). */
export function generateLocalTranslation(word: string, english: string, pos: string): string {
  const shortDef = english.length > 60 ? english.slice(0, 57) + "…" : english;

  const templates: Record<string, string> = {
    verb: `Gawa — "${word}" nangangahulugang: ${shortDef}`,
    noun: `"${word}" — isang bagay o tao: ${shortDef}`,
    adjective: `Naglalarawan — "${word}" nagpapakita ng: ${shortDef}`,
    adverb: `Paraan — "${word}" naglalarawan kung paano: ${shortDef}`,
    default: `"${word}" sa English nangangahulugang: ${shortDef}`,
  };

  return templates[pos] || templates.default;
}

/** The proxy only accepts one word of letters (with marks), apostrophes and hyphens, at most 64 characters. */
export function isLookupable(word: string): boolean {
  return word.length > 0 && word.length <= 64 && /^[\p{L}\p{M}'’-]+$/u.test(word);
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
    const translation = generateLocalTranslation(word, english, pos);

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
    english: OFFLINE_DEFINITION[language],
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
  const sentence = (input.sentence ?? "").slice(0, 600);
  throwIfAborted(signal);
  // Not a word the dictionary or the proxy can take (OCR debris, a 90-letter run): show the honest placeholder and do not
  // cache it or queue it, since no later retry could ever succeed.
  if (!isLookupable(word)) return offlinePlaceholder(word || input.word.trim(), language);

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

  // 2. Curated dictionary: English words for Filipino readers, Filipino words for English readers.
  if (language === "english") {
    const curated = await getFilipinoEntry(word);
    throwIfAborted(signal);
    if (curated) {
      return {
        word,
        phonetic: curated.phonetic,
        english: curated.filipino,
        translation: curated.english,
        emoji: curated.emoji,
        difficulty: curated.difficulty,
        example: curated.example,
        source: "curated",
        language,
      };
    }
  } else {
    const curated = await getDictionaryEntry(word);
    throwIfAborted(signal);
    if (curated?.tagalog) {
      return {
        word,
        phonetic: curated.phonetic,
        english: curated.english,
        translation: curated.tagalog,
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

  // 4. dictionaryapi.dev with a local template translation (English words only).
  if (language === "tagalog") {
    const dict = await lookupDictionaryAPI(word, language, signal);
    throwIfAborted(signal);
    if (dict) {
      await putCached(dict);
      return dict;
    }
  }

  // 5. Offline placeholder, upgraded later by the lookup queue.
  const offline = offlinePlaceholder(word, language);
  await putCached(offline);
  await enqueue({ word, sentence, language });
  return offline;
}
