// @vitest-environment node
import { describe, expect, it } from "vitest";
import { findSentence, tokenize } from "./tokenize";

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
