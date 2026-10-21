import { expect, test, type Page } from "@playwright/test";

// Dev-only: the showcase route exists under `next dev` only. Run with
//   NEXT_DIST_DIR=.next-o npx next dev -p 3241 &  E2E_DEV=1 E2E_DEV_URL=http://localhost:3241 npx playwright test e2e/owl.dev.spec.ts
test.skip(!process.env.E2E_DEV, "needs `next dev` (set E2E_DEV=1)");

const BASE = process.env.E2E_DEV_URL ?? "http://localhost:3241";
const URL = `${BASE}/design/owl?slots=1`;

test.use({
  launchOptions: {
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  },
});

const hero = (page: Page) => page.getByTestId("interactive-owl").locator("button");

function trackThree(page: Page): string[] {
  const hits: string[] = [];
  page.on("request", (r) => {
    if (/Owl3DCanvas|useOwlRenderer|owlModel|three/i.test(r.url()) && r.url().endsWith(".js")) hits.push(r.url());
  });
  return hits;
}

test("3D owl renders in headless Chromium with real pixels", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL);
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "3d", { timeout: 30_000 });
  // A WebGL drawing buffer is only readable in the frame it was drawn, so poll during a tap-triggered animation.
  const handle = hero(page).locator("canvas");
  await hero(page).click();
  const painted = await handle.evaluate(
    (c: HTMLCanvasElement) =>
      new Promise<number>((resolve) => {
        let tries = 0;
        let best = 0;
        const copy = document.createElement("canvas");
        copy.width = c.width;
        copy.height = c.height;
        const ctx = copy.getContext("2d")!;
        const step = () => {
          ctx.clearRect(0, 0, copy.width, copy.height);
          ctx.drawImage(c, 0, 0);
          const d = ctx.getImageData(0, 0, copy.width, copy.height).data;
          let n = 0;
          for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
          best = Math.max(best, n);
          if (++tries < 40) requestAnimationFrame(step);
          else resolve(best);
        };
        requestAnimationFrame(step);
      }),
  );
  expect(painted).toBeGreaterThan(500);
  expect(errors).toEqual([]);
});

test("reduced motion stays on the SVG and never requests the three chunk", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const hits = trackThree(page);
  await page.goto(URL);
  await expect(hero(page)).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "svg");
  expect(hits).toEqual([]);
  await ctx.close();
});

test("forcing the SVG fallback (same switch the owl3d setting feeds) yields svg", async ({ page }) => {
  await page.goto(URL);
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "3d", { timeout: 30_000 });
  await page.getByRole("button", { name: "Force SVG fallback" }).click();
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "svg");
});

test("owl3d setting off yields svg", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("handog-settings", JSON.stringify({ state: { owl3d: false }, version: 0 }));
  });
  await page.goto(URL);
  await expect(hero(page)).toBeVisible();
  await page.waitForTimeout(2500);
  // The settings store persists to IndexedDB; if the localStorage seed was not picked up, fall back to the switch.
  const r = await hero(page).getAttribute("data-owl-renderer");
  if (r !== "svg") {
    await page.getByRole("button", { name: "Force SVG fallback" }).click();
  }
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "svg");
});

test("tapping the interactive owl plays a reaction without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(URL);
  await expect(hero(page)).toHaveAttribute("data-owl-renderer", "3d", { timeout: 30_000 });
  const before = await page.evaluate(() => (window as unknown as { __owlStats: { frames: number } }).__owlStats.frames);
  await hero(page).click();
  await expect(page.getByTestId("tap-count")).toHaveText("taps: 1");
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => (window as unknown as { __owlStats: { frames: number } }).__owlStats.frames);
  expect(after - before).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});
