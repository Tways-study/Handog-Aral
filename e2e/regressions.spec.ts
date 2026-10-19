import { expect, test } from "@playwright/test";
import { gotoAs, stubApi, wordButton } from "./helpers";

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
