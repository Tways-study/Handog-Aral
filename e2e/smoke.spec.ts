import { expect, test } from "@playwright/test";

test("home loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  // A first run redirects to /welcome; either way the app shell renders.
  await expect(page.locator("body")).toBeVisible();
});
