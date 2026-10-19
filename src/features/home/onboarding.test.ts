import { describe, expect, it } from "vitest";
import { needsWelcome } from "./onboarding";

describe("needsWelcome", () => {
  it("sends a brand-new user to welcome", () => {
    expect(needsWelcome({ onboarded: false, childName: "", savedWordCount: 0 })).toBe(true);
  });
  it("keeps a named user", () => {
    expect(needsWelcome({ onboarded: false, childName: "Ana", savedWordCount: 0 })).toBe(false);
  });
  it("keeps a user with saved words", () => {
    expect(needsWelcome({ onboarded: false, childName: "", savedWordCount: 3 })).toBe(false);
  });
  it("keeps an onboarded (or skipped) user", () => {
    expect(needsWelcome({ onboarded: true, childName: "", savedWordCount: 0 })).toBe(false);
  });
});
