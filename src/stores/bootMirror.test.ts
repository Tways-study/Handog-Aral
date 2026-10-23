import { beforeEach, describe, expect, it } from "vitest";
import { readMirroredLanguage } from "./bootMirror";

const put = (state: unknown) => localStorage.setItem("handog-mirror:handog-settings", JSON.stringify({ state }));

beforeEach(() => localStorage.clear());

describe("readMirroredLanguage", () => {
  it("reads English and Filipino from the mirror", () => {
    put({ language: "english" });
    expect(readMirroredLanguage()).toBe("english");
    put({ language: "tagalog" });
    expect(readMirroredLanguage()).toBe("tagalog");
  });

  it("falls back to Filipino for a retired, missing or broken value", () => {
    put({ language: "hiligaynon" });
    expect(readMirroredLanguage()).toBe("tagalog");
    localStorage.clear();
    expect(readMirroredLanguage()).toBe("tagalog");
    localStorage.setItem("handog-mirror:handog-settings", "{not json");
    expect(readMirroredLanguage()).toBe("tagalog");
  });
});
