import { expect, test } from "@playwright/test";
import { gotoAs, isDesktop, stubApi, waitForDictionary, wordButton, wordExplanation } from "./helpers";

// Each test here pins a bug found by the e2e pass and fixed in the app ("Fix: ..." commits).

test("reader drawer takes focus and traps Tab (mobile)", async ({ page, context }, info) => {
  test.skip(info.project.name !== "mobile", "the drawer only exists below lg");
  await stubApi(context);
  await gotoAs(page, "/read/fox");
  await wordButton(page, "searched").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // vaul ships with autoFocus off: without opting in, focus stayed on the (now inert) word behind the scrim.
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]")), `tab #${i + 1} stays in the drawer`).toBe(true);
  }
});

test("upgrading an offline entry keeps the word panel the same size (no layout shift)", async ({ page, context }) => {
  await stubApi(context, { explain: (b, route) => route.fulfill({ json: wordExplanation(b.word, { translation: "Nagpangita." }) }) });
  await gotoAs(page, "/read/fox");
  await waitForDictionary(page);
  await context.setOffline(true);
  await wordButton(page, "searched").click();
  const panel = page.locator("[data-slot=word-panel]");
  await expect(panel).toHaveAttribute("data-source", "offline");
  const size = async () => {
    // wait for the drawer slide-in to finish
    let last = "";
    for (let i = 0; i < 30; i++) {
      const b = JSON.stringify(await panel.boundingBox());
      if (b === last) return JSON.parse(b);
      last = b;
      await page.waitForTimeout(150);
    }
    throw new Error("panel never settled");
  };
  const before = await size();
  await context.setOffline(false);
  await expect(panel).toHaveAttribute("data-source", "ai", { timeout: 15_000 });
  const after = await size();
  // The provisional translation wraps to two lines at both viewport sizes; the reserved block must hold them.
  expect(after.height, isDesktop(page) ? "desktop" : "mobile").toBeCloseTo(before.height, 0);
  if (!isDesktop(page)) expect(after.y).toBeCloseTo(before.y, 0); // desktop: the in-flow offline banner collapsing shifts the column
});

test("keyboard focus shows a visible ring on buttons, links, inputs and word tokens", async ({ page, context }) => {
  await stubApi(context);
  // Tailwind v4: `outline-none` sets --tw-outline-style:none, which silently turned `focus-visible:outline-3` into
  // "3px of no outline" everywhere. Every stop below must have a real outline.
  const routes: [string, RegExp[]][] = [
    ["/", [/Padayon sa pagbasa|Umpisahan ta/, /I-scan ang pahina/]],
    ["/books", [/The Brave Little Fox/]],
    ["/settings", [/^Medium$/, /Dyslexia-friendly font|^$/]],
    ["/read/fox", [/^The$/, /^small$/]],
  ];
  for (const [route, targets] of routes) {
    await gotoAs(page, route);
    await page.waitForTimeout(300);
    const missing = new Set(targets.map(String));
    for (let i = 0; i < 80 && missing.size; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return {
          name: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " "),
          ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 && cs.outlineColor !== "rgba(0, 0, 0, 0)",
          tag: el.tagName,
        };
      });
      if (info.tag === "BODY") continue;
      for (const re of targets) {
        if (re.test(info.name)) {
          expect(info.ring, `${route}: focus ring on "${info.name}"`).toBe(true);
          missing.delete(String(re));
        }
      }
    }
    expect([...missing], `${route}: tab never reached`).toEqual([]);
  }
});
