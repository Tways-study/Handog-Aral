import { describe, expect, it } from "vitest";
import { splitSentences } from "./sentences";

describe("splitSentences", () => {
  it("splits on . ! ?", () => {
    expect(splitSentences("Hi there. How are you? Great!")).toEqual(["Hi there.", "How are you?", "Great!"]);
  });
  it("keeps closing quotes attached", () => {
    expect(splitSentences('He said "Go home." Then left.')).toEqual(['He said "Go home."', "Then left."]);
  });
  it("keeps trailing text without punctuation", () => {
    expect(splitSentences("One. Two")).toEqual(["One.", "Two"]);
  });
  it("handles empty and whitespace", () => {
    expect(splitSentences("  ")).toEqual([]);
    expect(splitSentences("a\n\nb.")).toEqual(["a b."]);
  });
});
