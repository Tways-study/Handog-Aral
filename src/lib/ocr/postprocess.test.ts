import { describe, expect, it } from "vitest";
import { cleanOcrText } from "./postprocess";

describe("cleanOcrText", () => {
  it("returns empty for empty input", () => {
    expect(cleanOcrText("")).toBe("");
    expect(cleanOcrText("  \n\n ")).toBe("");
  });
  it("joins hyphenated line breaks", () => {
    expect(cleanOcrText("The enor-\nmous dog")).toBe("The enormous dog");
  });
  it("keeps real hyphens before capitals", () => {
    expect(cleanOcrText("well-\nKnown")).toContain("well-");
  });
  it("collapses single newlines but keeps paragraphs", () => {
    expect(cleanOcrText("One line\nsecond line\n\nNew paragraph\nhere")).toBe(
      "One line second line\n\nNew paragraph here",
    );
  });
  it("normalizes quotes and dashes", () => {
    expect(cleanOcrText("“It’s” – she said—yes")).toBe("\"It's\" - she said - yes");
  });
  it("removes junk lines", () => {
    expect(cleanOcrText("Hello world\n|| ~ .\n__\nBye now")).toBe("Hello world Bye now");
  });
  it("collapses repeated spaces", () => {
    expect(cleanOcrText("a    b \t c")).toBe("a b c");
  });
});
