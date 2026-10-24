// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_CONTEXT_CHARS, MAX_PAGE_CHARS, clampPage, findSentence, tokenize } from "./tokenize";

const words = (t: string) => tokenize(t).filter((x) => x.kind === "word").map((x) => x.value);

describe("tokenize", () => {
  it("keeps internal straight and curly apostrophes", () => {
    expect(words("Don't stop, it’s fun")).toEqual(["Don't", "stop", "it’s", "fun"]);
  });
  it("splits quotes and punctuation off words", () => {
    const t = tokenize("“Hello,” she said.");
    expect(t.map((x) => x.kind)).toEqual(["punct", "word", "punct", "space", "word", "space", "word", "punct"]);
    expect(t.map((x) => x.value).join("")).toBe("“Hello,” she said.");
  });
  it("handles accented letters", () => {
    expect(words("café niño naïve")).toEqual(["café", "niño", "naïve"]);
  });
  it("keeps internal hyphens but not trailing ones", () => {
    expect(words("well-known mother-in-law -dash-")).toEqual(["well-known", "mother-in-law", "dash"]);
  });
  it("assigns sequential indexes", () => {
    expect(tokenize("a b").map((t) => t.index)).toEqual([0, 1, 2]);
  });
});

describe("findSentence", () => {
  it("returns the sentence containing the token", () => {
    const t = tokenize("The fox ran. It was cold! Was it?");
    const idx = t.findIndex((x) => x.value === "cold");
    expect(findSentence(t, idx)).toBe("It was cold!");
    expect(findSentence(t, t.findIndex((x) => x.value === "fox"))).toBe("The fox ran.");
  });
});

describe("hardening", () => {
  it("keeps a decomposed accent inside its word (n + combining tilde = one niño)", () => {
    expect(words("ni\u006e\u0303o")).toEqual(["niño"]);
    expect(words("Pa\u006e\u0303ga")).toEqual(["Pañga"]);
  });

  it("sends a window, never a whole unpunctuated page, as context (the proxy refuses over 600)", () => {
    const text = Array.from({ length: 400 }, (_, i) => `word${"x".repeat(i % 7)}`).join(" ");
    const t = tokenize(text);
    const idx = t.findIndex((x) => x.value === "wordxxxx" && x.index > 300);
    const ctx = findSentence(t, idx);
    expect(ctx.length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS);
    expect(ctx).toContain("wordxxxx");
    expect(ctx.startsWith(" ")).toBe(false);
  });

  it("still returns the whole sentence when it is short, and the first and last words of a long page work", () => {
    const t = tokenize("The fox ran. It was cold.");
    expect(findSentence(t, t.findIndex((x) => x.value === "cold"))).toBe("It was cold.");
    const long = tokenize("alpha " + "beta ".repeat(300) + "omega");
    expect(findSentence(long, 0).length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS);
    expect(findSentence(long, long.length - 1)).toContain("omega");
  });

  it("clamps a pasted book to a page at a sentence end", () => {
    const small = clampPage("Short text.");
    expect(small).toEqual({ text: "Short text.", trimmed: false });
    const big = clampPage("The fox ran. ".repeat(2000));
    expect(big.trimmed).toBe(true);
    expect(big.text.length).toBeLessThanOrEqual(MAX_PAGE_CHARS);
    expect(big.text.endsWith(".")).toBe(true);
    const noPunct = clampPage("word ".repeat(5000));
    expect(noPunct.trimmed).toBe(true);
    expect(noPunct.text.length).toBeLessThanOrEqual(MAX_PAGE_CHARS);
  });

  it("copes with empty, whitespace-only and symbol-only text", () => {
    expect(tokenize("")).toEqual([]);
    expect(words("   \n ")).toEqual([]);
    expect(words("123 !!! ---")).toEqual([]);
  });
});
