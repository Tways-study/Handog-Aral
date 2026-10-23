import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import BandScene from "./BandScene";
import { PageHeader } from "./PageLayout";
import ThemeSync from "./ThemeSync";
import { defaultSettings, useSettings } from "@/stores/settings";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.scenery;
  vi.restoreAllMocks();
});

describe("BandScene", () => {
  it("is decorative: hidden from assistive tech, no text, no focusable content", () => {
    const { container } = render(<BandScene />);
    const scene = container.querySelector('[data-slot="band-scene"]')!;
    expect(scene.getAttribute("aria-hidden")).toBe("true");
    expect(scene.textContent).toBe("");
    expect(scene.querySelectorAll("a,button,input,[tabindex]")).toHaveLength(0);
  });

  it("sits inside every PageHeader without changing its heading", () => {
    const { container, getByRole } = render(<PageHeader title="Books" subtitle="Pick something" hideSettings />);
    expect(container.querySelector('[data-slot="band-scene"]')).not.toBeNull();
    expect(getByRole("heading", { level: 1 }).textContent).toBe("Books");
  });
});

describe("ThemeSync scenery gate", () => {
  beforeEach(async () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
    useSettings.setState({ ...defaultSettings });
    await act(async () => {
      await useSettings.persist.rehydrate();
    });
  });

  const gate = () => document.documentElement.dataset.scenery;

  it("moves when allowed and the device is capable", () => {
    render(<ThemeSync />);
    expect(gate()).toBe("moving");
  });

  it("stays still when the child turns it off", () => {
    useSettings.setState({ scenery: false });
    render(<ThemeSync />);
    expect(gate()).toBe("still");
  });

  it("stays still under save-data", () => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    try {
      render(<ThemeSync />);
      expect(gate()).toBe("still");
    } finally {
      delete (navigator as { connection?: unknown }).connection;
    }
  });
});
