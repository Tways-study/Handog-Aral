// Captures the install-dialog screenshots (public/screenshots/{wide,narrow}.png) from a running production build.
// Usage: BASE_URL=http://localhost:3213 node scripts/gen-screenshots.mjs  (PW_CHROMIUM_PATH optional)
// Seeds a child named Ana (Filipino), some progress and saved words; the API is stubbed, nothing hits the network.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3213";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "screenshots");
await mkdir(out, { recursive: true });

const settings = { childName: "Ana", language: "tagalog", fontSize: "medium", dyslexiaFont: false, ttsSpeed: 0.8, colorOverlay: "none", theme: "light", onboarded: true };
const progress = { currentBookId: "fox", bookProgress: { fox: 40, star: 100 }, streak: 4, lastActiveDate: null, quizHighScore: 4, quizStars: 1, savedWordCount: 6 };
const words = ["brave", "forest", "quiet", "stone", "happy", "snow"].map((w, i) => ({
  key: w, word: w, phonetic: `/${w}/`, english: `Meaning of ${w}`, translation: `Filipino ${w}`, emoji: "📖", difficulty: "easy",
  example: null, source: "curated", language: "tagalog", bookId: null, savedAt: Date.now() - i * 1000,
}));

const idbPut = (page, key, value) =>
  page.evaluate(([k, v]) => new Promise((res, rej) => {
    const o = indexedDB.open("keyval-store");
    o.onupgradeneeded = () => o.result.createObjectStore("keyval");
    o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction("keyval", "readwrite"); tx.objectStore("keyval").put(v, k); tx.oncomplete = () => (o.result.close(), res()); };
  }), [key, value]);

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});

async function shoot(name, viewport, dsf, scenario) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, isMobile: dsf > 1, hasTouch: dsf > 1, serviceWorkers: "block", reducedMotion: "reduce" });
  await ctx.route("**/api/health", (r) => r.fulfill({ json: { ok: true } }));
  await ctx.route("**/api/explain", (r) => {
    const { word } = r.request().postDataJSON();
    return r.fulfill({ json: { word, phonetic: `/${word}/`, english: "Looked carefully for something.", translation: "Nagpangita - gin-usisa ang tanan", emoji: "🔍", difficulty: "medium", example: "She searched the whole room." } });
  });
  await ctx.route("https://api.dictionaryapi.dev/**", (r) => r.fulfill({ status: 404, json: {} }));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/offline`);
  await idbPut(page, "handog-settings", JSON.stringify({ state: settings, version: 2 }));
  await idbPut(page, "handog-progress", JSON.stringify({ state: progress, version: 1 }));
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => new Promise((res) => { const o = indexedDB.open("handog-aral"); o.onsuccess = () => { res(o.result.objectStoreNames.contains("words")); o.result.close(); }; o.onerror = () => res(false); }), null, { timeout: 15000 });
  await page.evaluate((rows) => new Promise((res) => { const o = indexedDB.open("handog-aral"); o.onsuccess = () => { const tx = o.result.transaction("words", "readwrite"); rows.forEach((r) => tx.objectStore("words").put(r)); tx.oncomplete = () => (o.result.close(), res()); }; }), words);
  await scenario(page);
  await page.waitForTimeout(700);
  const png = await sharp(await page.screenshot({ type: "png" })).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  await writeFile(join(out, `${name}.png`), png);
  console.log(name, viewport, png.length, "bytes");
  await ctx.close();
}

// Narrow: Home with the child's name, shelf and stars. Wide: the reader with a tapped word and its explanation.
await shoot("narrow", { width: 375, height: 812 }, 2, async (page) => {
  await page.goto(`${BASE}/`);
  await page.getByRole("heading", { level: 1 }).waitFor();
});
await shoot("wide", { width: 1280, height: 800 }, 1, async (page) => {
  await page.goto(`${BASE}/read/fox`);
  const word = page.locator("[data-slot=reader-text]").getByRole("button", { name: "searched", exact: true }).first();
  await word.click();
  await page.getByRole("complementary").getByText("Nagpangita").waitFor();
});
await browser.close();
