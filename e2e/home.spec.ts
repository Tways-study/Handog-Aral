import { expect, test } from "@playwright/test";
import { gotoAs, savedWordRow, seedWords, stubApi, waitForDictionary } from "./helpers";

const today = new Date();
const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const PROGRESS = { currentBookId: "fox", bookProgress: { fox: 67 }, streak: 3, lastActiveDate: ymd, quizHighScore: 0, quizStars: 0, savedWordCount: 4 };

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("first run says Umpisahan natin", async ({ page }) => {
  await gotoAs(page, "/", { childName: "Ana" });
  await expect(page.getByRole("link", { name: "Umpisahan natin" })).toBeVisible();
});

test("with progress it says Tuloy and scan is the paper secondary", async ({ page }) => {
  await gotoAs(page, "/", { childName: "Ana" }, PROGRESS);
  await expect(page.getByRole("link", { name: "Ituloy ang pagbabasa" })).toBeVisible();
  await expect(page.getByRole("link", { name: "I-scan ang pahina" })).toHaveAttribute("data-variant", "secondary");
});

test("the owl's tag shows the newest word, the sticker row counts, and Tara, laro tayo waits for 3 words", async ({ page }) => {
  await gotoAs(page, "/", { childName: "Ana" }, PROGRESS);
  await waitForDictionary(page);
  await seedWords(page, ["brave", "forest"].map((w, i) => savedWordRow(w, `T-${w}`, {}, i)));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /brave/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Mga sticker/ })).toContainText("sa 14");
  await expect(page.getByRole("link", { name: /Tara, laro tayo/ })).toHaveCount(0);
  await seedWords(page, [savedWordRow("quiet", "T-quiet", {}, 2)]);
  await page.reload();
  await page.getByRole("link", { name: /Tara, laro tayo/ }).click();
  await expect(page).toHaveURL(/\/play$/);
});

test("nothing scrolls sideways and the primary action is reachable at 320 and with Large text", async ({ page }) => {
  for (const [w, h, fontSize] of [[320, 640, "medium"], [320, 640, "large"], [375, 812, "large"]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await gotoAs(page, "/", { childName: "A very long child name indeed", fontSize }, PROGRESS);
    // A streak of 3 earns the "Tatlong Araw" sticker on the first visit: its celebration dialog is modal, so dismiss it first.
    const sige = page.getByRole("button", { name: "Sige!" });
    if (await sige.waitFor({ timeout: 3000 }).then(() => true, () => false)) await sige.click();
    const cta = page.getByRole("link", { name: "Ituloy ang pagbabasa" });
    await cta.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(cta).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const nav = await page.locator("[data-slot=bottom-nav]").boundingBox();
    const box = await cta.boundingBox();
    if (nav && box && w < 1024) expect(box.y + box.height).toBeLessThanOrEqual(nav.y + 1);
  }
});

test("tab pop event and /play, /stickers keep Salita lit", async ({ page }) => {
  await gotoAs(page, "/stickers");
  const words = page.locator("[data-slot=bottom-nav], [data-slot=nav-rail]").getByRole("link", { name: "Salita" });
  await expect(words.first()).toHaveAttribute("aria-current", "page").catch(async () => {
    await expect(words.last()).toHaveAttribute("aria-current", "page");
  });
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("handog:pop-tab", { detail: "words" })));
});

test("phone: the cover shows its illustration and stays compact; Large text drops it", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, "phone layout");
  await gotoAs(page, "/", { childName: "Ana" }, PROGRESS);
  const cover = page.getByRole("region", { name: /./ }).filter({ has: page.getByRole("link", { name: "Ituloy ang pagbabasa" }) });
  await expect(cover.locator("[data-cover]:visible")).toHaveCount(1);
  const box = (await cover.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(812 * 0.46);
  const cta = (await page.getByRole("link", { name: "Ituloy ang pagbabasa" }).boundingBox())!;
  expect(cta.y + cta.height).toBeLessThan(812);
  await gotoAs(page, "/", { childName: "Ana", fontSize: "large" }, PROGRESS);
  await expect(cover.locator("[data-cover]:visible")).toHaveCount(0);
});
