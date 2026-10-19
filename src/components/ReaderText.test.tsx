import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { sampleBooks } from "@/data/books";
import { tokenize } from "@/lib/tokenize";
import { splitSentences } from "@/lib/tts";
import ReaderText, { sentenceIndexes } from "./ReaderText";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
afterEach(cleanup);

describe("ReaderText", () => {
  const tokens = tokenize("The fox ran. It was cold!");

  it("renders every word as a labelled button and leaves punctuation as text", () => {
    render(<ReaderText tokens={tokens} tappedIndex={null} savedWords={new Set()} readingSentence={null} onWordTap={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["The", "fox", "ran", "It", "was", "cold"]);
    expect(buttons.every((b) => b.classList.contains("word-mark"))).toBe(true);
  });

  it("marks the tapped word and saved words by data-state", () => {
    const fox = tokens.find((t) => t.value === "fox")!;
    render(<ReaderText tokens={tokens} tappedIndex={fox.index} savedWords={new Set(["cold", "fox"])} readingSentence={null} onWordTap={() => {}} />);
    expect(screen.getByRole("button", { name: "fox" }).getAttribute("data-state")).toBe("tapped");
    expect(screen.getByRole("button", { name: "cold" }).getAttribute("data-state")).toBe("saved");
    expect(screen.getByRole("button", { name: "ran" }).getAttribute("data-state")).toBeNull();
  });

  it("keeps the saved flag on a word that is also the tapped word", () => {
    const fox = tokens.find((t) => t.value === "fox")!;
    render(<ReaderText tokens={tokens} tappedIndex={fox.index} savedWords={new Set(["fox"])} readingSentence={null} onWordTap={() => {}} />);
    const btn = screen.getByRole("button", { name: "fox" });
    expect(btn.getAttribute("data-state")).toBe("tapped");
    expect(btn.getAttribute("data-saved")).toBe("true");
    expect(screen.getByRole("button", { name: "ran" }).getAttribute("data-saved")).toBeNull();
  });

  it("reports the tapped token", () => {
    const onTap = vi.fn();
    render(<ReaderText tokens={tokens} tappedIndex={null} savedWords={new Set()} readingSentence={null} onWordTap={onTap} />);
    fireEvent.click(screen.getByRole("button", { name: "ran" }));
    expect(onTap).toHaveBeenCalledWith(expect.objectContaining({ value: "ran" }));
  });

  it("flags only the sentence being read", () => {
    const { container } = render(<ReaderText tokens={tokens} tappedIndex={null} savedWords={new Set()} readingSentence={1} onWordTap={() => {}} />);
    const reading = container.querySelectorAll('[data-reading="true"]');
    expect(reading).toHaveLength(1);
    expect(reading[0].textContent).toContain("It was cold!");
  });
});

describe("sentenceIndexes", () => {
  it("agrees with splitSentences on every bundled book", () => {
    for (const b of sampleBooks) {
      const idx = sentenceIndexes(tokenize(b.text));
      expect(Math.max(...idx) + 1).toBe(splitSentences(b.text).length);
    }
  });
});
