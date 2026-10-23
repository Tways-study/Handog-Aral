import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }), usePathname: () => "/" }));
let words: unknown[] | null = [];
const speak = vi.fn(async () => {});
vi.mock("@/lib/tts", () => ({ speechLang: () => "en-US", speak: (...a: unknown[]) => speak(...(a as [])), stop: vi.fn(async () => {}) }));
vi.mock("@/hooks/useSavedWords", () => ({ useSavedWords: () => words }));
vi.mock("@/stores/settings", async (orig) => ({ ...(await orig<typeof import("@/stores/settings")>()), useSettingsHydrated: () => true }));
vi.mock("@/stores/rewards", async (orig) => ({ ...(await orig<typeof import("@/stores/rewards")>()), useRewardsHydrated: () => true }));
vi.mock("@/stores/progress", async (orig) => ({ ...(await orig<typeof import("@/stores/progress")>()), useProgressHydrated: () => true }));

import HomeScreen from "./HomeScreen";
import { defaultSettings, useSettings } from "@/stores/settings";
import { defaultProgress, useProgress } from "@/stores/progress";
import { defaultRewards, useRewards } from "@/stores/rewards";

const word = (w: string, translation: string, difficulty: string, i: number) => ({
  key: w, word: w, phonetic: "", english: "", translation, emoji: "", difficulty, example: null, source: "dictionary", language: "tagalog", bookId: null, savedAt: 100 - i,
});

beforeEach(() => {
  replace.mockClear();
  words = [];
  useSettings.setState({ ...defaultSettings, onboarded: true, childName: "Ana" });
  useProgress.setState({ ...defaultProgress });
  useRewards.setState({ ...defaultRewards, earned: {}, flags: { ...defaultRewards.flags, openedBooks: [] } });
  speak.mockClear();
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
    expect(screen.getByRole("link", { name: "Ituloy ang pagbabasa" }).getAttribute("href")).toBe("/read/pedro");
    expect(screen.getByText("1 bituin")).toBeTruthy();
  });

  it("keeps the tally to two chips, shows the percentage once, and the collected count on the label", () => {
    words = [word("a1", "t1", "easy", 0), word("a2", "t2", "easy", 1)];
    useProgress.setState({ savedWordCount: 2, bookProgress: { fox: 67 } });
    render(<HomeScreen />);
    expect(screen.getByRole("list", { name: "Ang natipon mo" }).querySelectorAll("li")).toHaveLength(2);
    expect(screen.getAllByText(/67%/)).toHaveLength(1);
    expect(screen.getByText("Naipon:")).toBeTruthy();
    expect(screen.getByText("2 salita")).toBeTruthy();
    expect(document.querySelector("[data-slot=stamp-star]")).toBeTruthy();
  });

  it("falls back to the first bundled book, and says Umpisahan natin until a word is saved", () => {
    render(<HomeScreen />);
    expect(screen.getByText("The Brave Little Fox")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Umpisahan natin" }).getAttribute("href")).toBe("/read/fox");
    expect(screen.queryByRole("link", { name: "Ituloy ang pagbabasa" })).toBeNull();
  });

  it("the in-page primary follows progress: continue at 1-99%, read again at 100%; scan is a paper secondary", () => {
    useProgress.setState({ currentBookId: "fox", bookProgress: { fox: 100 } });
    render(<HomeScreen />);
    expect(screen.getByRole("link", { name: "Basahin ulit" }).getAttribute("href")).toBe("/read/fox");
    const read = screen.getByRole("link", { name: "Basahin ulit" });
    const scan = screen.getByRole("link", { name: "I-scan ang pahina" });
    expect(read.getAttribute("data-variant")).toBe("default");
    expect(scan.getAttribute("data-variant")).toBe("secondary");
    cleanup();
    useProgress.setState({ bookProgress: { fox: 1 } });
    render(<HomeScreen />);
    expect(screen.getByRole("link", { name: "Ituloy ang pagbabasa" })).toBeTruthy();
  });

  it("the owl's tag is a real button with the newest word and its meaning; tapping it listens and records the event", () => {
    words = [word("enormous", "Dako gid", "medium", 0), word("quiet", "Mahipos", "easy", 1)];
    useProgress.setState({ savedWordCount: 2 });
    render(<HomeScreen />);
    expect(screen.getByText("Nababasa mo na ang 2 bagong salita!")).toBeTruthy();
    const tag = screen.getByRole("button", { name: /enormous\s*Dako gid/ });
    fireEvent.click(tag);
    expect(speak).toHaveBeenCalledWith("enormous", expect.objectContaining({ rate: 0.8 }));
    expect(useRewards.getState().flags.listened).toBe(true);
  });

  it("with no words the owl invites the child to pick a book instead", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Pumili ng aklat, at babasahin natin!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Dako|Pakinggan/ })).toBeNull();
  });

  it("the stars chip counts word, quiz and bonus stars", () => {
    useProgress.setState({ savedWordCount: 6, quizStars: 1 });
    useRewards.setState({ bonusStars: 2 });
    words = [word("a1", "t", "easy", 0)];
    render(<HomeScreen />);
    expect(screen.getByText("5 bituin")).toBeTruthy();
  });

  it("links to the sticker book with N of 14, and to the memory game only from 3 saved words", () => {
    useRewards.setState({ earned: { "first-word": 1, "first-scan": 2 } });
    render(<HomeScreen />);
    const stickers = screen.getByRole("link", { name: /Mga sticker/ });
    expect(stickers.getAttribute("href")).toBe("/stickers");
    expect(within(stickers).getByText("2 sa 14")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Tara, laro tayo/ })).toBeNull();
    cleanup();
    words = [word("a1", "t1", "easy", 0), word("a2", "t2", "easy", 1), word("a3", "t3", "easy", 2)];
    render(<HomeScreen />);
    expect(screen.getByRole("link", { name: /Tara, laro tayo/ }).getAttribute("href")).toBe("/play");
  });

  it("lists the last saved words newest first, with a link to /words and a quiz nudge", () => {
    words = [word("a1", "t1", "easy", 0), word("a2", "t2", "medium", 1), word("a3", "t3", "hard", 2), word("a4", "t4", "easy", 3), word("a5", "t5", "easy", 4)];
    useProgress.setState({ savedWordCount: 5 });
    render(<HomeScreen />);
    const strip = within(document.getElementById("recent-heading")!.closest("section")!);
    expect(strip.getByText("a1")).toBeTruthy();
    expect(strip.getByText("t4")).toBeTruthy();
    expect(strip.getByText("a5")).toBeTruthy();
    // rows beyond the fourth are for lg+ only
    expect(strip.getByText("a5").closest("li")!.className).toContain("hidden lg:flex");
    expect(strip.getByText("a4").closest("li")!.className).not.toContain("hidden");
    expect(screen.getByRole("link", { name: /natipong salita/ }).getAttribute("href")).toBe("/words");
    expect(screen.getByRole("link", { name: "Magpasulit" }).getAttribute("href")).toBe("/quiz");
  });

  it("shows a calm empty state with no quiz nudge when there are no words", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Wala pang natipong salita")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Magpasulit" })).toBeNull();
  });

  it("lists the other bundled books below the cover, each linking to its reader", () => {
    useProgress.setState({ currentBookId: "fox", bookProgress: { star: 40 } });
    render(<HomeScreen />);
    const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/read/") && a.closest("section[aria-labelledby='other-books-heading']"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/read/star", "/read/pedro", "/read/rainbow", "/read/turtle", "/read/market"]);
    expect(links[0].textContent).toContain("40% tapos na");
    expect(screen.getByRole("heading", { name: "Iba pang aklat" })).toBeTruthy();
  });

  it("records the day's streak once on mount and tells the rewards", () => {
    const d = new Date();
    const yesterday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    const ymd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    useProgress.setState({ streak: 2, lastActiveDate: ymd });
    const { rerender } = render(<HomeScreen />);
    expect(useProgress.getState().streak).toBe(3);
    expect(useRewards.getState().earned["streak-3"]).toBeTruthy();
    rerender(<HomeScreen />);
    expect(useProgress.getState().streak).toBe(3);
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
    expect(screen.getByRole("link", { name: "Umpisahan natin" })).toBeTruthy();
  });
});
