import { expect, test, type Page } from "@playwright/test";
import { gotoAs, readPersisted, stubApi } from "./helpers";

/** Writes the persisted rewards store (and its boot mirror) the way the app does. */
async function seedRewards(page: Page, state: Record<string, unknown>) {
  const payload = JSON.stringify({ state, version: 1 });
  await page.evaluate(
    ([json]) => {
      localStorage.setItem("handog-mirror:handog-rewards", json);
      return new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("keyval-store");
        open.onupgradeneeded = () => open.result.createObjectStore("keyval");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("keyval", "readwrite");
          tx.objectStore("keyval").put(json, "handog-rewards");
          tx.oncomplete = () => (db.close(), resolve());
        };
      });
    },
    [payload],
  );
}

const flags = { scanned: false, listened: false, quizzed: false, openedBooks: [], matchWins: 0 };
const earned = { "first-word": Date.now() - 86_400_000, "five-words": Date.now() - 3_600_000 };

async function open(page: Page, state: Record<string, unknown> | null, settings = {}, heading = "Aklat ng Sticker") {
  await gotoAs(page, "/offline", settings);
  if (state) await seedRewards(page, state);
  await page.goto("/stickers");
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  await stubApi(context);
});

test("nothing earned yet: an invitation, and every sticker is a locked outline with its hint as text", async ({ page }) => {
  await open(page, null, { childName: "Ana" });
  await expect(page.getByTestId("sticker-count")).toHaveText("0 sa 14");
  await expect(page.getByTestId("stickers-empty")).toBeVisible();
  await expect(page.locator("li[data-sticker][data-state=locked]")).toHaveCount(14);
  await expect(page.getByText("I-save ang imo una nga pulong.")).toBeVisible();
  await expect(page.getByText("Mga sticker ni Ana")).toBeVisible();
});

test("earned stickers are in colour with a date; locked ones keep a hint; NEW clears after a real visit", async ({ page }) => {
  await open(page, { earned, seen: [], flags, bonusStars: 0 });
  await expect(page.getByTestId("sticker-count")).toHaveText("2 sa 14");
  await expect(page.getByTestId("stickers-empty")).toHaveCount(0);
  await expect(page.locator("li[data-sticker][data-state=earned]")).toHaveCount(2);
  await expect(page.locator("li[data-sticker][data-state=locked]")).toHaveCount(12);
  const first = page.locator("li[data-sticker=first-word]");
  await expect(first).toContainText("Una nga Pulong");
  await expect(first).toContainText("Nakuha sang");
  await expect(page.locator("li[data-sticker=hard-word]")).toContainText("Hindi pa nakukuha");
  await expect(page.getByTestId("new-marker")).toHaveCount(2);

  // A flash visit keeps the markers; a real visit clears them once she leaves.
  await page.waitForTimeout(2200);
  await page.getByRole("link", { name: /^Tahanan$/ }).first().click(); // client-side navigation: the page unmounts
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page.getByTestId("sticker-count")).toHaveText("2 sa 14");
  await expect(page.getByTestId("new-marker")).toHaveCount(0);
  expect((await readPersisted(page, "handog-rewards"))?.state.seen).toEqual(expect.arrayContaining(["first-word", "five-words"]));
});

test("tapping an earned sticker makes no confetti under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { earned, seen: ["first-word", "five-words"], flags, bonusStars: 0 });
  await page.locator("li[data-sticker=first-word] button").click();
  await expect(page.locator("[data-confetti], [data-confetti-piece]")).toHaveCount(0);
});

test("owl wardrobe: outfits unlock with their sticker, a locked one cannot be worn, the choice persists", async ({ page }) => {
  await open(page, { earned, seen: ["first-word", "five-words"], flags, bonusStars: 0 });
  await page.getByRole("tab", { name: "Kuwago" }).click();
  const group = page.getByRole("radiogroup", { name: "Isusuot ng kuwago" });
  await expect(group.getByRole("radio", { name: /Antipara/ })).not.toHaveAttribute("aria-disabled", "true");
  await expect(group.getByRole("radio", { name: /Kalo/ })).toHaveAttribute("aria-disabled", "true");
  await expect(group.getByRole("radio", { name: /Laso/ })).toHaveAttribute("aria-disabled", "true");
  await expect(group.getByRole("radio", { name: /Kalo/ })).toContainText("Makuha sa sticker: Una nga Libro");

  await group.getByRole("radio", { name: /Kalo/ }).click({ force: true });
  await expect(page.getByTestId("wearing")).toHaveText("Ginasul-ob: Wala");

  await group.getByRole("radio", { name: /Antipara/ }).click();
  await expect(page.getByTestId("wearing")).toHaveText("Ginasul-ob: Antipara");
  await expect.poll(async () => (await readPersisted(page, "handog-settings"))?.state.owlOutfit).toBe("glasses");

  await page.reload();
  await page.getByRole("tab", { name: "Kuwago" }).click();
  await expect(page.getByTestId("wearing")).toHaveText("Ginasul-ob: Antipara");
});

test("Tagalog sticker book", async ({ page }) => {
  await open(page, { earned, seen: [], flags, bonusStars: 0 }, { language: "tagalog" }, "Aklat ng Sticker");
  await expect(page.locator("li[data-sticker=first-word]")).toContainText("Unang Salita");
});

test("locked stickers show their own washed art with a lock chip; earned come first, then the nearest", async ({ page }) => {
  await open(page, { earned, seen: [], flags, bonusStars: 0 });
  const ids = await page.locator("li[data-sticker]").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-state")}:${e.getAttribute("data-sticker")}`));
  expect(ids.slice(0, 2).every((x) => x.startsWith("earned:"))).toBe(true);
  expect(ids.slice(2).every((x) => x.startsWith("locked:"))).toBe(true);
  const locked = page.locator("li[data-sticker=hard-word] svg");
  await expect(locked.locator("[data-washed=true]")).toHaveCount(1);
  await expect(page.locator("li[data-sticker=hard-word]")).toContainText("Hindi pa nakukuha");
});
