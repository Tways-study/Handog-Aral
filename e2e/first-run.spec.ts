import { expect, test } from "@playwright/test";
import { gotoAs, readPersisted, stubApi } from "./helpers";

const GREETING_TL = /Magandang (umaga|hapon|gabi), Ana!/;
const GREETING = /Magandang (umaga|hapon|gabi)/;

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("new user lands on /welcome, picks Filipino, enters a name and starts", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole("heading", { name: "Handog Aral" })).toBeVisible();

  await page.getByRole("radio", { name: "Filipino" }).click();
  // The welcome copy switches language immediately.
  await expect(page.getByLabel("Ano ang pangalan mo?")).toBeVisible();
  await page.getByLabel("Ano ang pangalan mo?").fill("Ana");
  await page.getByRole("button", { name: "Magsimula tayo" }).click();

  // Step 2, the first superpower, comes before Home; this child just carries on.
  await expect(page.getByRole("heading", { name: "Ang Una Mong Superpower" })).toBeVisible();
  await expect(page.getByText("Kumusta, Ana!")).toBeVisible();
  await page.getByRole("button", { name: "Sige, tara na!" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: GREETING_TL })).toBeVisible();
  // Tagalog UI: stars/words chips and nav labels.
  await expect(page.getByText("0 bituin")).toBeVisible();
  await expect(page.getByText("0 salita")).toBeVisible();

  // Reload keeps the name, the language and does not bounce back to /welcome.
  await page.reload();
  await expect(page.getByRole("heading", { name: GREETING_TL })).toBeVisible();
  await expect(page.getByText("0 bituin")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  const settings = await readPersisted(page, "handog-settings");
  expect(settings?.state).toMatchObject({ childName: "Ana", language: "tagalog", onboarded: true });
});

test("Laktawan skips setup without a name and never shows /welcome again", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole("button", { name: "Laktawan" }).click();

  await expect(page).toHaveURL(/\/$/);
  // Default language is Filipino and the greeting has no name.
  await expect(page.getByRole("heading", { name: GREETING })).toBeVisible();
  await expect(page.getByRole("heading", { name: /,/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: GREETING })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  // Other routes do not redirect either.
  await page.goto("/books");
  await expect(page).toHaveURL(/\/books$/);
});

test("a returning user never sees /welcome", async ({ page }) => {
  await gotoAs(page, "/", { childName: "Ana", language: "tagalog" });
  await expect(page.getByRole("heading", { name: GREETING_TL })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  // Stay put across a few seconds of async hydration (saved words table, etc.).
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/$/);
});

test("a v1 settings blob with a name (pre-onboarding user) is treated as returning", async ({ page }) => {
  await page.goto("/offline");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onsuccess = () => {
          const tx = open.result.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put(JSON.stringify({ state: { childName: "Lola", language: "tagalog" }, version: 1 }), "handog-settings");
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Lola/ })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
