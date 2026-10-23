import { expect, test } from "@playwright/test";
import { gotoAs, stubApi } from "./helpers";

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("unknown route lands on the in-world not-found page with a way home", async ({ page }) => {
  await gotoAs(page, "/definitely-not-a-page");
  const system = page.locator("[data-system-page=notFound]");
  await expect(system).toBeVisible();
  await expect(system.getByRole("heading", { level: 1 })).toHaveText("Hindi makita ang pahina");
  await expect(page).toHaveTitle(/Page not found/);
  // Never a stack trace or framework text.
  await expect(page.getByText(/404|stack|Error:/)).toHaveCount(0);
  await expect(system.getByRole("link", { name: "Bumalik sa Tahanan" })).toBeVisible();
  await expect(system.getByRole("link", { name: "Buksan ang I-scan" })).toBeVisible();
  await system.getByRole("link", { name: "Bumalik sa Tahanan" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("an unknown book id is the same not-found page, in Filipino when chosen, and the nav stays", async ({ page }) => {
  await gotoAs(page, "/read/no-such-book", { language: "tagalog" });
  const system = page.locator("[data-system-page=notFound]");
  await expect(system.getByRole("heading", { level: 1 })).toHaveText("Hindi makita ang pahina");
  await expect(page.getByRole("link", { name: "Bumalik sa Tahanan" })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
});
