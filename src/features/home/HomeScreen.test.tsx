import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }), usePathname: () => "/" }));
let words: unknown[] | null = [];
vi.mock("@/hooks/useSavedWords", () => ({ useSavedWords: () => words }));
vi.mock("@/stores/settings", async (orig) => ({ ...(await orig<typeof import("@/stores/settings")>()), useSettingsHydrated: () => true }));
vi.mock("@/stores/progress", async (orig) => ({ ...(await orig<typeof import("@/stores/progress")>()), useProgressHydrated: () => true }));

import HomeScreen from "./HomeScreen";
import { defaultSettings, useSettings } from "@/stores/settings";
import { defaultProgress, useProgress } from "@/stores/progress";

const word = (w: string, translation: string, difficulty: string, i: number) => ({
  key: w, word: w, phonetic: "", english: "", translation, emoji: "", difficulty, example: null, source: "dictionary", language: "hiligaynon", bookId: null, savedAt: 100 - i,
});

beforeEach(() => {
  replace.mockClear();
  words = [];
  useSettings.setState({ ...defaultSettings, onboarded: true, childName: "Ana" });
  useProgress.setState({ ...defaultProgress });
});
afterEach(cleanup);

describe("HomeScreen", () => {
  it("shows the greeting, the current book with its progress, and the scan action", () => {
    useProgress.setState({ currentBookId: "pedro", bookProgress: { pedro: 30 }, streak: 3, quizStars: 1 });
    render(<HomeScreen />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Ana");
    expect(screen.getByText("Pedro and the Rice Field")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("30");
    expect(screen.getByRole("link", { name: "I-scan ang pahina" }).getAttribute("href")).toBe("/scan");
    expect(screen.getByRole("link", { name: "Padayon sa pagbasa" }).getAttribute("href")).toBe("/read/pedro");
    expect(screen.getByText("1 ka bituon")).toBeTruthy();
  });

  it("keeps the tally to two chips, shows the percentage once, and the collected count on the label", () => {
    words = [word("a1", "t1", "easy", 0), word("a2", "t2", "easy", 1)];
    useProgress.setState({ savedWordCount: 2, bookProgress: { fox: 67 } });
    render(<HomeScreen />);
    expect(screen.getByRole("list", { name: "Imo nga natipon" }).querySelectorAll("li")).toHaveLength(2);
    expect(screen.getAllByText(/67%/)).toHaveLength(1);
    expect(screen.getByText("Natipon:")).toBeTruthy();
    expect(screen.getByText("2 ka pulong")).toBeTruthy();
    expect(document.querySelector("[data-slot=stamp-star]")).toBeTruthy();
  });

  it("falls back to the first bundled book", () => {
    render(<HomeScreen />);
    expect(screen.getByText("The Brave Little Fox")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Padayon sa pagbasa" }).getAttribute("href")).toBe("/read/fox");
  });

  it("lists the last saved words newest first, with a link to /words and a quiz nudge", () => {
    words = [word("a1", "t1", "easy", 0), word("a2", "t2", "medium", 1), word("a3", "t3", "hard", 2), word("a4", "t4", "easy", 3), word("a5", "t5", "easy", 4)];
    useProgress.setState({ savedWordCount: 5 });
    render(<HomeScreen />);
    expect(screen.getByText("a1")).toBeTruthy();
    expect(screen.getByText("t4")).toBeTruthy();
    expect(screen.getByText("a5")).toBeTruthy();
    // rows beyond the fourth are for lg+ only
    expect(screen.getByText("a5").closest("li")!.className).toContain("hidden lg:flex");
    expect(screen.getByText("a4").closest("li")!.className).not.toContain("hidden");
    expect(screen.getByRole("link", { name: /natipon nga pulong/ }).getAttribute("href")).toBe("/words");
    expect(screen.getByRole("link", { name: "Mag-pasulit" }).getAttribute("href")).toBe("/quiz");
  });

  it("shows a calm empty state with no quiz nudge when there are no words", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Wala pa sang natipon nga pulong")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Mag-pasulit" })).toBeNull();
  });

  it("lists the other bundled books below the cover, each linking to its reader", () => {
    useProgress.setState({ currentBookId: "fox", bookProgress: { star: 40 } });
    render(<HomeScreen />);
    const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/read/") && a.closest("section[aria-labelledby='other-books-heading']"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/read/star", "/read/pedro", "/read/rainbow", "/read/turtle", "/read/market"]);
    expect(links[0].textContent).toContain("40% natapos na");
    expect(screen.getByRole("heading", { name: "Iba pang libro" })).toBeTruthy();
  });

  it("records the day's streak once on mount", () => {
    render(<HomeScreen />);
    expect(useProgress.getState().streak).toBe(1);
  });

  it("redirects a brand-new user to /welcome", () => {
    useSettings.setState({ onboarded: false, childName: "" });
    render(<HomeScreen />);
    expect(replace).toHaveBeenCalledWith("/welcome");
    expect(screen.queryByRole("link", { name: "I-scan ang pahina" })).toBeNull();
  });

  it("does not redirect a named user or a user with saved words", () => {
    useSettings.setState({ onboarded: false, childName: "Ana" });
    render(<HomeScreen />);
    cleanup();
    useSettings.setState({ onboarded: false, childName: "" });
    words = [word("a1", "t1", "easy", 0)];
    render(<HomeScreen />);
    expect(replace).not.toHaveBeenCalled();
  });

  it("speaks Tagalog when the language is tagalog", () => {
    useSettings.setState({ language: "tagalog" });
    render(<HomeScreen />);
    expect(screen.getByRole("link", { name: "Ituloy ang pagbabasa" })).toBeTruthy();
  });
});
