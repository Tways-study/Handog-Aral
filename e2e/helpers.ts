import { expect, type BrowserContext, type Page, type Route } from "@playwright/test";

/** Settings shape persisted by the app (src/stores/settings.ts). */
export interface SettingsPatch {
  childName?: string;
  language?: "tagalog" | "english";
  fontSize?: "small" | "medium" | "large";
  dyslexiaFont?: boolean;
  ttsSpeed?: number;
  colorOverlay?: "none" | "yellow" | "blue" | "pink";
  theme?: "system" | "light" | "dark";
  onboarded?: boolean;
  owl3d?: boolean;
  owlOutfit?: "none" | "glasses" | "cap" | "bow";
  sound?: boolean;
  haptics?: boolean;
}

const DEFAULT_SETTINGS = {
  childName: "",
  language: "tagalog",
  fontSize: "medium",
  dyslexiaFont: false,
  ttsSpeed: 0.8,
  colorOverlay: "none",
  theme: "system",
  onboarded: false,
  // The 3D owl is covered by its own spec; everywhere else the flat owl keeps runs fast and deterministic.
  owl3d: false,
  owlOutfit: "none",
  sound: false,
  haptics: true,
};

export interface ExplainBody {
  word: string;
  sentence: string;
  language: "tagalog" | "english";
}

export const wordExplanation = (word: string, over: Record<string, unknown> = {}) => ({
  word,
  phonetic: `/${word}/`,
  english: `English meaning of ${word}.`,
  translation: `Filipino: ${word} nga kahulugan`,
  emoji: "📖",
  difficulty: "medium",
  example: `She ${word} for it.`,
  ...over,
});

export interface ApiStub {
  explainCalls: ExplainBody[];
  ocrCalls: number;
}

type ExplainHandler = (body: ExplainBody, route: Route) => Promise<void> | void;

/**
 * Stubs every network dependency of the app: the proxy (/api/*) and dictionaryapi.dev.
 * No test may reach the real network.
 */
export async function stubApi(
  context: BrowserContext | Page,
  opts: {
    explain?: ExplainHandler;
    ocr?: (route: Route) => Promise<void> | void;
    health?: boolean;
    dictionary?: "404" | "abort";
  } = {},
): Promise<ApiStub> {
  const stub: ApiStub = { explainCalls: [], ocrCalls: 0 };
  await context.route("**/api/health", (route) =>
    opts.health === false ? route.abort("internetdisconnected") : route.fulfill({ json: { ok: true } }),
  );
  await context.route("**/api/explain", async (route) => {
    const body = route.request().postDataJSON() as ExplainBody;
    stub.explainCalls.push(body);
    if (opts.explain) return opts.explain(body, route);
    return route.fulfill({ json: wordExplanation(body.word) });
  });
  await context.route("**/api/ocr", async (route) => {
    stub.ocrCalls++;
    if (opts.ocr) return opts.ocr(route);
    return route.fulfill({ json: { text: "A stubbed page of text." } });
  });
  await context.route("https://api.dictionaryapi.dev/**", (route) =>
    opts.dictionary === "abort" ? route.abort("internetdisconnected") : route.fulfill({ status: 404, json: { title: "No Definitions Found" } }),
  );
  return stub;
}

/** Writes the persisted settings (idb-keyval `handog-settings`) before the app boots. Needs an app page loaded. */
async function writeIdbKeyval(page: Page, key: string, value: string) {
  await page.evaluate(
    ([k, v]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put(v, k);
          tx.oncomplete = () => (db.close(), resolve());
          tx.onerror = () => reject(tx.error);
        };
      }),
    [key, value] as const,
  );
}

/** Seeds settings and lands on `path`. Defaults to an onboarded Filipino child so /welcome is skipped. */
export async function gotoAs(page: Page, path: string, settings: SettingsPatch = {}, progress?: Record<string, unknown>) {
  await page.goto("/offline"); // static page: no first-run redirect, boots the stores
  const state = { ...DEFAULT_SETTINGS, onboarded: true, ...settings };
  await writeIdbKeyval(page, "handog-settings", JSON.stringify({ state, version: 4 }));
  if (progress) await writeIdbKeyval(page, "handog-progress", JSON.stringify({ state: progress, version: 1 }));
  await page.goto(path);
}

/** Direct row for the Dexie `words` table (src/stores/db.ts SavedWord). */
export function savedWordRow(word: string, translation: string, over: Record<string, unknown> = {}, i = 0) {
  return {
    key: word.toLowerCase(),
    word,
    phonetic: `/${word}/`,
    english: `Meaning of ${word}`,
    translation,
    emoji: "📖",
    difficulty: "easy",
    example: null,
    source: "curated",
    language: "tagalog",
    bookId: null,
    savedAt: Date.now() - i * 1000,
    ...over,
  };
}

/** Puts rows straight into Dexie's IndexedDB. The app must already have opened the database; reload afterwards. */
export async function seedWords(page: Page, rows: ReturnType<typeof savedWordRow>[]) {
  await page.evaluate(
    (data) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("handog-aral");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("words")) {
            db.close();
            return reject(new Error("words store missing: app has not opened Dexie yet"));
          }
          const tx = db.transaction("words", "readwrite");
          for (const r of data) tx.objectStore("words").put(r);
          tx.oncomplete = () => (db.close(), resolve());
          tx.onerror = () => reject(tx.error);
        };
      }),
    rows,
  );
}

/** Reads the persisted zustand JSON for a store back out of IndexedDB. */
export async function readPersisted(page: Page, key: string): Promise<{ state: Record<string, unknown>; version: number } | null> {
  const raw = await page.evaluate(
    (k) =>
      new Promise<string | null>((resolve) => {
        const open = indexedDB.open("keyval-store");
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("keyval")) return resolve(null);
          const req = db.transaction("keyval").objectStore("keyval").get(k);
          req.onsuccess = () => (db.close(), resolve((req.result as string | undefined) ?? null));
          req.onerror = () => resolve(null);
        };
      }),
    key,
  );
  return raw ? JSON.parse(raw) : null;
}

export async function countRows(page: Page, store: "words" | "wordCache" | "lookupQueue" | "dictionary"): Promise<number> {
  return page.evaluate(
    (s) =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open("handog-aral");
        open.onerror = () => resolve(-1);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(s)) return resolve(-1);
          const req = db.transaction(s).objectStore(s).count();
          req.onsuccess = () => (db.close(), resolve(req.result));
          req.onerror = () => resolve(-1);
        };
      }),
    store,
  );
}

/** Waits until the curated dictionary has been seeded into Dexie (boot task). */
export async function waitForDictionary(page: Page) {
  await expect.poll(() => countRows(page, "dictionary"), { timeout: 15_000 }).toBeGreaterThan(200);
}

export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** The word button in the reader text. */
export const wordButton = (page: Page, word: string) =>
  page.locator("[data-slot=reader-text]").getByRole("button", { name: word, exact: true }).first();
