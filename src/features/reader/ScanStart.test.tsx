import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScanProgress, ScanTiles } from "./ScanStart";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
afterEach(cleanup);

describe("ScanTiles", () => {
  it("has three real buttons named by their visible text, with the camera as the hero", () => {
    const onCamera = vi.fn();
    const onGallery = vi.fn();
    const onType = vi.fn();
    render(<ScanTiles onCamera={onCamera} onGallery={onGallery} onType={onType} />);
    const camera = screen.getByRole("button", { name: /^Buksan ang camera/ });
    const gallery = screen.getByRole("button", { name: /^Pumili sa gallery/ });
    const type = screen.getByRole("button", { name: /^I-type o i-paste/ });
    expect(camera.getAttribute("data-primary")).toBe("true");
    expect(camera.className).toContain("bg-indigo");
    fireEvent.click(camera);
    fireEvent.click(gallery);
    fireEvent.click(type);
    expect([onCamera, onGallery, onType].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("draws the photo, the pencil and the scan page as decorative art, with exactly one owl and no floating lens badge", () => {
    const { container } = render(<ScanTiles onCamera={() => {}} onGallery={() => {}} onType={() => {}} />);
    for (const slot of ["photo-doodle", "pencil-doodle", "scan-page-doodle"]) {
      expect(container.querySelector(`[data-slot=${slot}]`)?.getAttribute("aria-hidden")).toBe("true");
    }
    expect(container.querySelector("[data-slot=lens-doodle]")).toBeNull();
    expect(container.querySelectorAll("[data-owl-renderer]")).toHaveLength(1);
    // no icon-in-a-circle: the tiles carry no lucide icon
    expect(container.querySelectorAll("[data-slot=scan-tile] svg.lucide")).toHaveLength(0);
  });
});

describe("ScanProgress", () => {
  it("shows progress and a cancel button", () => {
    const onCancel = vi.fn();
    render(<ScanProgress progress={40} onCancel={onCancel} />);
    expect(screen.getByRole("status").textContent).toContain("Binabasa ang pahina");
    fireEvent.click(screen.getByRole("button", { name: "Kanselahin" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
