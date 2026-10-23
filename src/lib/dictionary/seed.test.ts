import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb, getFilipinoEntry } from "@/stores/db";
import { ensureDictionary, filipinoEntries } from "./seed";

beforeEach(async () => {
  const db = getDb()!;
  await Promise.all([db.dictionary.clear(), db.filipino.clear(), db.meta.clear()]);
});

describe("ensureDictionary", () => {
  it("loads the Filipino -> English entries beside the English ones", async () => {
    await ensureDictionary();
    const db = getDb()!;
    expect(await db.filipino.count()).toBe(filipinoEntries().length);
    expect((await getFilipinoEntry("Bata"))?.word).toBe("bata");
    expect((await db.dictionary.get("brave"))?.tagalog).toBeTruthy();
    expect(JSON.stringify(await db.dictionary.toArray())).not.toMatch(/hiligaynon/i);
  });
});
