import Dexie, { type Table } from "dexie";
import type { Language, ResolvedExplanation, WordExplanation } from "@/shared/schemas";

type Difficulty = WordExplanation["difficulty"];

export const WORD_CACHE_MAX = 2000;

export interface CachedExplanation extends ResolvedExplanation {
  /** `${word.toLowerCase()}_${language}` */
  key: string;
  updatedAt: number;
  lastUsedAt: number;
}

export interface DictionaryEntry {
  /** lowercase word */
  word: string;
  phonetic: string;
  english: string;
  emoji: string;
  difficulty: Difficulty;
  example: string | null;
  hiligaynon: string;
  tagalog: string;
  reviewed: boolean;
}

export interface MetaRow {
  key: string;
  value: string | number;
}

export interface QueueItem {
  key: string;
  word: string;
  sentence: string;
  language: Language;
  enqueuedAt: number;
  attempts: number;
}

export interface SavedWord extends ResolvedExplanation {
  /** lowercase word */
  key: string;
  bookId: string | null;
  savedAt: number;
}

export class HandogDB extends Dexie {
  wordCache!: Table<CachedExplanation, string>;
  dictionary!: Table<DictionaryEntry, string>;
  meta!: Table<MetaRow, string>;
  lookupQueue!: Table<QueueItem, string>;
  words!: Table<SavedWord, string>;

  constructor() {
    super("handog-aral");
    this.version(1).stores({
      wordCache: "key, lastUsedAt, updatedAt",
      dictionary: "word",
      meta: "key",
      lookupQueue: "key, enqueuedAt",
      words: "key, savedAt, bookId",
    });
  }
}

let instance: HandogDB | null = null;

/** Lazily creates the database. Returns null where IndexedDB is unavailable (server, old webviews). */
export function getDb(): HandogDB | null {
  if (typeof indexedDB === "undefined") return null;
  if (!instance) instance = new HandogDB();
  return instance;
}

/** Test helper: closes and forgets the instance. */
export async function closeDb(): Promise<void> {
  if (instance) {
    instance.close();
    instance = null;
  }
}

export function cacheKey(word: string, language: Language): string {
  return `${word.toLowerCase()}_${language}`;
}

async function safe<T>(fallback: T, fn: (db: HandogDB) => Promise<T>): Promise<T> {
  const db = getDb();
  if (!db) return fallback;
  try {
    return await fn(db);
  } catch {
    return fallback;
  }
}

// --- wordCache ---

export function getCached(word: string, language: Language): Promise<CachedExplanation | undefined> {
  return safe(undefined, (db) => db.wordCache.get(cacheKey(word, language)));
}

export function putCached(entry: ResolvedExplanation): Promise<void> {
  return safe(undefined, async (db) => {
    const now = Date.now();
    await db.wordCache.put({ ...entry, key: cacheKey(entry.word, entry.language), updatedAt: now, lastUsedAt: now });
    await evictOverflow(WORD_CACHE_MAX);
  });
}

export function wordCacheBulkPut(entries: ResolvedExplanation[]): Promise<void> {
  return safe(undefined, async (db) => {
    const now = Date.now();
    await db.wordCache.bulkPut(
      entries.map((e) => ({ ...e, key: cacheKey(e.word, e.language), updatedAt: now, lastUsedAt: now })),
    );
    await evictOverflow(WORD_CACHE_MAX);
  });
}

export function touch(key: string): Promise<void> {
  return safe(undefined, async (db) => {
    await db.wordCache.update(key, { lastUsedAt: Date.now() });
  });
}

export function evict(key: string): Promise<void> {
  return safe(undefined, (db) => db.wordCache.delete(key));
}

/** LRU eviction: removes the least recently used entries beyond `max`. Returns how many were removed. */
export function evictOverflow(max: number = WORD_CACHE_MAX): Promise<number> {
  return safe(0, async (db) => {
    const count = await db.wordCache.count();
    if (count <= max) return 0;
    const excess = count - max;
    const keys = (await db.wordCache.orderBy("lastUsedAt").limit(excess).primaryKeys()) as string[];
    await db.wordCache.bulkDelete(keys);
    return keys.length;
  });
}

// --- dictionary / meta ---

export function getDictionaryEntry(word: string): Promise<DictionaryEntry | undefined> {
  return safe(undefined, (db) => db.dictionary.get(word.toLowerCase()));
}

export function getMeta(key: string): Promise<string | number | undefined> {
  return safe(undefined, async (db) => (await db.meta.get(key))?.value);
}

export function setMeta(key: string, value: string | number): Promise<void> {
  return safe(undefined, async (db) => {
    await db.meta.put({ key, value });
  });
}

// --- lookupQueue ---

export function enqueue(item: { word: string; sentence: string; language: Language }): Promise<void> {
  return safe(undefined, async (db) => {
    const key = cacheKey(item.word, item.language);
    const existing = await db.lookupQueue.get(key);
    if (existing) return;
    await db.lookupQueue.put({ key, ...item, enqueuedAt: Date.now(), attempts: 0 });
  });
}

export function dequeueBatch(limit: number): Promise<QueueItem[]> {
  return safe([], (db) => db.lookupQueue.orderBy("enqueuedAt").limit(limit).toArray());
}

export function removeFromQueue(key: string): Promise<void> {
  return safe(undefined, (db) => db.lookupQueue.delete(key));
}

export function bumpAttempts(key: string): Promise<number> {
  return safe(0, async (db) => {
    const item = await db.lookupQueue.get(key);
    if (!item) return 0;
    const attempts = item.attempts + 1;
    await db.lookupQueue.update(key, { attempts });
    return attempts;
  });
}

export function queueSize(): Promise<number> {
  return safe(0, (db) => db.lookupQueue.count());
}

// --- saved words ---

export function saveWord(entry: ResolvedExplanation, bookId: string | null = null): Promise<void> {
  return safe(undefined, async (db) => {
    const key = entry.word.toLowerCase();
    const existing = await db.words.get(key);
    if (existing) return;
    await db.words.put({ ...entry, key, bookId, savedAt: Date.now() });
  });
}

export function removeWord(word: string): Promise<void> {
  return safe(undefined, (db) => db.words.delete(word.toLowerCase()));
}

export function getSavedWord(word: string): Promise<SavedWord | undefined> {
  return safe(undefined, (db) => db.words.get(word.toLowerCase()));
}

export function listWords(): Promise<SavedWord[]> {
  return safe([], (db) => db.words.orderBy("savedAt").toArray());
}

export function countWords(): Promise<number> {
  return safe(0, (db) => db.words.count());
}

/** Replaces the explanation of a saved word, keeping bookId and savedAt. Returns true if a saved word was updated. */
export function updateSavedWord(entry: ResolvedExplanation): Promise<boolean> {
  return safe(false, async (db) => {
    const key = entry.word.toLowerCase();
    const existing = await db.words.get(key);
    if (!existing) return false;
    await db.words.put({ ...entry, key, bookId: existing.bookId, savedAt: existing.savedAt });
    return true;
  });
}
