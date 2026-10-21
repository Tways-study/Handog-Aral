import { expect, test } from "@playwright/test";
import { countRows, gotoAs, readPersisted, stubApi } from "./helpers";

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("first superpower: tap a real word, the owl cheers, save it, earn the first sticker, carry on", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByText("Kamusta! Ako si Kuwago. Basahon ta ang imo libro.")).toBeVisible();

  await page.getByLabel("Ano ang imo ngalan?").fill("Ana");
  await page.getByRole("button", { name: "Magsugod kita" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Imo Una nga Superpower" })).toBeVisible();
  await expect(page.getByText("Kamusta, Ana!")).toBeVisible();
  await expect(page.getByText("Pindota ang pulong nga indi mo kilala!")).toBeVisible();

  await page.locator("[data-super-paper]").getByRole("button", { name: "enormous", exact: true }).click();
  await expect(page.getByText("Nabasa mo na!")).toBeVisible();
  // The real panel: curated Hiligaynon explanation, honest source line, works with every lookup API stubbed.
  const panel = page.locator("[data-slot=word-panel]");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "enormous" })).toBeVisible();
  await expect(panel).toHaveAttribute("data-source", /curated|ai|dictionary|offline/);

  await panel.getByRole("button", { name: "Tipigi" }).click();
  await expect.poll(() => countRows(page, "words")).toBe(1);
  // The first-word sticker celebration appears (the word sheet is a dialog too on mobile, so pick this one by its text;
  // the celebration host loads lazily and appears a moment after the sheet closes).
  const dialog = page.getByRole("dialog").filter({ hasText: "Bag-o nga sticker!" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sige!" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Natipigan na! Imo ini nga una nga pulong.")).toBeVisible();

  await page.getByRole("button", { name: "Sige, kadi ta na!" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await readPersisted(page, "handog-settings"))?.state).toMatchObject({ childName: "Ana", onboarded: true });
  await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();
});

test("the superpower works with no network at all, and Laktawan skips it", async ({ page, context }) => {
  await gotoAs(page, "/welcome", { onboarded: false });
  await context.setOffline(true);
  await page.getByRole("button", { name: "Magsugod kita" }).click();
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
