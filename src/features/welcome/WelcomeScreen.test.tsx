import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

// Radix radio items inside a form observe a hidden input's size; jsdom has no ResizeObserver.
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

vi.mock("@/lib/tts", () => ({ speechLang: () => "en-US", speak: vi.fn(async () => {}), stop: vi.fn(async () => {}) }));
// A stateful stand-in for the Reader's lookup hook: the demo's word panel gets a curated entry, no network.
const lookupSpy = vi.fn();
vi.mock("@/features/reader/useWordLookup", () => ({
  useWordLookup: () => {
    const [state, setState] = useState<unknown>(null);
    return {
      state,
      lookup: async (word: string, sentence: string, tokenIndex: number) => {
        lookupSpy(word, sentence, tokenIndex);
        setState({
          tokenIndex,
          word,
          pending: false,
          entry: { word, phonetic: "/x/", english: "Very, very big.", translation: "Dako gid", emoji: "", difficulty: "medium", example: null, source: "curated", language: "tagalog" },
        });
      },
      clear: () => setState(null),
    };
  },
}));

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import WelcomeScreen from "./WelcomeScreen";
import { defaultSettings, useSettings } from "@/stores/settings";
import { useRewards, defaultRewards } from "@/stores/rewards";
import { getDb } from "@/stores/db";

beforeEach(async () => {
  replace.mockClear();
  lookupSpy.mockClear();
  useSettings.setState({ ...defaultSettings });
  useRewards.setState({ ...defaultRewards, flags: { ...defaultRewards.flags, openedBooks: [] } });
  await getDb()?.words.clear();
});
afterEach(cleanup);

describe("WelcomeScreen", () => {
  it("shows the brand, tagline, a labelled name field and no timer redirect", () => {
    vi.useFakeTimers();
    render(<WelcomeScreen />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Handog Aral");
    expect(screen.getByText("Ang Iyong Gabay sa Pagbasa")).toBeTruthy();
    expect(screen.getByLabelText("Ano ang pangalan mo?")).toBeTruthy();
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
    expect(screen.getByRole("radio", { name: "Filipino" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "English" }).getAttribute("aria-checked")).toBe("false");
  });

  it("the owl greets in its own words, and the owl is a labelled button", () => {
    render(<WelcomeScreen />);
    expect(screen.getByText("Kumusta! Ako si Kuwago. Babasahin natin ang libro mo.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kuwago" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Filipino" }));
    expect(screen.getByText("Kumusta! Ako si Kuwago. Babasahin natin ang libro mo.")).toBeTruthy();
  });

  it("start writes the trimmed name and moves on to the first superpower instead of leaving", () => {
    render(<WelcomeScreen />);
    fireEvent.change(screen.getByLabelText("Ano ang pangalan mo?"), { target: { value: "  Ana " } });
    fireEvent.click(screen.getByRole("button", { name: "Magsimula tayo" }));
    expect(useSettings.getState().childName).toBe("Ana");
    expect(useSettings.getState().onboarded).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: "Ang Una Mong Superpower" })).toBeTruthy();
    expect(screen.getByText("Kumusta, Ana!")).toBeTruthy();
    expect(screen.getByText("Pindutin ang salitang hindi mo kilala!")).toBeTruthy();
  });

  it("the superpower: tapping a word opens the real panel, saving earns the first word, then Sige finishes", async () => {
    render(<WelcomeScreen />);
    fireEvent.change(screen.getByLabelText("Ano ang pangalan mo?"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Magsimula tayo" }));

    fireEvent.click(screen.getByRole("button", { name: "enormous" }));
    expect(lookupSpy).toHaveBeenCalledWith("enormous", "The girl walked through the enormous, quiet forest.", expect.any(Number));
    expect(screen.getByText("Nabasa mo na!")).toBeTruthy();
    expect(await screen.findByText("Dako gid")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "I-save" }));
    await waitFor(() => expect(useRewards.getState().earned["first-word"]).toBeTruthy());
    expect(await screen.findByText("Naitabi na! Ito ang una mong salita.")).toBeTruthy();
    expect(useSettings.getState().onboarded).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Sige, tara na!" }));
    expect(useSettings.getState().onboarded).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("never blocks: Sige works without tapping anything, and Laktawan is offered at step 2 too", () => {
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Magsimula tayo" }));
    expect(screen.getByRole("button", { name: "Laktawan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sige, tara na!" }));
    expect(useSettings.getState().onboarded).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("skip sets onboarded with an empty name", () => {
    render(<WelcomeScreen />);
    fireEvent.change(screen.getByLabelText("Ano ang pangalan mo?"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Laktawan" }));
    expect(useSettings.getState().childName).toBe("");
    expect(useSettings.getState().onboarded).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });
});
