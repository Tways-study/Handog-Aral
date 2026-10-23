import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SavedWord } from "@/stores/db";

let mockWords: SavedWord[] | null = [];
vi.mock("@/hooks/useSavedWords", () => ({ useSavedWords: () => mockWords }));
vi.mock("next/navigation", () => ({ usePathname: () => "/quiz" }));
vi.mock("@/lib/tts", () => ({ speechLang: () => "en-US", speak: vi.fn(), stop: vi.fn() }));
let mockOnline = true;
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => ({ online: mockOnline }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));

import QuizScreen from "./QuizScreen";
import { useProgress } from "@/stores/progress";
import { useMoments } from "@/stores/moments";
import { useRewards } from "@/stores/rewards";

const mk = (word: string, translation: string): SavedWord => ({
  key: word, word, translation, phonetic: `/${word}/`, english: `about ${word}`, emoji: "", difficulty: "easy", example: null,
  source: "ai", language: "tagalog", bookId: null, savedAt: 1,
}) as SavedWord;
const FIVE = [mk("cat", "iring"), mk("dog", "ido"), mk("sun", "adlaw"), mk("moon", "bulan"), mk("fish", "isda")];

beforeEach(() => {
  useProgress.getState().resetAll();
  useMoments.getState().reset();
  useRewards.getState().reset();
  mockOnline = true;
});
afterEach(cleanup);

function playAll(correct: boolean) {
  for (let i = 0; i < 5; i++) {
    const opts = optionButtons();
    expect(opts).toHaveLength(4);
    // find the correct one through the known translations
    const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
    const word = screen.getByRole("heading", { level: 2 }).textContent!;
    const right = opts.find((b) => b.textContent!.endsWith(answers[word]))!;
    const wrong = opts.find((b) => b !== right)!;
    fireEvent.click(correct ? right : wrong);
    fireEvent.click(screen.getByRole("button", { name: i === 4 ? /resulta/i : /^Susunod$/ }));
  }
}

// Options take their accessible name from the visible text: a letter tile followed by the translation.
const optionButtons = () => screen.getAllByRole("radio");
const owlMood = () => document.querySelector("[data-owl-mood]")?.getAttribute("data-owl-mood");

describe("QuizScreen", () => {
  it("shows the not-enough state with the count needed and a scan link", () => {
    mockWords = FIVE.slice(0, 2);
    render(<QuizScreen />);
    expect(screen.getByTestId("quiz-not-enough").textContent).toMatch(/Kulang pa: kailangan ng 4/);
    expect(screen.getByRole("link", { name: /scan/i }).getAttribute("href")).toBe("/scan");
  });

  it("records the result exactly once, even across re-renders", () => {
    mockWords = FIVE;
    const { rerender } = render(<QuizScreen />);
    playAll(true);
    expect(screen.getByTestId("quiz-score").textContent).toMatch(/5 sa 5/);
    rerender(<QuizScreen />);
    rerender(<QuizScreen />);
    expect(useProgress.getState()).toMatchObject({ quizHighScore: 5, quizStars: 1 });
  });

  it("scores wrong answers and Retry starts a new quiz that records separately", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    playAll(false);
    expect(screen.getByTestId("quiz-score").textContent).toMatch(/0 sa 5/);
    expect(useProgress.getState().quizStars).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /ulitin/i }));
    expect(screen.getByText("1 sa 5")).toBeTruthy();
    playAll(true);
    expect(useProgress.getState()).toMatchObject({ quizHighScore: 5, quizStars: 2 });
  });

  it("marks the answer with icon and text, not colour alone", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const opts = optionButtons();
    fireEvent.click(opts[0]);
    expect(screen.getByTestId("quiz-feedback").textContent).toMatch(/Tama!|Hindi pa tama/);
    expect(opts.some((b) => b.getAttribute("data-answer") === "right")).toBe(true);
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
    const opts = optionButtons();
    fireEvent.click(opts.find((b) => b.textContent!.endsWith(answers[word]))!);
    expect(document.querySelector("[data-slot=stamp-check]")).toBeTruthy();
    expect(screen.getByTestId("quiz-feedback").textContent).toContain("Tama!");
  });

  it("answers are a radiogroup named by the prompt, with the letter in each name", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const group = screen.getByRole("radiogroup", { name: "Ano ang kahulugan nito sa Filipino?" });
    expect(group).toBeTruthy();
    const radios = optionButtons();
    expect(radios).toHaveLength(4);
    radios.forEach((r, i) => expect(r.textContent).toMatch(new RegExp(`^${"ABCD"[i]}`)));
    expect(radios.every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
  });

  it("keeps Susunod in a feedback bar from the start, disabled until an answer is in, and focuses it after", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const next = screen.getByRole("button", { name: "Susunod" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    expect(next.closest("[data-slot=feedback-bar]")).toBeTruthy();
    fireEvent.click(optionButtons()[0]);
    expect(next.disabled).toBe(false);
    expect(document.activeElement).toBe(next);
  });

  it("the owl cheers on a right answer and tilts its head on a wrong one", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    expect(owlMood()).toBe("wave"); // the first quiz greeting
    const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
    const word = screen.getByRole("heading", { level: 2 }).textContent!;
    const opts = optionButtons();
    const right = opts.find((b) => b.textContent!.endsWith(answers[word]))!;
    fireEvent.click(opts.find((b) => b !== right)!);
    expect(owlMood()).toBe("think");
    expect(screen.getByTestId("quiz-feedback").textContent).toMatch(/Hindi pa tama/);
    // never a red wall: the wrong tile is warm, not destructive
    expect(document.querySelector("[data-answer=wrong]")?.className).not.toMatch(/destructive/);
    fireEvent.click(screen.getByRole("button", { name: "Susunod" }));
    const w2 = screen.getByRole("heading", { level: 2 }).textContent!;
    const o2 = optionButtons();
    fireEvent.click(o2.find((b) => b.textContent!.endsWith(answers[w2]))!);
    expect(owlMood()).toBe("cheer");
  });

  it("greets the very first quiz once, ever", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    expect(screen.getByText("Pagsusulit na! 5 salita, kaya mo ito!")).toBeTruthy();
    cleanup();
    render(<QuizScreen />);
    expect(screen.queryByText("Pagsusulit na! 5 salita, kaya mo ito!")).toBeNull();
  });

  it("three right in a row earns the owl's hop and a cheer line, once", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
    for (let i = 0; i < 3; i++) {
      const word = screen.getByRole("heading", { level: 2 }).textContent!;
      fireEvent.click(optionButtons().find((b) => b.textContent!.endsWith(answers[word]))!);
      if (i < 2) {
        expect(screen.queryByText("Tatlong sunod na tama! Ang galing!")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Susunod" }));
      }
    }
    expect(screen.getAllByText("Tatlong sunod na tama! Ang galing!").length).toBeGreaterThan(0);
  });

  it("compacts the question card while offline", () => {
    mockWords = FIVE.map((w) => ({ ...w, phonetic: `/${w.word}-x/` }));
    mockOnline = false;
    render(<QuizScreen />);
    // phonetic and English share one ruled line
    expect(screen.getByText(/\/.+-x\/ · about /)).toBeTruthy();
  });

  it("results lead with what the child got right, show missed words as retry cards, fill stars from the left, and emit quiz-finished once", () => {
    vi.useFakeTimers();
    try {
      mockWords = FIVE;
      render(<QuizScreen />);
      const answers: Record<string, string> = Object.fromEntries(FIVE.map((w) => [w.word, w.translation]));
      for (let i = 0; i < 5; i++) {
        const word = screen.getByRole("heading", { level: 2 }).textContent!;
        const opts = optionButtons();
        const right = opts.find((b) => b.textContent!.endsWith(answers[word]))!;
        // answer the first two right, the rest wrong
        fireEvent.click(i < 2 ? right : opts.find((b) => b !== right)!);
        fireEvent.click(screen.getByRole("button", { name: i === 4 ? /resulta/i : /^Susunod$/ }));
      }
      expect(screen.getByTestId("quiz-score").textContent).toMatch(/2 sa 5/);
      const stamps = Array.from(document.querySelectorAll("[data-testid=quiz-stamps] [data-stamp]"), (n) => n.getAttribute("data-stamp"));
      expect(stamps).toEqual(["earned", "earned", "missed", "missed", "missed"]);
      expect(screen.getByTestId("quiz-right").querySelectorAll("li")).toHaveLength(2);
      expect(screen.getAllByTestId("quiz-retry-card")).toHaveLength(3);
      // no stacked red crosses
      expect(document.querySelectorAll(".bg-destructive, .text-destructive-text")).toHaveLength(0);
      expect(useRewards.getState().flags.quizzed).toBe(false);
      vi.advanceTimersByTime(1600);
      expect(useRewards.getState().flags.quizzed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("owl cheers on 4 or 5 of 5", () => {
    mockWords = FIVE;
    render(<QuizScreen />);
    playAll(true);
    expect(owlMood()).toBe("cheer");
  });
});
