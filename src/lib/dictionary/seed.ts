import fallbackWords from "@/data/fallbackWords";
import { getDb, getMeta, setMeta, type DictionaryEntry } from "@/stores/db";

/** Bump when the curated list changes so existing installs reload it. */
export const CURATED_VERSION = 1;
/** Bump when src/data/dictionary.v1.json (generated) changes. */
export const GENERATED_VERSION = 1;
export const DICTIONARY_VERSION_KEY = "dictionaryVersion";

/** Combined version marker: curated.generated, e.g. "1.1". */
export const DICTIONARY_VERSION = `${CURATED_VERSION}.${GENERATED_VERSION}`;

export function curatedEntries(): DictionaryEntry[] {
  return Object.values(fallbackWords).map((w) => ({
    word: w.word.toLowerCase(),
    phonetic: w.phonetic,
    english: w.english,
    emoji: w.emoji,
    difficulty: w.difficulty,
    example: w.example ?? null,
    hiligaynon: w.hiligaynon,
    tagalog: w.tagalog,
    reviewed: true,
  }));
}

type RawEntry = Partial<DictionaryEntry> & { word: string };

/**
 * Source of the optional large generated dictionary (src/data/dictionary.v1.json, entries shaped like
 * DictionaryEntry, reviewed may be false). Bundlers fail on a missing static import, so the file is wired
 * in here once it exists: replace the body with
 *   `return (await import("@/data/dictionary.v1.json")).default as RawEntry[];`
 * and bump GENERATED_VERSION. Until then there is nothing to merge.
 */
export async function defaultGeneratedLoader(): Promise<unknown> {
  return [];
}

function normalizeGenerated(raw: unknown): DictionaryEntry[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw) : [];
  return (list as Partial<DictionaryEntry>[])
    .filter((e): e is RawEntry => typeof e?.word === "string" && e.word.length > 0)
    .map((e) => ({
      word: e.word.toLowerCase(),
      phonetic: e.phonetic ?? `/${e.word}/`,
      english: e.english ?? "",
      emoji: e.emoji ?? "📖",
      difficulty: e.difficulty ?? "easy",
      example: e.example ?? null,
      hiligaynon: e.hiligaynon ?? "",
      tagalog: e.tagalog ?? "",
      reviewed: e.reviewed === true,
    }))
    .filter((e) => e.english && (e.hiligaynon || e.tagalog));
}

/** Loads curated (and, when present, generated) entries into db.dictionary if the stored version is behind. */
export async function ensureDictionary(loadGenerated: () => Promise<unknown> = defaultGeneratedLoader): Promise<void> {
  const db = getDb();
  if (!db) return;
  const current = await getMeta(DICTIONARY_VERSION_KEY);
  if (current === DICTIONARY_VERSION) return;

  const generated = normalizeGenerated(await loadGenerated().catch(() => []));
  const merged = new Map<string, DictionaryEntry>();
  for (const e of generated) merged.set(e.word, e);
  for (const e of curatedEntries()) merged.set(e.word, e); // curated wins
  await db.dictionary.bulkPut([...merged.values()]);
  await setMeta(DICTIONARY_VERSION_KEY, DICTIONARY_VERSION);
}
