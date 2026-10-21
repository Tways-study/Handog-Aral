import { expect, test, type Page } from "@playwright/test";
import { gotoAs, readPersisted, savedWordRow, seedWords, stubApi } from "./helpers";

const WORDS = ["brave", "forest", "quiet", "stone", "happy", "snow", "path", "food"].map((w, i) =>
  savedWordRow(w, `Hiligaynon-${w}`, {}, i),
);

async function seed(page: Page, rows = WORDS) {
  await gotoAs(page, "/");
  await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible(); // Dexie is open and home is ready
  await seedWords(page, rows);
  await page.goto("/quiz");
}

const options = (page: Page) => page.getByRole("radiogroup", { name: "Ano ang buot silingon sini sa Hiligaynon?" }).getByRole("radio");

/** Plays a whole quiz picking the first option every time. Returns what each question showed. */
async function playQuiz(page: Page) {
  const seen: { word: string; options: string[] }[] = [];
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`${i} sang 5`).first()).toBeVisible();
    await expect(options(page)).toHaveCount(4);
    const opts = await options(page).evaluateAll((els) => els.map((e) => (e.querySelector("span.flex-1") ?? e).textContent ?? ""));
    const word = (await page.locator("main h2, h2").first().textContent()) ?? "";
    seen.push({ word, options: opts });
    await options(page).first().click();
    await page.getByRole("button", { name: i === 5 ? "Tan-awa ang resulta" : "Sunod" }).click();
  }
  await expect(page.getByTestId("quiz-score")).toBeVisible();
  return seen;
}

const quizStars = async (page: Page) => ((await readPersisted(page, "handog-progress"))?.state.quizStars as number | undefined) ?? 0;

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("5 questions, 4 distinct options each, results record stars exactly once", async ({ page }) => {
  await seed(page);
  const seen = await playQuiz(page);

  expect(seen).toHaveLength(5);
  expect(new Set(seen.map((q) => q.word)).size, "five different words").toBe(5);
  for (const q of seen) {
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size, `options of "${q.word}" are distinct`).toBe(4);
    expect(q.options.every((o) => o.startsWith("Hiligaynon-"))).toBe(true);
  }

  const score = await page.getByTestId("quiz-score").textContent();
  expect(score).toMatch(/^\d sang 5 ang tama$/);
  await expect.poll(() => quizStars(page)).toBe(1);
  // Stars on screen: word stars come from the (unsynced, raw-seeded) counter, so the quiz star is the total.
  await expect(page.getByText("Mga bituon: 1")).toBeVisible();

  // A re-render does not record a second time.
  await page.waitForTimeout(500);
  expect(await quizStars(page)).toBe(1);
  const progress = (await readPersisted(page, "handog-progress"))!.state;
  expect(progress.quizHighScore).toBe(Number(score!.match(/^(\d)/)![1]));

  // Reloading /quiz starts a fresh quiz and records nothing; stars persist.
  await page.reload();
  await expect(options(page)).toHaveCount(4);
  await page.waitForTimeout(500);
  expect(await quizStars(page)).toBe(1);
  await page.goto("/");
  await expect(page.getByText("1 ka bituon")).toBeVisible();
});

test("Retry builds a new quiz and a second finish adds exactly one more star", async ({ page }) => {
  await seed(page);
  const first = await playQuiz(page);
  await expect.poll(() => quizStars(page)).toBe(1);

  await page.getByRole("button", { name: "Liwat" }).click();
  const second = await playQuiz(page);
  expect(JSON.stringify(second), "a retry reshuffles questions/options").not.toBe(JSON.stringify(first));
  await expect.poll(() => quizStars(page)).toBe(2);
  await page.waitForTimeout(500);
  expect(await quizStars(page)).toBe(2);
});

test("with fewer than 4 saved words the quiz shows the not-enough state", async ({ page }) => {
  await seed(page, WORDS.slice(0, 3));
  const state = page.getByTestId("quiz-not-enough");
  await expect(state).toBeVisible();
  await expect(state).toContainText("May 3 ka pulong");
  await expect(options(page)).toHaveCount(0);
  expect(await quizStars(page)).toBe(0);
});

test("saved words that share one translation cannot make a quiz", async ({ page }) => {
  await seed(page, WORDS.map((w) => ({ ...w, translation: "Parehas" })));
  await expect(page.getByTestId("quiz-not-enough")).toBeVisible();
});
