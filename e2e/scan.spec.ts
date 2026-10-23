import { expect, test, type Page } from "@playwright/test";
import { gotoAs, isDesktop, stubApi } from "./helpers";
import { settleCelebrations } from "./moments.helpers";

const LINES = ["The quick brown fox", "jumps over the lazy dog", "every morning at school"];

/** Draws clear black-on-white text into a PNG, entirely in the page (no fixture files). */
async function textImage(page: Page, lines: string[] = LINES) {
  const dataUrl = await page.evaluate((ls) => {
    const c = document.createElement("canvas");
    c.width = 1100;
    c.height = 120 + ls.length * 110;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#000";
    g.font = "bold 72px Arial, Helvetica, sans-serif";
    g.textBaseline = "top";
    ls.forEach((l, i) => g.fillText(l, 50, 60 + i * 110));
    return c.toDataURL("image/png");
  }, lines);
  return { name: "page.png", mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") };
}

const upload = async (page: Page, file: Awaited<ReturnType<typeof textImage>>) => page.locator("input[type=file]").setInputFiles(file);
const readerWord = (page: Page, word: string) => page.locator("[data-slot=reader-text]").getByRole("button", { name: word, exact: true }).first();

test("an online scan goes through the proxy and shows the AI scan badge", async ({ page, context }) => {
  const stub = await stubApi(context, { ocr: (route) => route.fulfill({ json: { text: "The small fox ran home.\nIt was happy." } }) });
  await gotoAs(page, "/scan");
  await expect(page.getByRole("button", { name: "Buksan ang camera" })).toBeVisible();
  await upload(page, await textImage(page));

  await expect(readerWord(page, "fox")).toBeVisible();
  await expect(page.getByText("AI scan")).toBeVisible();
  await expect(page.getByText("Offline scan")).toHaveCount(0);
  expect(stub.ocrCalls).toBe(1);
  // The scanned text is tappable like any page.
  expect(await page.locator("[data-slot=reader-text] button").count()).toBeGreaterThanOrEqual(8);
});

test("proxy unreachable: the local Tesseract engine reads a clear page and says so", async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const stub = await stubApi(context, { health: false, ocr: (route) => route.abort("internetdisconnected") });
  await gotoAs(page, "/scan");
  await upload(page, await textImage(page));

  // Either the badge or a typed error must appear; headless WASM failures are reported precisely.
  const badge = page.getByText("Offline scan");
  const error = page.locator("[role=alert]", { hasText: /\S/ }).filter({ hasNot: page.locator("#__next-route-announcer__") });
  await expect(badge.or(error)).toBeVisible({ timeout: 90_000 });
  if (await error.isVisible()) {
    test.fixme(true, `Tesseract did not run in headless Chromium (${info.project.name}): "${await error.innerText()}"`);
  }
  await expect(badge).toBeVisible();
  expect(stub.ocrCalls, "proxy not used when unreachable").toBe(0);
  const text = (await page.locator("[data-slot=reader-text]").innerText()).toLowerCase();
  for (const w of ["quick", "brown", "jumps", "lazy", "morning", "school"]) expect(text, `recognized "${w}" in: ${text}`).toContain(w);
  await expect(readerWord(page, "quick")).toBeVisible();
});

test("cancel mid-scan returns to the start screen and the late result is ignored", async ({ page, context }) => {
  await stubApi(context, {
    ocr: async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.fulfill({ json: { text: "LATE RESULT SHOULD NEVER APPEAR" } }).catch(() => {});
    },
  });
  await gotoAs(page, "/scan");
  await upload(page, await textImage(page));
  await expect(page.getByRole("status").filter({ hasText: "Binabasa ang pahina" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();

  await page.getByRole("button", { name: "Kanselahin" }).click();
  await expect(page.getByRole("button", { name: "Buksan ang camera" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.waitForTimeout(3500);
  await expect(page.getByRole("button", { name: "Buksan ang camera" })).toBeVisible();
  await expect(page.getByText("LATE RESULT")).toHaveCount(0);
  await expect(page.locator("[data-slot=reader-text]")).toHaveCount(0);
});

test("a stale scan never overwrites a newer one", async ({ page, context }) => {
  let n = 0;
  await stubApi(context, {
    ocr: async (route) => {
      const mine = ++n;
      if (mine === 1) {
        await new Promise((r) => setTimeout(r, 2500));
        return route.fulfill({ json: { text: "Stale page from the first scan." } }).catch(() => {});
      }
      return route.fulfill({ json: { text: "Fresh page from the second scan." } });
    },
  });
  await gotoAs(page, "/scan");
  await upload(page, await textImage(page));
  await expect(page.getByRole("button", { name: "Kanselahin" })).toBeVisible();
  await page.getByRole("button", { name: "Kanselahin" }).click();
  await upload(page, await textImage(page, ["Second page"]));

  await expect(readerWord(page, "Fresh")).toBeVisible();
  await page.waitForTimeout(3500);
  await settleCelebrations(page, 500); // the first scan earns a sticker; its dialog hides the page until closed
  await expect(readerWord(page, "Fresh")).toBeVisible();
  await expect(page.getByText("Stale", { exact: false })).toHaveCount(0);
  expect(await page.locator("[data-slot=reader-text]").innerText()).toContain("second scan");
});

test("a proxy that returns blank text falls back to the local engine, which reports no text instead of hanging", async ({ page, context }) => {
  test.setTimeout(120_000);
  await stubApi(context, { ocr: (route) => route.fulfill({ json: { text: "   " } }) });
  await gotoAs(page, "/scan");
  // A blank white image: nothing to read.
  const blank = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 300;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 400, 300);
    return c.toDataURL("image/png");
  });
  await upload(page, { name: "blank.png", mimeType: "image/png", buffer: Buffer.from(blank.split(",")[1], "base64") });
  await expect(page.getByText("Wala kami sang makita nga teksto")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Buksan ang camera" })).toBeVisible();
});

test("start screen: the camera is the hero tile, the other two are real buttons with visible names, nothing scrolls sideways", async ({ page }) => {
  await gotoAs(page, "/scan");
  const camera = page.getByRole("button", { name: "Buksan ang camera Kunan ng larawan ang pahina." });
  await expect(camera).toBeVisible();
  await expect(camera).toHaveAttribute("data-primary", "true");
  await expect(page.getByRole("button", { name: /^Pumili sa gallery/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^I-type o i-paste/ })).toBeVisible();
  // the hero owl and the decorative doodles are not in the accessibility tree
  await expect(page.locator("[data-slot=scan-tiles] [data-owl-renderer]")).toHaveCount(1);
  for (const slot of ["photo-doodle", "pencil-doodle", "scan-page-doodle"]) {
    await expect(page.locator(`[data-slot=${slot}]`)).toHaveAttribute("aria-hidden", "true");
  }
  // every tile is at least 44 px tall and inside the viewport width
  for (const tile of await page.locator("[data-slot=scan-tile]").all()) {
    const b = (await tile.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // the camera tile is the ink-navy jacket (indigo), not the sunrise orange of the nav
  const bg = await camera.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(43, 58, 140)");
});

test("a finished scan: the owl says it once, then the prompt; whoosh-time sticker; text develops and is fully visible after", async ({ page, context }) => {
  await stubApi(context, { ocr: (route) => route.fulfill({ json: { text: "The small fox ran home.\nIt was happy.\nThe sun was warm.\nWhat a day." } }) });
  await gotoAs(page, "/scan");
  await upload(page, await textImage(page));
  await expect(readerWord(page, "fox")).toBeVisible();
  const intro = isDesktop(page) ? page.locator("[data-slot=pane-owl]") : page.locator("[data-slot=scan-moment]");
  await expect(intro).toContainText("Nabasa mo na ang aklat mo!");
  // then the prompt
  await expect(intro).toContainText("I-tap ang salitang hindi mo alam", { timeout: 6000 });
  // the first scan earns its sticker after the reveal
  await expect(page.getByTestId("celebration")).toBeVisible({ timeout: 4000 });
  await expect(page.getByTestId("celebration")).toContainText("Una nga Scan");
  await settleCelebrations(page, 500);
  // every line ended up fully opaque
  await expect.poll(() => page.locator("[data-slot=reader-text] [data-line]").evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === "1"))).toBe(true);

  // a second scan never repeats the one-time line
  await page.goto("/scan");
  await upload(page, await textImage(page));
  await expect(readerWord(page, "fox")).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByText("Nabasa mo na ang aklat mo!")).toHaveCount(0);
});
