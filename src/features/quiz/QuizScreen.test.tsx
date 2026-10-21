import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SavedWord } from "@/stores/db";

let mockWords: SavedWord[] | null = [];
vi.mock("@/hooks/useSavedWords", () => ({ useSavedWords: () => mockWords }));
vi.mock("next/navigation", () => ({ usePathname: () => "/quiz" }));
vi.mock("@/lib/tts", () => ({ speak: vi.fn(), stop: vi.fn() }));
vi.mock("next/link", () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));

import QuizScreen from "./QuizScreen";
import { useProgress } from "@/stores/progress";

const mk = (word: string, translation: string): SavedWord => ({
  key: word, word, translation, phonetic: `/${word}/`, english: `about ${word}`, emoji: "", difficulty: "easy", example: null,
  source: "ai", language: "hiligaynon", bookId: null, savedAt: 1,
}) as SavedWord;
const FIVE = [mk("cat", "iring"), mk("dog", "ido"), mk("sun", "adlaw"), mk("moon", "bulan"), mk("fish", "isda")];

beforeEach(() => useProgress.getState().resetAll());
afterEach(cleanup);

function playAll(correct: boolean) {
  for (let i = 0; i < 5; i++) {
    const opts = screen.getAllByRole("button").filter((b) => /^[A-D]\. /.test(b.getAttribute("aria-label") ?? ""));
    expect(opts).toHaveLength(4);
    // find the correct one through the known translations
    const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
    const word = screen.getByRole("heading", { level: 2 }).textContent!;
    const right = opts.find((b) => b.getAttribute("aria-label")!.endsWith(answers[word]))!;
    const wrong = opts.find((b) => b !== right)!;
    fireEvent.click(correct ? right : wrong);
    fireEvent.click(screen.getByRole("button", { name: i === 4 ? /resulta/i : /^Sunod$/ }));
  }
}

describe("QuizScreen", () => {
  it("shows the not-enough state with the count needed and a scan link", () => {
    mockWords = FIVE.slice(0, 2);
    render(<QuizScreen />);
    expect(screen.getByTestId("quiz-not-enough").textContent).toMatch(/Kulang pa: kinahanglan ang 4/);
    expect(screen.getByRole("link", { name: /scan/i }).getAttribute("href")).toBe("/scan");
  });

  it("records the result exactly once, even across re-renders", () => {
    mockWords = FIVE;
    const { rerender } = render(<QuizScreen />);
    playAll(true);
    expect(screen.getByTestId("quiz-score").textContent).toMatch(/5 sang 5/);
    rerender(<QuizScreen />);
    rerender(<QuizScreen />);
    expect(useProgress.getState()).toMatchObject({ quizHighScore: 5, quizStars: 1 });
  });

  it("scores wrong answers and Retry starts a new quiz that records separately", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    playAll(false);
    expect(screen.getByTestId("quiz-score").textContent).toMatch(/0 sang 5/);
    expect(useProgress.getState().quizStars).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /liwat/i }));
    expect(screen.getByText("1 sang 5")).toBeTruthy();
    playAll(true);
    expect(useProgress.getState()).toMatchObject({ quizHighScore: 5, quizStars: 2 });
  });

  it("marks the answer with icon and text, not colour alone", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const opts = screen.getAllByRole("button").filter((b) => /^[A-D]\. /.test(b.getAttribute("aria-label") ?? ""));
    fireEvent.click(opts[0]);
    expect(screen.getByRole("status", { hidden: true }).textContent).toMatch(/Tama!|Indi pa tama/);
    expect(opts.some((b) => b.getAttribute("data-state") === "right")).toBe(true);
  });

  it("shows the saved entry's real phonetic and English, and never a placeholder phonetic or empty English", () => {
    mockWords = [
      { ...mk("cat", "iring"), phonetic: "/kat/", english: "A small pet." },
      { ...mk("dog", "ido"), phonetic: "/dog/", english: "" },
      mk("sun", "adlaw"),
      mk("moon", "bulan"),
    ];
    for (let n = 0; n < 12; n++) {
      cleanup();
      render(<QuizScreen />);
      const word = screen.getByRole("heading", { level: 2 }).textContent!;
      expect(screen.queryByText(`/${word}/`)).toBeNull();
      if (word === "cat") expect(screen.getByText("/kat/")).toBeTruthy();
      if (word === "cat") expect(screen.getByText("A small pet.")).toBeTruthy();
    }
  });

  it("stamps a check on a correct answer, with the text alternative kept", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
    const word = screen.getByRole("heading", { level: 2 }).textContent!;
    const opts = screen.getAllByRole("button").filter((b) => /^[A-D]\. /.test(b.getAttribute("aria-label") ?? ""));
    fireEvent.click(opts.find((b) => b.getAttribute("aria-label")!.endsWith(answers[word]))!);
    expect(document.querySelector("[data-slot=stamp-check]")).toBeTruthy();
    expect(screen.getByRole("status", { hidden: true }).textContent).toContain("Tama!");
  });
});
