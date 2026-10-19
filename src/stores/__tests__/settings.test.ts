import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings, useSettings, SETTINGS_STORAGE_NAME } from "../settings";
import { set as idbSet } from "idb-keyval";

beforeEach(() => {
  useSettings.setState({ ...defaultSettings });
});

describe("settings onboarded", () => {
  it("defaults to false and setOnboarded flips it", () => {
    expect(useSettings.getState().onboarded).toBe(false);
    useSettings.getState().setOnboarded(true);
    expect(useSettings.getState().onboarded).toBe(true);
  });

  it("resetSettings keeps the child onboarded", () => {
    useSettings.getState().setOnboarded(true);
    useSettings.getState().setChildName("Ana");
    useSettings.getState().resetSettings();
    expect(useSettings.getState().childName).toBe("");
    expect(useSettings.getState().onboarded).toBe(true);
  });

  it("migrates v1 data: an existing childName implies onboarded", async () => {
    const v1 = { childName: "Ana", language: "tagalog", fontSize: "medium", dyslexiaFont: false, ttsSpeed: 0.8, colorOverlay: "none", theme: "system" };
    await idbSet(SETTINGS_STORAGE_NAME, JSON.stringify({ state: v1, version: 1 }));
    await useSettings.persist.rehydrate();
    expect(useSettings.getState().childName).toBe("Ana");
    expect(useSettings.getState().language).toBe("tagalog");
    expect(useSettings.getState().onboarded).toBe(true);
  });

  it("migrates v1 data without a name to onboarded=false", async () => {
    const v1 = { ...defaultSettings, childName: "" } as Record<string, unknown>;
    delete v1.onboarded;
    await idbSet(SETTINGS_STORAGE_NAME, JSON.stringify({ state: v1, version: 1 }));
    await useSettings.persist.rehydrate();
    expect(useSettings.getState().onboarded).toBe(false);
  });
});
