import { describe, expect, it } from "vitest";
import { realEnglish, realPhonetic } from "./phonetic";

describe("realPhonetic", () => {
  it("keeps a real pronunciation", () => {
    expect(realPhonetic("/eh-NOR-mus/", "enormous")).toBe("/eh-NOR-mus/");
    expect(realPhonetic("/ɪˈnɔːməs/", "enormous")).toBe("/ɪˈnɔːməs/");
  });
  it("hides empty and missing values", () => {
    expect(realPhonetic("", "fox")).toBeNull();
    expect(realPhonetic("   ", "fox")).toBeNull();
    expect(realPhonetic(undefined, "fox")).toBeNull();
    expect(realPhonetic(null, "fox")).toBeNull();
  });
  it("hides the dictionary fallback's fake /word/", () => {
    expect(realPhonetic("/fox/", "fox")).toBeNull();
    expect(realPhonetic("/Fox/", "fox")).toBeNull();
    expect(realPhonetic(" /fox/ ", "Fox")).toBeNull();
  });
});

describe("realEnglish", () => {
  it("returns text or null", () => {
    expect(realEnglish("Very big.")).toBe("Very big.");
    expect(realEnglish("  ")).toBeNull();
    expect(realEnglish(undefined)).toBeNull();
  });
});
