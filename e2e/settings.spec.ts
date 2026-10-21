import { expect, test, type Page } from "@playwright/test";
import { countRows, gotoAs, readPersisted, savedWordRow, seedWords, stubApi } from "./helpers";

const persisted = async (page: Page) => (await readPersisted(page, "handog-settings"))?.state ?? {};
const html = (page: Page) => page.locator("html");

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("language switches the UI and persists across reload", async ({ page }) => {
  await gotoAs(page, "/settings", { childName: "Ana" });
  await expect(page.getByRole("radio", { name: "Hiligaynon" })).toBeChecked();
  await page.getByRole("radio", { name: "Filipino" }).click();
  await expect.poll(async () => (await persisted(page)).language).toBe("tagalog");

  await page.reload();
  await expect(page.getByRole("radio", { name: "Filipino" })).toBeChecked();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Magandang (umaga|hapon|gabi), Ana!/ })).toBeVisible();
});

test("font size changes the html class and scales the pad rule pitch", async ({ page }) => {
  await gotoAs(page, "/settings");
  const pitch = async () => {
    await page.goto("/read/fox");
    return page.evaluate(() => {
      const text = document.querySelector(".pad-text") as HTMLElement;
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const lh = parseFloat(getComputedStyle(text).lineHeight);
      const pad = getComputedStyle(text.closest(".pad")!).backgroundImage;
      return { rootPx, lh, rem: lh / rootPx, gradientHasPitch: pad.includes(`${lh}px`) };
    });
  };
  const results: Record<string, Awaited<ReturnType<typeof pitch>>> = {};

  for (const [label, cls, root] of [["Small", "font-small", 14], ["Large", "font-large", 20], ["Medium", "font-medium", 16]] as const) {
    await page.goto("/settings");
    await page.getByRole("radio", { name: label, exact: true }).click();
    await expect(html(page)).toHaveClass(new RegExp(`\\b${cls}\\b`));
    expect(await html(page).getAttribute("class")).not.toMatch(/font-(small|medium|large)[\s\S]*font-(small|medium|large)/);
    await expect.poll(async () => (await persisted(page)).fontSize).toBe(label.toLowerCase());
    results[label] = await pitch();
    expect(results[label].rootPx).toBe(root);
  }
  // Line height equals the rule pitch (in rem) at every size, and it grows with the font size.
  expect(results.Small.rem).toBeCloseTo(results.Medium.rem, 3);
  expect(results.Large.rem).toBeCloseTo(results.Medium.rem, 3);
  expect(results.Small.lh).toBeLessThan(results.Medium.lh);
  expect(results.Medium.lh).toBeLessThan(results.Large.lh);
  for (const r of Object.values(results)) expect(r.gradientHasPitch, "ruled lines use the same pitch as the line height").toBe(true);

  // Persists across reload.
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Large", exact: true }).click();
  await expect.poll(async () => (await persisted(page)).fontSize).toBe("large");
  await page.reload();
  await expect(html(page)).toHaveClass(/font-large/);
});

test("dyslexia font: body class, OpenDyslexic computed family, and the font file really loads", async ({ page }) => {
  await gotoAs(page, "/read/fox");
  await expect(page.locator("body")).not.toHaveClass(/dyslexia-font/);
  await page.goto("/settings");
  await page.getByRole("switch", { name: "Dyslexia-friendly font" }).click();
  await expect(page.locator("body")).toHaveClass(/dyslexia-font/);
  await expect.poll(async () => (await persisted(page)).dyslexiaFont).toBe(true);

  await page.goto("/read/fox");
  await expect(page.locator("body")).toHaveClass(/dyslexia-font/);
  const family = await page.locator("[data-slot=reader-text] button").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toMatch(/opendyslexic/i);

  // The declared family must resolve to a face that actually finished loading (not just a CSS variable).
  const faces = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, status: f.status }));
  });
  const dyslexic = faces.filter((f) => /opendyslexic/i.test(f.family));
  expect(dyslexic.length, `OpenDyslexic @font-face rules present (faces: ${JSON.stringify(faces)})`).toBeGreaterThan(0);
  expect(dyslexic.some((f) => f.status === "loaded"), `a OpenDyslexic face is loaded: ${JSON.stringify(dyslexic)}`).toBe(true);

  // Persists, and turning it off restores the original body font.
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/dyslexia-font/);
  await page.goto("/settings");
  await page.getByRole("switch", { name: "Dyslexia-friendly font" }).click();
  await expect(page.locator("body")).not.toHaveClass(/dyslexia-font/);
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily)).not.toMatch(/opendyslexic/i);
});

test("colour overlay tints the reading pad and persists", async ({ page }) => {
  await gotoAs(page, "/settings");
  await page.getByRole("radio", { name: "Yellow", exact: true }).click();
  await expect(page.getByTestId("overlay-preview")).toHaveClass(/overlay-yellow/);
  await expect.poll(async () => (await persisted(page)).colorOverlay).toBe("yellow");

  await page.reload();
  await expect(page.getByRole("radio", { name: "Yellow", exact: true })).toBeChecked();
  await page.goto("/read/fox");
  const pad = page.locator(".pad").first();
  await expect(pad).toHaveClass(/overlay-yellow/);
  const bg = await pad.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.goto("/settings");
  await page.getByRole("radio", { name: "None", exact: true }).click();
  await expect.poll(async () => (await persisted(page)).colorOverlay).toBe("none");
  await page.goto("/read/fox");
  await expect(page.locator(".pad").first()).not.toHaveClass(/overlay-/);
  expect(await page.locator(".pad").first().evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(bg);
});

test("theme dark / light / system, persisted, and no flash of the wrong theme on reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await gotoAs(page, "/settings");
  await expect(html(page)).not.toHaveClass(/\bdark\b/);

  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("handog-theme"))).toBe("dark");
  await expect.poll(async () => (await persisted(page)).theme).toBe("dark");

  // On the next load the class must already be on <html> when <body> is first created (before first paint).
  await page.addInitScript(() => {
    const w = window as unknown as { __darkAtBody?: boolean };
    const check = (obs?: MutationObserver) => {
      if (document.body && w.__darkAtBody === undefined) {
        w.__darkAtBody = document.documentElement.classList.contains("dark");
        obs?.disconnect();
      }
    };
    // document_start: <html> may not exist yet, so watch the whole document.
    new MutationObserver((_m, obs) => check(obs)).observe(document, { childList: true, subtree: true });
    check();
  });
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { __darkAtBody?: boolean }).__darkAtBody), "dark class set before <body> exists").toBe(true);
  await expect(html(page)).toHaveClass(/\bdark\b/);

  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(html(page)).not.toHaveClass(/\bdark\b/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("handog-theme"))).toBe("light");

  // System follows the device, live.
  await page.getByRole("radio", { name: "Same as device", exact: true }).click();
  await expect(html(page)).not.toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html(page)).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.getItem("handog-theme"))).toBe("system");
});

test("there is no API-key field anywhere", async ({ page }) => {
  for (const route of ["/settings", "/welcome", "/", "/scan"]) {
    await gotoAs(page, route);
    await page.waitForLoadState("networkidle");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, `${route} mentions an API key`).not.toMatch(/api[\s-]?key|gemini/);
    await expect(page.locator("input[type=password]")).toHaveCount(0);
  }
  await page.goto("/settings");
  const labels = await page.locator("input, textarea").evaluateAll((els) => els.map((e) => `${e.id} ${e.getAttribute("placeholder") ?? ""} ${e.getAttribute("name") ?? ""}`.toLowerCase()));
  expect(labels.join(" ")).not.toMatch(/key|token|secret/);
  expect(await page.evaluate(() => Object.keys(localStorage).join(","))).not.toMatch(/gemini|api/i);
});

test("Reset all progress clears words and progress but keeps settings", async ({ page }) => {
  const today = new Date();
  const lastActiveDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await gotoAs(
    page,
    "/",
    { childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, colorOverlay: "blue", theme: "dark" },
    { currentBookId: "fox", bookProgress: { fox: 67 }, streak: 3, lastActiveDate, quizHighScore: 4, quizStars: 2, savedWordCount: 4 },
  );
  await expect(page.getByRole("heading", { name: /Magandang/ })).toBeVisible();
  await seedWords(page, ["brave", "forest", "quiet", "stone"].map((w, i) => savedWordRow(w, `T-${w}`, { bookId: "fox" }, i)));
  await page.reload();
  await expect(page.getByText("4 salita")).toBeVisible();
  await expect(page.getByText("3 bituin")).toBeVisible();
  expect(await countRows(page, "words")).toBe(4);

  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset progress" }).click();
  const dialog = page.getByRole("dialog", { name: "Reset all progress?" });
  await expect(dialog).toBeVisible();
  // Cancel keeps everything.
  await dialog.getByRole("button", { name: "Keep my progress" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await countRows(page, "words")).toBe(4);

  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => countRows(page, "words")).toBe(0);
  await expect.poll(async () => ((await readPersisted(page, "handog-progress"))?.state.savedWordCount as number)).toBe(0);
  const progress = (await readPersisted(page, "handog-progress"))!.state;
  expect(progress).toMatchObject({ quizStars: 0, quizHighScore: 0, streak: 0, currentBookId: null });
  expect(Object.values(progress.bookProgress as Record<string, number>).every((n) => n === 0)).toBe(true);

  // Settings survive, including after a reload; and the child is not sent back through /welcome.
  const s = await persisted(page);
  expect(s).toMatchObject({ childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, colorOverlay: "blue", theme: "dark", onboarded: true });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Magandang (umaga|hapon|gabi), Ana!/ })).toBeVisible();
  await expect(page.getByText("0 salita")).toBeVisible();
  await expect(html(page)).toHaveClass(/font-large/);
  await expect(html(page)).toHaveClass(/\bdark\b/);
});

test("Fun group: switches persist, the owl wardrobe link works, and Text size is visible above the nav at first view", async ({ page }) => {
  await gotoAs(page, "/settings");
  const size = page.getByRole("radio", { name: "Medium", exact: true });
  const nav = await page.locator("[data-slot=bottom-nav]").boundingBox();
  const box = await size.boundingBox();
  if (nav && (page.viewportSize()?.width ?? 0) < 1024) expect(box!.y + box!.height).toBeLessThanOrEqual(nav.y);
  await page.getByRole("switch", { name: "Sounds" }).click();
  await page.getByRole("switch", { name: "Animated 3D owl" }).click();
  await expect.poll(async () => (await persisted(page)).sound).toBe(true);
  await expect.poll(async () => (await persisted(page)).owl3d).toBe(true);
  await expect(page.getByRole("button", { name: "Play a test sound" })).toBeEnabled();
  await expect(page.getByText("For parents, teachers and guardians")).toBeVisible();
  await page.getByRole("link", { name: "Open the sticker book" }).click();
  await expect(page).toHaveURL(/\/stickers$/);
});
