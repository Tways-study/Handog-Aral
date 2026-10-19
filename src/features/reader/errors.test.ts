// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scanStrings } from "@/data/strings/scan";
import { ocrErrorKey } from "./errors";

describe("ocrErrorKey", () => {
  it("maps each OCR error code to a calm message key", () => {
    expect(ocrErrorKey("no_text")).toBe("errorNoText");
    expect(ocrErrorKey("offline_pack_missing")).toBe("errorOfflinePack");
    expect(ocrErrorKey("failed")).toBe("errorFailed");
    expect(ocrErrorKey("aborted")).toBeNull();
    expect(ocrErrorKey(null)).toBeNull();
  });
  it("points the offline-pack message at Settings in both languages", () => {
    for (const lang of ["hiligaynon", "tagalog"] as const) expect(scanStrings[lang].errorOfflinePack).toMatch(/Settings/);
  });
});
