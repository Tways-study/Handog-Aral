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

describe("settings owl, sound and haptics", () => {
  it("defaults: 3D owl on, no outfit, sound off, haptics on", () => {
    const s = useSettings.getState();
    expect([s.owl3d, s.owlOutfit, s.sound, s.haptics]).toEqual([true, "none", false, true]);
  });

  it("setters write each field", () => {
    const s = useSettings.getState();
    s.setOwl3d(false);
    s.setOwlOutfit("glasses");
    s.setSound(true);
    s.setHaptics(false);
    expect(useSettings.getState()).toMatchObject({ owl3d: false, owlOutfit: "glasses", sound: true, haptics: false });
  });

  it("migrates v2 data: existing choices stay, new fields get their defaults", async () => {
    const v2 = { childName: "Ana", language: "tagalog", fontSize: "large", dyslexiaFont: true, ttsSpeed: 1.2, colorOverlay: "blue", theme: "dark", onboarded: true };
    await idbSet(SETTINGS_STORAGE_NAME, JSON.stringify({ state: v2, version: 2 }));
    await useSettings.persist.rehydrate();
    expect(useSettings.getState()).toMatchObject({ childName: "Ana", fontSize: "large", dyslexiaFont: true, theme: "dark", owl3d: true, owlOutfit: "none", sound: false, haptics: true });
  });
});

describe("settings v3 -> v4", () => {
  it("moves a retired Hiligaynon child to Filipino and keeps English", async () => {
    const v3 = { childName: "Ana", language: "hiligaynon", fontSize: "medium", dyslexiaFont: false, ttsSpeed: 0.8, colorOverlay: "none", theme: "system", onboarded: true };
    await idbSet(SETTINGS_STORAGE_NAME, JSON.stringify({ state: v3, version: 3 }));
    await useSettings.persist.rehydrate();
    expect(useSettings.getState().language).toBe("tagalog");

    await idbSet(SETTINGS_STORAGE_NAME, JSON.stringify({ state: { ...v3, language: "english" }, version: 3 }));
    await useSettings.persist.rehydrate();
    expect(useSettings.getState().language).toBe("english");
  });
});
