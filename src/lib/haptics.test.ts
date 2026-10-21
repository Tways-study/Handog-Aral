import { afterEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/stores/settings";
import { buzz } from "./haptics";

afterEach(() => {
  delete (navigator as unknown as { vibrate?: unknown }).vibrate;
  useSettings.setState({ haptics: true });
});

describe("haptics", () => {
  it("vibrates when allowed and supported", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    expect(buzz("tap")).toBe(true);
    expect(buzz("success")).toBe(true);
    expect(vibrate).toHaveBeenCalledTimes(2);
  });
  it("does nothing when the setting is off", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    useSettings.setState({ haptics: false });
    expect(buzz("tap")).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });
  it("does nothing without navigator.vibrate", () => {
    expect(buzz("success")).toBe(false);
  });
});
