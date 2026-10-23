import { expect, test } from "@playwright/test";
import { countRows, gotoAs, readPersisted, stubApi } from "./helpers";

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("first superpower: tap a real word, the owl cheers, save it, earn the first sticker, carry on", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByText("Kumusta! Ako si Kuwago. Babasahin natin ang libro mo.")).toBeVisible();

  await page.getByLabel("Ano ang pangalan mo?").fill("Ana");
  await page.getByRole("button", { name: "Magsimula tayo" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Ang Una Mong Superpower" })).toBeVisible();
  await expect(page.getByText("Kumusta, Ana!")).toBeVisible();
  await expect(page.getByText("Pindutin ang salitang hindi mo kilala!")).toBeVisible();

  await page.locator("[data-super-paper]").getByRole("button", { name: "enormous", exact: true }).click();
  await expect(page.getByText("Nabasa mo na!")).toBeVisible();
  // The real panel: curated Filipino explanation, honest source line, works with every lookup API stubbed.
  const panel = page.locator("[data-slot=word-panel]");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "enormous" })).toBeVisible();
  await expect(panel).toHaveAttribute("data-source", /curated|ai|dictionary|offline/);

  await panel.getByRole("button", { name: "I-save" }).click();
  await expect.poll(() => countRows(page, "words")).toBe(1);
  // The first-word sticker celebration appears (the word sheet is a dialog too on mobile, so pick this one by its text;
  // the celebration host loads lazily and appears a moment after the sheet closes).
  const dialog = page.getByRole("dialog").filter({ hasText: "Bagong sticker!" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sige!" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Naitabi na! Ito ang una mong salita.")).toBeVisible();

  await page.getByRole("button", { name: "Sige, tara na!" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await readPersisted(page, "handog-settings"))?.state).toMatchObject({ childName: "Ana", onboarded: true });
  await expect(page.getByRole("heading", { name: /Magandang/ })).toBeVisible();
});

test("the superpower works with no network at all, and Laktawan skips it", async ({ page, context }) => {
  await gotoAs(page, "/welcome", { onboarded: false });
  await context.setOffline(true);
  await page.getByRole("button", { name: "Magsimula tayo" }).click();
  await page.locator("[data-super-paper]").getByRole("button", { name: "forest", exact: true }).click();
  await expect(page.locator("[data-slot=word-panel]")).toBeVisible();
  await expect(page.getByText("Nabasa mo na!")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Laktawan" }).click();
  await expect(page).toHaveURL(/\/$/);
  await context.setOffline(false);
});

test("Laktawan on the first step skips everything", async ({ page }) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Laktawan" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await readPersisted(page, "handog-settings"))?.state).toMatchObject({ onboarded: true });
});

test("tappable words show a dotted underline, the first unknown word gets one nudge, and a hint chip is visible", async ({ page }) => {
  await gotoAs(page, "/welcome", { onboarded: false });
  await page.getByRole("button", { name: "Magsimula tayo" }).click();
  const paper = page.locator("[data-super-paper]");
  const the = paper.getByRole("button", { name: "girl", exact: true });
  await expect(the).toBeVisible();
  expect(await the.evaluate((el) => getComputedStyle(el).textDecorationStyle)).toBe("dotted");
  await expect(paper.getByRole("button", { name: "enormous", exact: true })).toHaveAttribute("data-nudge", "true");
  await expect(page.locator("[data-slot=tap-hint]")).toBeVisible();
  // "Sige" stays paper (secondary) until the first tap
  await expect(page.getByRole("button", { name: "Sige, tara na!" })).toHaveAttribute("data-variant", "secondary");
});
