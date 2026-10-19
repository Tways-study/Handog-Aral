import { expect, test, type Page } from "@playwright/test";
import { gotoAs } from "./helpers";

// This file needs the real service worker, so it opts back in (the default config blocks it so page.route works).
test.use({ serviceWorkers: "allow" });

async function swReady(page: Page) {
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active && reg.active.state === "activated";
  });
  // clientsClaim: the page becomes controlled without a reload.
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 15_000 });
}

/** The precache is filled during install; wait until it is non-trivially populated. */
async function precacheWarm(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          let n = 0;
          for (const name of await caches.keys()) n += (await (await caches.open(name)).keys()).length;
          return n;
        }),
      { timeout: 30_000 },
    )
    .toBeGreaterThan(20);
}

test("manifest.webmanifest is served with installable icons", async ({ request, page }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/json/);
  const m = await res.json();
  expect(m).toMatchObject({ name: "Handog Aral", short_name: "Handog Aral", start_url: "/", display: "standalone", scope: "/" });
  expect(m.theme_color).toMatch(/^#/);
  expect(m.background_color).toMatch(/^#/);
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  for (const icon of m.icons as { src: string; type: string; sizes: string }[]) {
    const r = await request.get(icon.src);
    expect(r.status(), icon.src).toBe(200);
    expect(r.headers()["content-type"], icon.src).toContain(icon.type);
    const buf = await r.body();
    // PNG width/height live at bytes 16..23 of the IHDR chunk.
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    expect(`${w}x${h}`, `${icon.src} real size`).toBe(icon.sizes);
  }
  // The document links the manifest.
  await page.goto("/offline");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);
});

test("/offline renders its own page", async ({ page }) => {
  const res = await page.goto("/offline");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Wala ka sang internet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Probahi liwat" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pauli sa Balay" })).toBeVisible();
});

test("the service worker registers and the app shell loads offline after the first visit", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await gotoAs(page, "/", { childName: "Ana" });
  await expect(page.getByRole("heading", { name: /Maayong .*Ana/ })).toBeVisible();
  await swReady(page);
  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return { scope: reg.scope, script: reg.active?.scriptURL };
  });
  expect(sw.scope).toMatch(/\/$/);
  expect(sw.script).toContain("/serwist/sw.js");

  // Visit the other main screens once so their documents are cached.
  await precacheWarm(page);
  for (const route of ["/books", "/words"]) {
    await page.goto(route);
    await expect(page.getByRole("heading").first()).toBeVisible();
  }
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Maayong .*Ana/ })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Maayong .*Ana/ })).toBeVisible();
  await expect(page.locator("[data-slot=offline-banner]").getByText(/Wala sang internet/)).toBeVisible();
  // Settings come from IndexedDB, so the child still sees their name and the nav.
  await expect(page.getByRole("link", { name: "Libro" }).first()).toBeVisible();

  // Visited routes load offline, including a hard navigation.
  await page.goto("/books");
  await expect(page.getByRole("heading", { name: "Mga Libro" })).toBeVisible();

  // A never-visited route falls back to the offline page or the cached shell; it must not be Chrome's dinosaur.
  const res = await page.goto("/settings").catch((e) => e as Error);
  expect(res instanceof Error ? res.message : "ok", "navigation to an unvisited page while offline").not.toMatch(/ERR_INTERNET_DISCONNECTED/);
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.getByRole("heading").first()).toBeVisible();

  expect(errors, "no uncaught errors with the service worker active").toEqual([]);
});

test("a book opens offline from a warm cache and word lookups still resolve", async ({ page, context }) => {
  await gotoAs(page, "/read/fox");
  await expect(page.locator("[data-slot=reader-text]")).toBeVisible();
  await swReady(page);
  await precacheWarm(page);
  await page.reload(); // the document is now served (and cached) through the worker
  await expect(page.locator("[data-slot=reader-text]")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("[data-slot=reader-text]")).toBeVisible();
  await page.locator("[data-slot=reader-text]").getByRole("button", { name: "brave", exact: true }).click();
  await expect(page.locator("[data-slot=word-panel]")).toBeVisible();
});
