import { expect, test, type Page } from "@playwright/test";
import { gotoAs, isDesktop, savedWordRow, seedWords, stubApi, wordButton } from "./helpers";

/** Logs every inline-style change that looks like a tween (transform / opacity / --mark-x) from now on. */
async function watchTweens(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __tweens: string[] };
    w.__tweens = [];
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as HTMLElement;
        const style = el.getAttribute("style") ?? "";
        // The Progress bar's width is state (inline translateX), not a tween.
        if (el.dataset.slot === "progress-indicator") continue;
        if (/transform|opacity|--mark-x|translate|scale|rotate/.test(style)) {
          w.__tweens.push(`${el.tagName.toLowerCase()}${el.dataset.tokenIndex ? "[token]" : ""}${el.dataset.slot ? "[" + el.dataset.slot + "]" : ""}: ${style}`);
        }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true });
  });
}
const tweens = (page: Page) => page.evaluate(() => (window as unknown as { __tweens: string[] }).__tweens);

/** Animations still running or scheduled (finished ones are fine). */
const liveAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running" || a.pending)
      .map((a) => `${(a.effect as KeyframeEffect | null)?.target?.tagName}:${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? a.constructor.name}`),
  );

const WORDS = ["brave", "forest", "quiet", "stone"].map((w, i) => savedWordRow(w, `Hil-${w}`, {}, i));

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  test("reader: tapping a word runs no tween and leaves no running animation", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await expect(wordButton(page, "searched")).toBeVisible();
    await watchTweens(page);
    await wordButton(page, "searched").click();
    await expect(page.locator("[data-slot=word-panel]")).toBeVisible();
    await page.waitForTimeout(700);
    expect(await tweens(page), "GSAP must not touch elements under reduced motion").toEqual([]);
    expect(await liveAnimations(page)).toEqual([]);
    // Elements are simply in their final state.
    const panel = page.locator("[data-slot=word-panel]");
    expect(await panel.evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");
    // (CSS locator: the open modal drawer hides the page from role queries)
    const tapped = page.locator("[data-slot=reader-text] button[data-state=tapped]");
    await expect(tapped).toHaveText("searched");
    expect(await tapped.evaluate((el) => getComputedStyle(el, "::before").transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

    // Closing and opening another word is also still.
    if (!isDesktop(page)) await page.keyboard.press("Escape");
    await wordButton(page, "ran").click();
    await page.waitForTimeout(500);
    expect(await tweens(page)).toEqual([]);
    expect(await liveAnimations(page)).toEqual([]);
  });

  test("quiz: answering and finishing runs no tween and leaves no running animation", async ({ page }) => {
    await gotoAs(page, "/");
    await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();
    await seedWords(page, WORDS);
    await page.goto("/quiz");
    const options = page.getByRole("list", { name: /Hiligaynon/ }).getByRole("button");
    await expect(options).toHaveCount(4);
    await watchTweens(page);
    for (let i = 1; i <= 4; i++) {
      await options.first().click();
      await page.getByRole("button", { name: i === 4 ? "Tan-awa ang resulta" : "Sunod" }).click();
      await expect(page.getByText(`${i + 1} sang 4`).or(page.getByTestId("quiz-score")).first()).toBeVisible();
    }
    await expect(page.getByTestId("quiz-score")).toBeVisible();
    await page.waitForTimeout(600);
    expect(await tweens(page)).toEqual([]);
    expect(await liveAnimations(page)).toEqual([]);
  });

  test("route changes and the settings dialog are still", async ({ page }) => {
    await gotoAs(page, "/");
    await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();
    await page.goto("/settings");
    await watchTweens(page);
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForTimeout(500);
    expect(await liveAnimations(page)).toEqual([]);
    expect(await tweens(page)).toEqual([]);
  });
});

test.describe("control: motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the same watcher DOES see the marker sweep, so the reduced-motion assertions mean something", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await expect(wordButton(page, "searched")).toBeVisible();
    await watchTweens(page);
    await wordButton(page, "searched").click();
    await expect.poll(async () => (await tweens(page)).length, { timeout: 3000 }).toBeGreaterThan(0);
    expect((await tweens(page)).some((t) => t.includes("--mark-x"))).toBe(true);
  });
});
