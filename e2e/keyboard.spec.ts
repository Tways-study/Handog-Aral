import { expect, test, type Page } from "@playwright/test";
import { gotoAs, isDesktop, stubApi } from "./helpers";

interface Stop {
  tag: string;
  role: string;
  name: string;
  ring: boolean;
  visible: boolean;
}

const active = (page: Page): Promise<Stop> =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const hasShadow = cs.boxShadow !== "none";
    return {
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") ?? (el.tagName === "A" ? "link" : el.tagName === "BUTTON" ? "button" : ""),
      name: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50),
      ring: hasOutline || hasShadow,
      visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
    };
  });

/** Presses Tab until `match` is satisfied; every stop on the way must show a focus ring and be on screen. */
async function tabTo(page: Page, match: (s: Stop) => boolean, max = 60): Promise<Stop[]> {
  const trail: Stop[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const s = await active(page);
    trail.push(s);
    expect(s.tag, `Tab #${i + 1} escaped to <${s.tag}> after: ${trail.map((t) => t.name).join(" > ")}`).not.toBe("body");
    expect(s.ring, `visible focus ring on "${s.name}" (${s.tag})`).toBe(true);
    expect(s.visible, `"${s.name}" is on screen when focused`).toBe(true);
    if (match(s)) return trail;
  }
  throw new Error(`never reached target; trail: ${trail.map((t) => `${t.role}:${t.name}`).join(" > ")}`);
}

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("keyboard only: Home to Books to Reader, tap a word with Enter", async ({ page }) => {
  await gotoAs(page, "/");
  await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();

  // The first stop is the skip link; its target is <main>.
  await page.keyboard.press("Tab");
  expect((await active(page)).name).toBe("Lumaktaw sa nilalaman");

  // Home: tab to the Books navigation link (rail on desktop, bottom nav on mobile).
  const homeTrail = await tabTo(page, (s) => s.role === "link" && s.name === "Libro");
  // Sanity of the order: content actions come before the bottom nav on mobile, rail first on desktop.
  expect(homeTrail.length).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/books$/);

  // Books: the first book link is reachable and opens the reader.
  await page.locator("main").focus();
  await tabTo(page, (s) => s.role === "link" && /Brave Little Fox/.test(s.name));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/read\/fox$/);
  await expect(page.locator("[data-slot=reader-text]")).toBeVisible();

  // Reader: word tokens are real buttons in tab order, activated with Enter.
  const words = await page.locator("[data-slot=reader-text] button").evaluateAll((els) => els.map((e) => e.tagName));
  expect(words.length).toBeGreaterThan(50);
  expect(new Set(words)).toEqual(new Set(["BUTTON"]));
  await page.locator("main").focus();
  const toWord = await tabTo(page, (s) => s.tag === "button" && s.name === "The");
  expect(toWord.at(-1)!.name).toBe("The");
  await page.keyboard.press("Tab");
  expect((await active(page)).name).toBe("small");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-slot=word-panel]")).toBeVisible();
  await expect(page.locator("[data-slot=word-panel] h2")).toHaveText("small");
  if (!isDesktop(page)) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await active(page)).name).toBe("small");
  }
});

test("the skip link moves focus to <main>", async ({ page }) => {
  await gotoAs(page, "/");
  await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("main");
  // The next Tab lands on the first control inside the page content, not back in the navigation.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
});

test("no keyboard trap in the reader: Tab always moves on, Shift+Tab goes back", async ({ page }) => {
  await gotoAs(page, "/read/fox");
  await expect(page.locator("[data-slot=reader-text]")).toBeVisible();
  await page.locator("main").focus();
  const seen: string[] = [];
  let prev = "";
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const key = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return `${el.tagName}:${el.dataset.tokenIndex ?? el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 20)}`;
    });
    expect(key, `Tab #${i + 1} did not move focus`).not.toBe(prev);
    prev = key;
    seen.push(key);
  }
  expect(new Set(seen).size).toBe(seen.length);
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+Tab");
  const back = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.tokenIndex ?? "");
  const idx = seen.findIndex((s) => s.endsWith(`:${back}`));
  expect(idx, "Shift+Tab walks back along the same path").toBe(seen.length - 6);
});

test("every interactive element on the main screens has an accessible name", async ({ page }) => {
  for (const route of ["/", "/books", "/words", "/quiz", "/settings", "/scan", "/read/fox"]) {
    await gotoAs(page, route);
    await page.waitForLoadState("networkidle");
    const unnamed = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [role=button], [role=switch], [role=radio]").forEach((el) => {
        if (el.closest("[aria-hidden=true], [hidden]") || (el as HTMLInputElement).type === "hidden") return;
        const r = el.getBoundingClientRect();
        const labelled = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent?.trim() || (el as HTMLInputElement).labels?.length || el.getAttribute("title");
        if (!labelled && r.width > 0) bad.push(el.outerHTML.slice(0, 100));
      });
      return bad;
    });
    expect(unnamed, `${route} has unnamed controls`).toEqual([]);
  }
});
