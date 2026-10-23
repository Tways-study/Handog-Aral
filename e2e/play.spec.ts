import { expect, test, type Page } from "@playwright/test";
import { gotoAs, readPersisted, savedWordRow, seedWords, stubApi } from "./helpers";

const WORDS = ["brave", "forest", "quiet", "stone", "happy", "snow"].map((w, i) => savedWordRow(w, `Filipino-${w}`, {}, i));

async function open(page: Page, rows: ReturnType<typeof savedWordRow>[]) {
  await gotoAs(page, "/");
  await expect(page.getByRole("heading", { name: /Magandang/ })).toBeVisible(); // Dexie is open
  if (rows.length) await seedWords(page, rows);
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Pares" })).toBeVisible();
}

const cards = (page: Page) => page.getByTestId("board").locator("button");
const moves = (page: Page) => page.getByTestId("moves-count");

/** Which card indexes belong together (read from the DOM so the shuffled board can be played perfectly). */
async function pairsOf(page: Page): Promise<number[][]> {
  const texts = await cards(page).evaluateAll((els) => els.map((e) => (e.querySelector("[class*='rotateY']") ?? e).textContent ?? ""));
  const byKey = new Map<string, number[]>();
  texts.forEach((t, i) => {
    const key = t.replace(/^(Salita|Kahulugan):\s*/, "").replace("Filipino-", "");
    byKey.set(key, [...(byKey.get(key) ?? []), i]);
  });
  return [...byKey.values()];
}

async function press(page: Page, i: number) {
  await cards(page).nth(i).focus();
  await page.keyboard.press("Enter");
}

async function playToWin(page: Page) {
  const pairs = await pairsOf(page);
  expect(pairs.length).toBeGreaterThanOrEqual(3);
  for (const [a, b] of pairs) {
    await press(page, a);
    await press(page, b);
  }
  return pairs.length;
}

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("fewer than 3 saved words: the owl asks for more and links to scan", async ({ page }) => {
  await open(page, WORDS.slice(0, 2));
  await expect(page.getByTestId("play-not-enough")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mag-scan" })).toHaveAttribute("href", "/scan");
  await expect(cards(page)).toHaveCount(0);
});

test("a deck of 3 to 6 pairs; a wrong pair flips back by itself and counts one move", async ({ page }) => {
  await open(page, WORDS);
  const n = await cards(page).count();
  expect(n).toBeGreaterThanOrEqual(6);
  expect(n % 2).toBe(0);
  await expect(moves(page)).toHaveText("0");
  const pairs = await pairsOf(page);
  await press(page, pairs[0][0]);
  await expect(cards(page).nth(pairs[0][0])).toHaveAttribute("data-state", "up");
  await press(page, pairs[1][0]);
  await expect(moves(page)).toHaveText("1");
  await expect(page.getByTestId("announce")).toContainText("Hindi pa pares");
  await expect(cards(page).nth(pairs[1][0])).toHaveAttribute("data-state", "down", { timeout: 3000 });
  await expect(cards(page).nth(pairs[0][0])).toHaveAttribute("data-state", "down");
  // a tap while a wrong pair shows never traps input
  await press(page, pairs[0][0]);
  await press(page, pairs[1][0]);
  await press(page, pairs[2][0]);
  await expect(cards(page).nth(pairs[2][0])).toHaveAttribute("data-state", "up");
});

test("a perfect game: matches stay up, the win gives 2 stars and the sticker, then play again", async ({ page }) => {
  await open(page, WORDS);
  const pairs = await pairsOf(page);
  await press(page, pairs[0][0]);
  await press(page, pairs[0][1]);
  await expect(cards(page).nth(pairs[0][0])).toHaveAttribute("data-state", "matched");
  await expect(page.getByTestId("match-stamp")).toHaveCount(2);
  await expect(moves(page)).toHaveText("1");
  for (const [a, b] of pairs.slice(1)) {
    await press(page, a);
    await press(page, b);
  }
  await expect(page.getByTestId("play-win")).toBeVisible();
  await expect(page.getByTestId("win-stars")).toContainText("2 bituin");
  const dialog = page.getByRole("dialog", { name: "Unang Panalo sa Pares" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sige!" }).click();
  await expect(dialog).toHaveCount(0);

  await expect.poll(async () => (await readPersisted(page, "handog-rewards"))?.state.bonusStars).toBe(2);
  const saved = (await readPersisted(page, "handog-rewards"))!.state as { earned: Record<string, number>; flags: { matchWins: number } };
  expect(saved.earned["match-first"]).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Ulit" }).click();
  await expect(page.getByTestId("board")).toBeVisible();
  await expect(moves(page)).toHaveText("0");
  await playToWin(page);
  await expect(page.getByTestId("play-win")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0); // the sticker is only celebrated once
  await expect.poll(async () => (await readPersisted(page, "handog-rewards"))?.state.bonusStars).toBe(4);
  await expect(page.getByRole("link", { name: "Balik sa mga salita" })).toHaveAttribute("href", "/words");
});

test("reduced motion: instant flips and no confetti nodes on the win", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, WORDS);
  await playToWin(page);
  await expect(page.getByTestId("play-win")).toBeVisible();
  await expect(page.locator("[data-confetti], [data-confetti-piece]")).toHaveCount(0);
});

test("Tagalog", async ({ page }) => {
  await gotoAs(page, "/", { language: "tagalog" });
  await seedWords(page, WORDS.map((w) => ({ ...w, language: "tagalog" })));
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Pares" })).toBeVisible();
  await expect(page.getByText("Mga galaw:")).toBeVisible();
});

test("all twelve cards fit above the nav on a phone, the owl reacts to a miss, and the card back is drawn art", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, "phone layout");
  await open(page, WORDS);
  const nav = (await page.locator("[data-slot=bottom-nav]").boundingBox())!;
  const last = (await cards(page).nth(11).boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(nav.y);
  await expect(page.locator("[data-art=card-back]").first()).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByTestId("owl-says")).toContainText("Hanapin ang salita");
  const pairs = await pairsOf(page);
  const odd = pairs.find((p) => p[0] !== pairs[0][0])![0];
  await press(page, pairs[0][0]);
  await press(page, odd);
  await expect(page.getByTestId("owl-says")).toContainText("indi pa");
});
