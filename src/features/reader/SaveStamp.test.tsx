import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import SaveStamp, { STAMP_HOLD_MS, STAMP_SIZE } from "./SaveStamp";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SaveStamp", () => {
  const spot = { key: 1, left: 100, top: 200, width: 60, height: 36 };

  it("renders nothing without a spot", () => {
    render(<SaveStamp spot={null} onDone={() => {}} />);
    expect(document.querySelector("[data-slot=save-stamp]")).toBeNull();
  });

  it("is a 96 px, pointer-less, hidden stamp centred on the saved word, and removes itself", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<SaveStamp spot={spot} onDone={onDone} />);
    const el = document.querySelector<HTMLElement>("[data-slot=save-stamp]")!;
    expect(STAMP_SIZE).toBe(96);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.className).toContain("pointer-events-none");
    expect(el.style.left).toBe(`${100 + 30 - 48}px`);
    expect(el.style.top).toBe(`${200 + 18 - 48}px`);
    expect(el.style.width).toBe("96px");
    act(() => void vi.advanceTimersByTime(STAMP_HOLD_MS - 300));
    expect(onDone).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(400));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
