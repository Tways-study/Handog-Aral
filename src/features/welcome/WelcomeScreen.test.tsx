import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// Radix radio items inside a form observe a hidden input's size; jsdom has no ResizeObserver.
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import WelcomeScreen from "./WelcomeScreen";
import { defaultSettings, useSettings } from "@/stores/settings";

beforeEach(() => {
  replace.mockClear();
  useSettings.setState({ ...defaultSettings });
});
afterEach(cleanup);

describe("WelcomeScreen", () => {
  it("shows the brand, tagline, a labelled name field and no timer redirect", () => {
    vi.useFakeTimers();
    render(<WelcomeScreen />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Handog Aral");
    expect(screen.getByText("Ang Imo Gabay sa Pagbasa")).toBeTruthy();
    expect(screen.getByLabelText("Ano ang imo ngalan?")).toBeTruthy();
    vi.advanceTimersByTime(10_000);
    expect(replace).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("switches the page language immediately when Filipino is chosen", () => {
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByRole("radio", { name: "Filipino" }));
    expect(useSettings.getState().language).toBe("tagalog");
    expect(screen.getByLabelText("Ano ang pangalan mo?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Magsimula tayo" })).toBeTruthy();
  });

  it("offers the two languages as one radio group with the chosen notebook checked", () => {
    render(<WelcomeScreen />);
    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-labelledby")).toBe("language-label");
    expect(screen.getByRole("radio", { name: "Hiligaynon" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Filipino" }).getAttribute("aria-checked")).toBe("false");
  });

  it("start writes the trimmed name, onboarded, and routes home", () => {
    render(<WelcomeScreen />);
    fireEvent.change(screen.getByLabelText("Ano ang imo ngalan?"), { target: { value: "  Ana " } });
    fireEvent.click(screen.getByRole("button", { name: "Magsugod kita" }));
    expect(useSettings.getState().childName).toBe("Ana");
    expect(useSettings.getState().onboarded).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("skip sets onboarded with an empty name", () => {
    render(<WelcomeScreen />);
    fireEvent.change(screen.getByLabelText("Ano ang imo ngalan?"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Laktawan" }));
    expect(useSettings.getState().childName).toBe("");
    expect(useSettings.getState().onboarded).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });
});
