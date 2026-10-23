import { expect, test, type Page } from "@playwright/test";
import { gotoAs, isDesktop, readPersisted, savedWordRow, seedWords, stubApi, wordButton, wordExplanation } from "./helpers";
import { celebration, expectInViewport, mockSpeechBoundary, recordTabPops, settleCelebrations, tabPops } from "./moments.helpers";

const HARD = (body: { word: string }) => wordExplanation(body.word, { difficulty: "hard" });

test.beforeEach(async ({ context }) => {
  await stubApi(context, { explain: (body, route) => route.fulfill({ json: HARD(body) }) });
});

/** A word by CSS: role queries cannot see the page while a modal sheet or dialog is open. */
const pageWord = (page: Page, word: string) => page.locator("[data-slot=reader-text] button", { hasText: new RegExp(`^${word}$`) }).first();
const panel = (page: Page) => (isDesktop(page) ? page.getByRole("complementary") : page.getByRole("dialog"));
/** Where the owl's first-tap / first-save words appear: the pane owl on desktop, the sheet's corner owl on mobile. */
const owlWords = (page: Page) => (isDesktop(page) ? page.locator("[data-slot=pane-owl]") : page.locator("[data-slot=sheet-moment]"));

test.describe("reader moments (motion allowed)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the very first tapped word: the owl says Nabasa mo na!, the well glows once, and never again", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await wordButton(page, "searched").click();
    await expect(owlWords(page)).toContainText("Nabasa mo na!");
    await expect(page.locator("[data-slot=home-well]")).toHaveAttribute("data-emphasis", "true");
    await expect.poll(async () => (await readPersisted(page, "handog-moments"))?.state.firstTap).toBe(true);

    // It fades after ~1.8 s; the well settles.
    await expect(page.locator("[data-slot=home-well]")).not.toHaveAttribute("data-emphasis", "true", { timeout: 4000 });
    if (isDesktop(page)) await expect(owlWords(page)).not.toContainText("Nabasa mo na!");
    else await expect(owlWords(page)).toHaveCount(0);

    // A second word, and a whole new visit, get nothing special.
    if (!isDesktop(page)) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await wordButton(page, "ran").click();
    await expect(panel(page).getByRole("heading", { name: "ran", exact: true })).toBeVisible();
    await expect(page.getByText("Nabasa mo na!")).toHaveCount(0);
    await expect(page.locator("[data-slot=home-well]")).not.toHaveAttribute("data-emphasis", "true");
    await page.reload();
    await wordButton(page, "forest").click();
    await expect(panel(page).getByRole("heading", { name: "forest", exact: true })).toBeVisible();
    await expect(page.getByText("Nabasa mo na!")).toHaveCount(0);
  });

  test("first save: the big stamp lands on the word, a star flies to Pulong, the tab pops, then the sticker dialog (never on top of the stamp)", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await recordTabPops(page);
    await wordButton(page, "searched").click();
    const p = panel(page);
    await expect(p.getByText("Filipino: searched")).toBeVisible();
    const wordBox = (await pageWord(page, "searched").boundingBox())!;
    await p.getByRole("button", { name: "I-save" }).click();

    // The stamp: ~96 px, over the saved word, ignoring pointers, hidden from assistive tech.
    const stamp = page.locator("[data-slot=save-stamp]");
    await expect(stamp).toBeVisible();
    await page.waitForTimeout(450); // landed
    const box = (await stamp.boundingBox())!;
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(94);
    expect(Math.round(box.width)).toBeLessThanOrEqual(98);
    const wordNow = (await pageWord(page, "searched").boundingBox()) ?? wordBox;
    expect(Math.abs(box.x + box.width / 2 - (wordNow.x + wordNow.width / 2))).toBeLessThan(40);
    expect(Math.abs(box.y + box.height / 2 - (wordNow.y + wordNow.height / 2))).toBeLessThan(40);
    await expect(stamp).toHaveAttribute("aria-hidden", "true");
    await expect(stamp).toHaveCSS("pointer-events", "none");

    // The star flies, the nav tab is told to pop.
    await expect(page.locator("[data-fly-star]")).toBeVisible({ timeout: 2000 });
    await expect.poll(() => tabPops(page), { timeout: 3000 }).toContain("words");
    await expect(page.locator("[data-fly-star]")).toHaveCount(0);

    // The owl cheers on the first ever save.
    await expect.poll(async () => (await readPersisted(page, "handog-moments"))?.state.firstSave).toBe(true);

    // Then the sticker dialog: the stamp is gone by then.
    await expect(celebration(page)).toBeVisible({ timeout: 4000 });
    await expect(stamp).toHaveCount(0);
    await expect(celebration(page)).toContainText("Una nga Pulong");
    // A hard word also earns its own sticker (the real difficulty was passed on); both are queued.
    await expect(celebration(page)).toContainText(/\+?\s*1/);
    expect(await settleCelebrations(page, 500)).toBeGreaterThanOrEqual(1);
    const rewards = (await readPersisted(page, "handog-rewards"))!.state as { earned: Record<string, number> };
    expect(Object.keys(rewards.earned)).toEqual(expect.arrayContaining(["first-word", "hard-word"]));
    // ...and the book moved along (1 of 6 words = 17%).
    expect(((await readPersisted(page, "handog-progress"))!.state.bookProgress as Record<string, number>).fox).toBe(17);
  });

  test("a second save stamps again but the owl does not repeat the first-save line", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await wordButton(page, "searched").click();
    await panel(page).getByRole("button", { name: "I-save" }).click();
    await settleCelebrations(page, 4000);
    if (!isDesktop(page)) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await wordButton(page, "ran").click();
    await panel(page).getByRole("button", { name: "I-save" }).click();
    await expect(page.locator("[data-slot=save-stamp]")).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(page.getByText("Una mo itong salita! Ang galing!")).toHaveCount(0);
  });

  test("the owl on the page: mobile peeks over the nav and fades its tag; desktop pane owl counts the saved words", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    if (isDesktop(page)) {
      await expect(page.locator("[data-slot=pane-owl]")).toContainText("I-tap ang salita, tutulungan kita!");
      await wordButton(page, "searched").click();
      await page.getByRole("complementary").getByRole("button", { name: "I-save" }).click();
      await settleCelebrations(page, 4000);
      await expect(page.locator("[data-slot=pane-owl]")).toContainText("1 salita sa pahina nga ini ang natipigan mo na", { timeout: 6000 });
      return;
    }
    const owl = page.locator("[data-slot=peek-owl]");
    await expect(owl).toHaveAttribute("data-shown", "true");
    const tag = owl.locator("[data-slot=owl-tag]");
    await expect(tag).toHaveCSS("opacity", "1");
    // Never over the page text: its box is clear of every word.
    const o = (await owl.boundingBox())!;
    const words = await page.locator("[data-slot=reader-text] [data-token-index]").evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }),
    );
    for (const w of words) {
      const overlap = w.left < o.x + o.width && w.right > o.x && w.top < o.y + o.height && w.bottom > o.y;
      expect(overlap, "the peeking owl covers no word").toBe(false);
    }
    // The tag fades after about 4 s...
    await expect(tag).toHaveCSS("opacity", "0", { timeout: 6000 });
    // ...is not brought back by a tap, and the owl steps aside while the sheet is open.
    await wordButton(page, "searched").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(owl).not.toHaveAttribute("data-shown", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(owl).toHaveAttribute("data-shown", "true");
    await expect(tag).toHaveCSS("opacity", "0");
  });

  test("the light sheet scrim keeps the page readable behind the word sheet", async ({ page }) => {
    test.skip(isDesktop(page), "the sheet is the mobile layout");
    await gotoAs(page, "/read/fox", { theme: "light" });
    await wordButton(page, "searched").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const alpha = await page.locator("[data-slot=drawer-overlay]").evaluate((el) => {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)!.map(Number);
      return m.length > 3 ? m[3] : 1;
    });
    expect(alpha).toBeGreaterThan(0.05);
    expect(alpha, "lighter than the 0.28 documented scrim").toBeLessThanOrEqual(0.2);
  });
});

test.describe("read-along", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Web Speech boundary events highlight the word being spoken, in order, and the first listen earns its sticker", async ({ page }) => {
    await mockSpeechBoundary(page, { wordMs: 160 });
    await gotoAs(page, "/read/fox");
    await page.getByRole("button", { name: isDesktop(page) ? "Basahin para sa akin" : "Basahin" }).click();
    // Sample the marker for a couple of seconds: "data-speaking" walks the words of the first sentence.
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      const w = await page.evaluate(() => document.querySelector("[data-slot=reader-text] [data-speaking=true]")?.textContent ?? null);
      if (w && seen[seen.length - 1] !== w) seen.push(w);
      await page.waitForTimeout(60);
    }
    expect(seen.slice(0, 5)).toEqual(["The", "small", "fox", "ran", "through"]);
    // Exactly one word at a time, and it is a plain marker: no tapped/saved state is borrowed.
    const states = await page.evaluate(() => Array.from(document.querySelectorAll("[data-speaking=true]")).map((e) => e.getAttribute("data-state")));
    expect(states.length).toBeLessThanOrEqual(1);
    expect(states.every((s) => s === null)).toBe(true);
    // The sentence is marked too, softly.
    await expect(page.locator("[data-reading=true]")).toHaveCount(1);
    // listening for the first time earns a sticker
    await expect(celebration(page)).toBeVisible({ timeout: 3000 });
    await expect(celebration(page)).toContainText("Una nga Pakinggan");
    expect(await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken[0])).toContain("The small fox ran");
  });

  test("without boundary events (native TTS) the sentence highlight alone follows along", async ({ page }) => {
    await mockSpeechBoundary(page, { wordMs: 120, boundaries: false });
    await gotoAs(page, "/read/fox");
    await page.getByRole("button", { name: isDesktop(page) ? "Basahin para sa akin" : "Basahin" }).click();
    await expect(page.locator("[data-reading=true]")).toHaveCount(1);
    await page.waitForTimeout(500);
    await expect(page.locator("[data-speaking=true]")).toHaveCount(0);
    await expect(page.locator("[data-reading=true]")).toContainText("The small fox ran");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the stamp simply appears settled, nothing flies, the tab is still told, nothing is left hidden", async ({ page }) => {
    await gotoAs(page, "/read/fox");
    await recordTabPops(page);
    await wordButton(page, "searched").click();
    await expect(panel(page).getByText("Filipino: searched")).toBeVisible();
    await panel(page).getByRole("button", { name: "I-save" }).click();
    const stamp = page.locator("[data-slot=save-stamp]");
    await expect(stamp).toBeVisible();
    const style = await stamp.evaluate((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }));
    expect(style.opacity).toBe("1");
    expect(style.transform).toBe("none");
    await page.waitForTimeout(900);
    await expect(page.locator("[data-fly-star]")).toHaveCount(0);
    await expect.poll(() => tabPops(page), { timeout: 3000 }).toContain("words");
    expect(await page.evaluate(() => (window as unknown as { gsap?: { globalTimeline: { getChildren: () => unknown[] } } }).gsap?.globalTimeline.getChildren().length ?? 0)).toBe(0);
    await settleCelebrations(page, 4000);
  });

  test("a scanned page is fully visible at once: no line waits on an unrun tween", async ({ page, context }) => {
    await stubApi(context, { ocr: (route) => route.fulfill({ json: { text: "The small fox ran home.\nIt was happy.\nThe sun was warm.\nWhat a day." } }) });
    await gotoAs(page, "/scan");
    await page.locator("input[type=file]").setInputFiles({ name: "p.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
    await expect(wordButton(page, "fox")).toBeVisible();
    const hidden = await page.locator("[data-slot=reader-text] [data-line]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length);
    expect(hidden).toBe(0);
  });
});

test.describe("quiz moments", () => {
  test.use({ reducedMotion: "no-preference" });

  const WORDS = ["brave", "forest", "quiet", "stone", "happy", "snow", "path", "food"].map((w, i) =>
    savedWordRow(w, `Filipino-${w} - puti nga ice halin sa langit kag mabaskog`, {}, i),
  );
  const owlMood = (page: Page) => page.locator("[data-owl-mood]").first().getAttribute("data-owl-mood");

  async function openQuiz(page: Page, context?: unknown) {
    void context;
    await gotoAs(page, "/");
    await expect(page.getByRole("heading", { name: /Maayong/ })).toBeVisible();
    await seedWords(page, WORDS);
    await page.goto("/quiz");
    await expect(page.getByRole("radiogroup")).toBeVisible();
  }
  /** Picks the right (or a wrong) answer for the word on screen. */
  async function answer(page: Page, right: boolean) {
    const word = (await page.locator("main h2").first().textContent())!.trim();
    const radios = page.getByRole("radiogroup").getByRole("radio");
    const n = await radios.count();
    for (let i = 0; i < n; i++) {
      const text = (await radios.nth(i).textContent()) ?? "";
      if (text.includes(`Filipino-${word} `) === right) {
        await radios.nth(i).click();
        return;
      }
    }
    throw new Error(`no ${right ? "right" : "wrong"} option for ${word}`);
  }
  const next = (page: Page) => page.getByRole("button", { name: /^(Susunod|Tingnan ang resulta)$/ });

  test("the first quiz ever greets the child once; the owl cheers on right and tilts on wrong", async ({ page }) => {
    await openQuiz(page);
    await expect(page.getByText("Pagsusulit na! 5 salita, kaya mo ini!")).toBeVisible();
    await expect.poll(async () => (await readPersisted(page, "handog-moments"))?.state.firstQuiz).toBe(true);
    await answer(page, false);
    await expect.poll(() => owlMood(page)).toBe("think");
    await expect(page.getByTestId("quiz-feedback")).toContainText("Hindi pa tama");
    // never a buzzer / red wall
    await expect(page.locator("[data-answer=wrong]")).toHaveCount(1);
    expect(await page.locator("[data-answer=wrong]").evaluate((el) => getComputedStyle(el).borderColor)).not.toBe("rgb(200, 50, 58)");
    await next(page).click();
    await answer(page, true);
    await expect.poll(() => owlMood(page)).toBe("cheer");
    await expect(page.getByTestId("quiz-feedback")).toContainText("Tama!");
  });

  test("three right in a row: the owl hops once with a cheer line", async ({ page }) => {
    await openQuiz(page);
    for (let i = 0; i < 3; i++) {
      await answer(page, true);
      if (i < 2) {
        await expect(page.getByText("Tatlong sunod na tama! Ang galing!")).toHaveCount(0);
        await next(page).click();
      }
    }
    await expect(page.getByText("Tatlong sunod na tama! Ang galing!").first()).toBeVisible();
    await next(page).click();
    await answer(page, true);
    await expect(page.getByText("Tatlong sunod na tama! Ang galing!")).toHaveCount(0); // only once
  });

  test("answering moves focus to Susunod, and the feedback + Susunod sit in a bar that never falls behind the nav (even offline with long options)", async ({ page, context }) => {
    await context.unroute("**/api/health");
    await context.route("**/api/health", (route) => route.abort("internetdisconnected"));
    await openQuiz(page);
    await expect(page.locator("[data-slot=offline-banner]")).toContainText(/Wala sang internet/);
    await answer(page, false);
    const nextBtn = next(page);
    await expect(nextBtn).toBeFocused();
    await expect(page.getByTestId("quiz-feedback")).toContainText("Ang husto:");
    await expectInViewport(page, await nextBtn.boundingBox(), "Susunod");
    await expectInViewport(page, await page.getByTestId("quiz-feedback").boundingBox(), "feedback");
    const nav = page.locator("[data-slot=bottom-nav]");
    if (await nav.isVisible()) {
      const n = (await nav.boundingBox())!;
      const s = (await nextBtn.boundingBox())!;
      expect(s.y + s.height, "Susunod ends above the nav").toBeLessThanOrEqual(n.y);
      const f = (await page.getByTestId("quiz-feedback").boundingBox())!;
      expect(f.y + f.height, "feedback ends above the nav").toBeLessThanOrEqual(n.y);
    }
    // the page never scrolls sideways
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("results: stars fill from the left, what they got right comes first, missed words are retry cards with Listen, quiz-finished once", async ({ page }) => {
    await openQuiz(page);
    for (let i = 0; i < 5; i++) {
      await answer(page, i < 2); // 2 right, 3 wrong
      await next(page).click();
    }
    await expect(page.getByTestId("quiz-score")).toContainText("2 sa 5");
    const stamps = await page.locator("[data-testid=quiz-stamps] [data-stamp]").evaluateAll((els) => els.map((e) => e.getAttribute("data-stamp")));
    expect(stamps).toEqual(["earned", "earned", "missed", "missed", "missed"]);
    const right = page.getByTestId("quiz-right");
    const retry = page.getByTestId("quiz-retry");
    await expect(right).toBeVisible();
    await expect(retry.getByRole("heading", { name: "Ulitin natin ito" })).toBeVisible();
    expect(((await right.boundingBox())!.y)).toBeLessThan((await retry.boundingBox())!.y);
    const cards = page.getByTestId("quiz-retry-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.first().getByRole("button", { name: /^Pakinggan/ })).toBeVisible();
    // no stacked red crosses on the screen
    await expect(page.locator("main .bg-destructive")).toHaveCount(0);
    // quiz-finished once: the sticker dialog arrives after the stamps
    await expect(celebration(page)).toBeVisible({ timeout: 4000 });
    await expect(celebration(page)).toContainText("Una nga Pagsusulit");
    await settleCelebrations(page, 500);
    const flags = (await readPersisted(page, "handog-rewards"))!.state.flags as { quizzed: boolean };
    expect(flags.quizzed).toBe(true);
    expect(await owlMood(page)).toBe("think");
  });

  test("4 of 5: the results owl cheers", async ({ page }) => {
    await openQuiz(page);
    for (let i = 0; i < 5; i++) {
      await answer(page, i !== 4);
      await next(page).click();
    }
    await expect(page.getByTestId("quiz-score")).toContainText("4 sa 5");
    expect(await owlMood(page)).toBe("cheer");
  });
});
