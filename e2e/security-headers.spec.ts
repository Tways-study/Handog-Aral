import { expect, test } from "@playwright/test";
import { gotoAs, stubApi } from "./helpers";

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("security headers are sent on pages, and the worker is served revalidated", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["permissions-policy"]).toBe("camera=(self), microphone=(), geolocation=(), payment=(), interest-cohort=()");
  expect(h["content-security-policy"]).toBe("frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'");
  expect(h["x-powered-by"]).toBeUndefined();

  const sw = await request.get("/serwist/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect(sw.headers()["service-worker-allowed"]).toBe("/");
});

test("the app still boots under the headers: shell renders, fonts load, no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await gotoAs(page, "/books");
  await expect(page.locator("main")).toBeVisible();
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect(fonts.join(" ")).toMatch(/Baloo|Atkinson/i);
  expect(errors.filter((e) => /Content Security Policy|Refused to/i.test(e))).toEqual([]);
});

test.describe("service worker under the headers", () => {
  test.use({ serviceWorkers: "allow" });
  test("registers and activates", async ({ page }) => {
    await gotoAs(page, "/books");
    await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === "activated", undefined, { timeout: 15_000 });
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/$/);
  });
});

test("manifest is complete: id, shortcuts and screenshots that exist", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.id).toBe("/");
  expect(m.shortcuts.map((s: { url: string }) => s.url)).toEqual(["/scan", "/words", "/quiz"]);
  const forms = m.screenshots.map((s: { form_factor: string }) => s.form_factor).sort();
  expect(forms).toEqual(["narrow", "wide"]);
  for (const s of m.screenshots as { src: string; sizes: string }[]) {
    const r = await request.get(s.src);
    expect(r.status(), s.src).toBe(200);
    const buf = await r.body();
    expect(`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`, s.src).toBe(s.sizes);
  }
});

test("social card and robots are served", async ({ request, page }) => {
  await page.goto("/offline");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image\.png/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const img = await request.get("/opengraph-image.png");
  expect(img.status()).toBe(200);
  const buf = await img.body();
  expect(`${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`).toBe("1200x630");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toMatch(/User-Agent: \*\s+Allow: \//i);
});
