import { expect, test, type Page } from "@playwright/test";
import { gotoAs, isDesktop, stubApi, wordButton, wordExplanation } from "./helpers";

const SEARCHED = wordExplanation("searched", {
  translation: "Nagpangita - gin-usisa ang tanan",
  english: "Looked carefully for something.",
  example: "She searched the whole room.",
});

/** The panel that holds the explanation: the docked aside on desktop, the open drawer on mobile. */
function panelRoot(page: Page) {
  return isDesktop(page) ? page.getByRole("complementary") : page.getByRole("dialog");
}

async function openFox(page: Page) {
  await page.goto("/books");
  await page.getByRole("link", { name: /The Brave Little Fox/ }).click();
  await expect(page).toHaveURL(/\/read\/fox$/);
  await expect(wordButton(page, "searched")).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  await stubApi(context, { explain: (body, route) => route.fulfill({ json: wordExplanation(body.word, body.word === "searched" ? SEARCHED : {}) }) });
});

test("tap a word: home-language text first, drawer on mobile / docked panel on desktop", async ({ page }) => {
  await gotoAs(page, "/books");
  await openFox(page);
  const word = wordButton(page, "searched");
  await word.click();

  const panel = panelRoot(page);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "searched", exact: true })).toBeVisible();
  const translation = panel.getByText(SEARCHED.translation);
  const english = panel.getByText(SEARCHED.english);
  await expect(translation).toBeVisible();
  await expect(english).toBeVisible();
  const tBox = (await translation.boundingBox())!;
  const eBox = (await english.boundingBox())!;
  expect(tBox.y, "home-language explanation comes before the English meaning").toBeLessThan(eBox.y);
  await expect(panel.locator("[data-slot=word-panel]")).toHaveAttribute("data-source", "ai");

  if (isDesktop(page)) {
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Docked on the right, beside (not over) the text.
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThan(800);
    const textBox = (await page.locator("[data-slot=reader-text]").boundingBox())!;
    expect(textBox.x + textBox.width).toBeLessThanOrEqual(box.x + 1);
  } else {
    // Focus moves into the drawer.
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // ...and returns to the tapped word.
    await expect(word).toBeFocused();
  }
});

test("save underlines the word, lists it in /words, raises book progress; remove undoes it", async ({ page }) => {
  await gotoAs(page, "/books");
  await openFox(page);
  await wordButton(page, "searched").click();
  const panel = panelRoot(page);
  await expect(panel.getByText(SEARCHED.translation)).toBeVisible();

  const save = panel.getByRole("button", { name: "Tipigi" });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await save.click();
  await expect(panel.getByRole("button", { name: "Natipigan na" })).toHaveAttribute("aria-pressed", "true");

  // Move on to another word so the saved word is no longer "tapped": it must now be underlined.
  if (!isDesktop(page)) await page.keyboard.press("Escape");
  await wordButton(page, "ran").click();
  // (the open modal drawer hides the page from the accessibility tree, so close it before role queries)
  if (!isDesktop(page)) await page.keyboard.press("Escape");
  await expect(wordButton(page, "searched")).toHaveAttribute("data-state", "saved");
  await expect(wordButton(page, "searched")).toHaveCSS("text-decoration-line", "underline");

  // Progress on the book increased: 1 of 6 saved words = 17%.
  await page.goto("/books");
  const foxCard = page.getByRole("link", { name: /The Brave Little Fox/ });
  await expect(foxCard.getByText("17%")).toBeVisible();

  await page.goto("/words");
  await expect(page.getByText("searched", { exact: true }).first()).toBeVisible();

  // Remove from the reader: the panel toggles back and progress returns to 0.
  await page.goto("/read/fox");
  await wordButton(page, "searched").click();
  const p2 = panelRoot(page);
  await p2.getByRole("button", { name: "Natipigan na" }).click();
  await expect(p2.getByRole("button", { name: "Tipigi" })).toHaveAttribute("aria-pressed", "false");
  await page.goto("/books");
  await expect(page.getByRole("link", { name: /The Brave Little Fox/ }).getByText("0%")).toBeVisible();
  await page.goto("/words");
  await expect(page.getByText("searched", { exact: true })).toHaveCount(0);
});

test("tapping A then B quickly shows only B (stale guard)", async ({ context, page }) => {
  await context.unroute("**/api/explain");
  await context.route("**/api/explain", async (route) => {
    const body = route.request().postDataJSON() as { word: string };
    if (body.word === "searched") {
      await new Promise((r) => setTimeout(r, 1800));
      await route.fulfill({ json: wordExplanation("searched", { translation: "SLOW-A-TRANSLATION" }) }).catch(() => {});
    } else {
      await route.fulfill({ json: wordExplanation(body.word, { translation: "FAST-B-TRANSLATION" }) });
    }
  });
  await gotoAs(page, "/read/fox");
  await wordButton(page, "searched").click();
  const panel = panelRoot(page);
  await expect(panel.getByRole("heading", { name: "searched", exact: true })).toBeVisible();
  // On mobile the modal drawer must be dismissed before the next word can be tapped.
  if (!isDesktop(page)) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await wordButton(page, "ran").click();
  const p2 = panelRoot(page);
  await expect(p2.getByText("FAST-B-TRANSLATION")).toBeVisible();
  await expect(p2.getByRole("heading", { name: "ran", exact: true })).toBeVisible();
  // Let the slow response for A land (or be aborted) and make sure B is still what is shown.
  await page.waitForTimeout(2300);
  await expect(p2.getByRole("heading", { name: "ran", exact: true })).toBeVisible();
  await expect(p2.getByText("FAST-B-TRANSLATION")).toBeVisible();
  await expect(page.getByText("SLOW-A-TRANSLATION")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "searched", exact: true })).toHaveCount(0);
});
