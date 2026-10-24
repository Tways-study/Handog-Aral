import { expect, test } from "@playwright/test";
import { gotoAs, stubApi, wordButton } from "./helpers";

async function typeInto(page: import("@playwright/test").Page, text: string) {
  await page.goto("/scan");
  await page.getByRole("button", { name: /^I-type o i-paste/ }).click();
  await page.locator("#reader-draft").fill(text);
  await page.getByRole("button", { name: "Ipakita ang teksto" }).click();
}

test("a whole book pasted in is cut to one page at a sentence end, with a note", async ({ page, context }) => {
  await stubApi(context);
  await gotoAs(page, "/scan");
  await typeInto(page, "The fox ran home. ".repeat(1200));
  await expect(page.getByRole("note")).toContainText("unang bahagi");
  const buttons = await page.locator("[data-slot=reader-text] button").count();
  expect(buttons).toBeGreaterThan(100);
  expect(buttons).toBeLessThan(1500);
});

test("a page with no punctuation still gets an AI explanation: the context sent is a short window", async ({ page, context }) => {
  const stub = await stubApi(context);
  await gotoAs(page, "/scan");
  const words = Array.from({ length: 300 }, (_, i) => (i === 150 ? "searched" : `item${"abcdefg"[i % 7]}`)).join(" ");
  await typeInto(page, words);
  await wordButton(page, "searched").click();
  await expect.poll(() => stub.explainCalls.length).toBeGreaterThan(0);
  const call = stub.explainCalls.at(-1)!;
  expect(call.word).toBe("searched");
  expect(call.sentence.length).toBeLessThanOrEqual(400);
  expect(call.sentence).toContain("searched");
});

test("OCR debris (a 90-letter run) can be tapped without any request or crash", async ({ page, context }) => {
  const stub = await stubApi(context);
  await gotoAs(page, "/scan");
  await typeInto(page, `Look ${"q".repeat(90)} here.`);
  await page.locator("[data-slot=reader-text] button", { hasText: "qqqq" }).first().click();
  await expect(page.locator("[data-slot=word-panel]")).toBeVisible();
  expect(stub.explainCalls.filter((c) => c.word.startsWith("qqqq"))).toHaveLength(0);
});

test("a very long saved child name never breaks the greeting at 320px", async ({ page, context }) => {
  await stubApi(context);
  await page.setViewportSize({ width: 320, height: 640 });
  await gotoAs(page, "/", { childName: "Maria Clara de los Santos y Magsaysay 🦉🦉🦉🦉" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
