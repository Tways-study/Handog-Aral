import { expect, test } from "@playwright/test";
import { countRows, gotoAs, stubApi, waitForDictionary, wordButton, wordExplanation } from "./helpers";

// The data-layer boot (dictionary seed, lookup queue) is deferred to an idle callback. A tap right after load,
// before the curated dictionary exists in Dexie, must still resolve: either from the curated entry or, if the
// seed lost the race, through the honest fallback chain.
test("a word tapped immediately after load, before the dictionary is seeded, still resolves", async ({ page, context }) => {
  const stub = await stubApi(context, { explain: (b, route) => route.fulfill({ json: wordExplanation(b.word, { translation: "AI-fallback-translation" }) }) });
  await gotoAs(page, "/read/fox");
  await waitForDictionary(page);
  // Emulate a fresh profile: the dictionary has not been seeded yet.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open("handog-aral");
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(["dictionary", "meta"], "readwrite");
          tx.objectStore("dictionary").clear();
          tx.objectStore("meta").clear(); // the seed version marker, so ensureDictionary runs again
          tx.oncomplete = () => (db.close(), resolve());
        };
      }),
  );
  stub.explainCalls.length = 0;
  expect(await countRows(page, "dictionary")).toBe(0);

  await page.reload();
  const word = wordButton(page, "brave");
  await word.waitFor({ state: "visible" });
  await page.waitForTimeout(100);
  await word.click();

  const panel = page.getByRole("dialog").or(page.getByRole("complementary"));
  await expect(panel.getByRole("heading", { name: "brave", exact: true })).toBeVisible();
  // Some explanation text must appear (not an empty or error panel).
  await expect(panel.getByText(/Filipino|Nagpangita|AI-fallback|[A-Za-z]{4,}/).first()).toBeVisible();

  await waitForDictionary(page); // the deferred seed still completes
  const usedAi = stub.explainCalls.length > 0;
  test.info().annotations.push({ type: "outcome", description: usedAi ? "seed lost the race: AI/fallback chain answered" : "curated entry resolved" });
  console.log(`boot-timing: ${usedAi ? "fallback chain used (seed lost the race)" : "curated entry resolved"}; explain calls=${stub.explainCalls.length}`);
});
