import type { Language, ResolvedExplanation } from "@/shared/schemas";
import { getDb, wordCacheBulkPut } from "./db";
import { LEGACY_STORAGE_KEY } from "./bootMirror";
import { useProgress } from "./progress";
import { useSettings } from "./settings";

export { LEGACY_STORAGE_KEY };

/** Generic placeholders the old app wrote into wordCache when every lookup failed. */
const OLD_PLACEHOLDERS = new Set([
  "Tan-awa sa diksyunaryo ang buot silingon sini.",
  "Hanapin sa diksyunaryo ang kahulugan nito.",
]);

interface LegacyWord {
  word?: unknown;
  phonetic?: unknown;
  english?: unknown;
  translation?: unknown;
  emoji?: unknown;
  difficulty?: unknown;
  example?: unknown;
  bookId?: unknown;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function toExplanation(w: LegacyWord, language: Language, source: ResolvedExplanation["source"]): ResolvedExplanation | null {
  const word = str(w.word).trim();
  const english = str(w.english);
  const translation = str(w.translation);
  if (!word || !english || !translation) return null;
  const d = w.difficulty;
  return {
    word,
    phonetic: str(w.phonetic, `/${word}/`),
    english,
    translation,
    emoji: str(w.emoji, "📖"),
    difficulty: d === "easy" || d === "medium" || d === "hard" ? d : "easy",
    example: typeof w.example === "string" ? w.example : null,
    source,
    language,
  };
}

const FONT_SIZES = ["small", "medium", "large"] as const;
const OVERLAYS = ["none", "yellow", "blue", "pink"] as const;

/** Moves the legacy `handog-aral-state` localStorage blob into the new stores. Idempotent. */
export async function migrateLegacyState(): Promise<boolean> {
  if (typeof localStorage === "undefined") return false;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  let old: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("bad");
    old = parsed as Record<string, unknown>;
  } catch {
    // Unreadable blob: nothing to salvage.
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return false;
  }

  // Let persisted stores finish reading before we write over them.
  await Promise.all([useSettings.persist.rehydrate(), useProgress.persist.rehydrate()]);

  const language: Language = old.language === "tagalog" ? "tagalog" : "hiligaynon";

  useSettings.setState({
    childName: str(old.childName),
    language,
    fontSize: FONT_SIZES.includes(old.fontSize as never) ? (old.fontSize as (typeof FONT_SIZES)[number]) : "medium",
    dyslexiaFont: old.dyslexiaFont === true,
    ttsSpeed: typeof old.ttsSpeed === "number" ? old.ttsSpeed : 0.8,
    colorOverlay: OVERLAYS.includes(old.colorOverlay as never) ? (old.colorOverlay as (typeof OVERLAYS)[number]) : "none",
  });

  // Saved words (dedupe case-insensitively, first wins).
  const db = getDb();
  const seen = new Set<string>();
  const saved: { entry: ResolvedExplanation; bookId: string | null }[] = [];
  if (Array.isArray(old.wordsLearned)) {
    for (const w of old.wordsLearned as LegacyWord[]) {
      const entry = w && typeof w === "object" ? toExplanation(w, language, "ai") : null;
      if (!entry) continue;
      const key = entry.word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      saved.push({ entry, bookId: typeof w.bookId === "string" ? w.bookId : null });
    }
  }
  if (db) {
    const now = Date.now();
    await db.words.bulkPut(
      saved.map(({ entry, bookId }, i) => ({ ...entry, key: entry.word.toLowerCase(), bookId, savedAt: now + i })),
    );
  }

  // Cached lookups (keys look like "word_language").
  const cacheRows: ResolvedExplanation[] = [];
  if (old.wordCache && typeof old.wordCache === "object") {
    for (const [k, v] of Object.entries(old.wordCache as Record<string, LegacyWord>)) {
      if (!v || typeof v !== "object") continue;
      const m = /_(hiligaynon|tagalog)$/.exec(k);
      const lang: Language = m ? (m[1] as Language) : language;
      if (OLD_PLACEHOLDERS.has(str(v.translation))) continue;
      const entry = toExplanation(v, lang, "ai");
      if (!entry) continue;
      cacheRows.push(entry);
    }
  }
  await wordCacheBulkPut(cacheRows);

  const bookProgress: Record<string, number> = {};
  if (old.bookProgress && typeof old.bookProgress === "object") {
    for (const [id, pct] of Object.entries(old.bookProgress as Record<string, unknown>)) {
      if (typeof pct === "number") bookProgress[id] = pct;
    }
  }
  const currentBook = old.currentBook as { id?: unknown } | null | undefined;
  useProgress.setState({
    currentBookId: currentBook && typeof currentBook.id === "string" ? currentBook.id : null,
    bookProgress,
    streak: typeof old.streak === "number" ? old.streak : 0,
    lastActiveDate: typeof old.lastActiveDate === "string" ? old.lastActiveDate : null,
    quizHighScore: typeof old.quizHighScore === "number" ? old.quizHighScore : 0,
    savedWordCount: saved.length,
  });
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return true;
}

export async function runMigrations(): Promise<void> {
  await migrateLegacyState();
}
