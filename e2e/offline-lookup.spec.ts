import { expect, test, type Page } from "@playwright/test";
import { countRows, gotoAs, isDesktop, stubApi, waitForDictionary, wordButton, wordExplanation } from "./helpers";

const UPGRADED = wordExplanation("searched", {
  translation: "Nagpangita - AI nga paathag",
  english: "Looked carefully for something.",
  example: "She searched the whole room.",
});

function panelRoot(page: Page) {
  return isDesktop(page) ? page.getByRole("complementary") : page.getByRole("dialog");
}
const panel = (page: Page) => panelRoot(page).locator("[data-slot=word-panel]");

async function closeDrawer(page: Page) {
  if (isDesktop(page)) return;
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** Resolves once the element has the same box for ~300ms (the drawer is done sliding in). */
async function settledBox(page: Page, selector = "[data-slot=word-panel]") {
  let prev = "";
  let stableFor = 0;
  for (let i = 0; i < 40; i++) {
    const raw = await page.locator(selector).first().boundingBox();
    const container = await panelRoot(page).boundingBox();
    const box = raw && container ? { ...raw, containerY: isDesktop(page) ? container.y : 0 } : null;
    const key = JSON.stringify(box);
    stableFor = key === prev ? stableFor + 1 : 0;
    prev = key;
    if (stableFor >= 4 && box) return box;
    await page.waitForTimeout(100);
  }
  throw new Error("panel never settled");
}

test("offline lookup is honest and provisional; coming back online upgrades it in place with a toast", async ({ context, page }) => {
  // Online: the proxy is stubbed to succeed, but it must NOT be called while offline.
  const stub = await stubApi(context, { explain: (b, route) => route.fulfill({ json: b.word === "searched" ? UPGRADED : wordExplanation(b.word) }) });
  await gotoAs(page, "/read/fox");
  await expect(wordButton(page, "searched")).toBeVisible();
  await waitForDictionary(page); // curated words resolve from Dexie, no network
  await expect(page.locator("[data-slot=offline-banner]").getByText(/Wala sang internet/)).toHaveCount(0);

  await context.setOffline(true);
  await expect(page.locator("[data-slot=offline-banner]").getByText(/Wala sang internet/)).toBeVisible();

  // 1. Curated word while offline: the full curated explanation, not the provisional one.
  await wordButton(page, "brave").click();
  const curated = panel(page);
  await expect(curated).toHaveAttribute("data-source", "curated");
  await expect(curated.getByText("Maisog gid, pareho sang soldado!")).toBeVisible();
  await expect(curated.getByText("Mula sa diksyunaryo ng app")).toBeVisible();
  await expect(curated.getByText(/Simple lang ini nga kahulugan/)).toHaveCount(0);
  await expect(page.locator("[data-slot=offline-banner]")).toBeVisible();
  await closeDrawer(page);

  // 2. Uncached, non-curated word while offline: honest provisional explanation.
  await wordButton(page, "searched").click();
  const offline = panel(page);
  await expect(offline).toHaveAttribute("data-source", "offline");
  await expect(offline.getByText("Wala pa sang paathag. Ipakita namon kon may internet na.")).toBeVisible();
  await expect(offline.getByText(/Simple lang ini nga kahulugan karon\. Mas klaro na ini kon may internet\./)).toBeVisible();
  await expect(page.locator("[data-slot=offline-banner]")).toBeVisible();
  expect(stub.explainCalls, "no proxy call while offline").toHaveLength(0);
  await expect.poll(() => countRows(page, "lookupQueue")).toBe(1);

  const before = await settledBox(page);

  // 3. Back online: the queue upgrades the word, a toast tells the child, the open panel updates in place.
  await context.setOffline(false);
  await expect(page.getByText("Mas klaro na ang 1 salita.")).toBeVisible({ timeout: 15_000 });
  await expect(panel(page)).toHaveAttribute("data-source", "ai");
  await expect(panel(page).getByText(UPGRADED.translation)).toBeVisible();
  await expect(panel(page).getByText(/Ipinaliwanag ng AI/)).toBeVisible();
  await expect(panel(page).getByText(/Simple lang ini nga kahulugan/)).toHaveCount(0);
  await expect(page.locator("[data-slot=offline-banner]").getByText(/Wala sang internet/)).toHaveCount(0);
  expect(stub.explainCalls.map((c) => c.word)).toEqual(["searched"]);
  await expect.poll(() => countRows(page, "lookupQueue")).toBe(0);

  const after = await settledBox(page);
  expect(after.x).toBeCloseTo(before.x, 0);
  // y relative to the panel's own container: the in-flow OfflineBanner collapsing moves the whole column (see report).
  expect(after.y - after.containerY).toBeCloseTo(before.y - before.containerY, 0);
  expect(after.width).toBeCloseTo(before.width, 0);
  expect(after.height, "panel height must not change when the entry is upgraded").toBeCloseTo(before.height, 0);

  // The upgraded explanation is now cached: a later lookup is instant and offline-safe.
  await closeDrawer(page);
  await context.setOffline(true);
  await wordButton(page, "brave").click();
  await closeDrawer(page);
  await wordButton(page, "searched").click();
  await expect(panel(page)).toHaveAttribute("data-source", "ai");
  await expect(panel(page).getByText(UPGRADED.translation)).toBeVisible();
});

test("Tagalog child gets the toast in Filipino", async ({ context, page }) => {
  await stubApi(context, { explain: (b, route) => route.fulfill({ json: wordExplanation(b.word, { translation: "Naghanap - paliwanag ng AI" }) }) });
  await gotoAs(page, "/read/fox", { language: "tagalog" });
  await expect(wordButton(page, "searched")).toBeVisible();
  await context.setOffline(true);
  await wordButton(page, "searched").click();
  await expect(panel(page)).toHaveAttribute("data-source", "offline");
  await expect(panel(page).getByText("Wala pang paliwanag. Ipapakita namin kapag may internet na.")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Mas malinaw na ang 1 salita.")).toBeVisible({ timeout: 15_000 });
  await expect(panel(page).getByText("Naghanap - paliwanag ng AI")).toBeVisible();
});
