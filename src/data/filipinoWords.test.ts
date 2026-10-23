import { describe, expect, it } from "vitest";
import { filipinoBooks } from "./filipinoBooks";
import filipinoWords from "./filipinoWords";

describe("curated Filipino words", () => {
  it("keys match the lowercase word", () => {
    for (const [k, w] of Object.entries(filipinoWords)) expect(k).toBe(w.word.toLowerCase());
  });

  it("covers every word of the Filipino stories except names", () => {
    const names = new Set(["ben", "lina", "ana", "maria", "pedro"]);
    const missing = new Set<string>();
    for (const b of filipinoBooks)
      for (const w of b.text.toLowerCase().match(/[\p{L}'-]+/gu) ?? []) if (!filipinoWords[w] && !names.has(w)) missing.add(w);
    expect([...missing]).toEqual([]);
  });
});
