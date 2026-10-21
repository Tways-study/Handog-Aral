import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { sampleBooks } from "@/data/books";
import { tokenize } from "@/lib/tokenize";
import { splitSentences } from "@/lib/tts";
import { wordFromSurfaceClick } from "@/features/reader/nearestWord";
import ReaderText, { lineIndexes, sentenceIndexes } from "./ReaderText";

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

describe("read-along marker", () => {
  it("flags only the speaking word and lightens the sentence tint", () => {
    const fox = tokenize("The fox ran.").find((t) => t.value === "fox")!;
    const t = tokenize("The fox ran.");
    const { container } = render(<ReaderText tokens={t} tappedIndex={null} savedWords={new Set()} readingSentence={0} speakingToken={fox.index} onWordTap={() => {}} />);
    const speaking = container.querySelectorAll('[data-speaking="true"]');
    expect(speaking).toHaveLength(1);
    expect(speaking[0].textContent).toBe("fox");
    expect(container.querySelector('[data-reading="true"]')?.className).toContain("bg-marker/20");
    // speaking is its own state: it does not touch tapped or saved
    expect(speaking[0].getAttribute("data-state")).toBeNull();
    expect(speaking[0].getAttribute("data-saved")).toBeNull();
  });
});

describe("lineIndexes", () => {
  it("counts source lines from newlines in the spacing", () => {
    const t = tokenize("one two\nthree\n\nfour");
    const lines = lineIndexes(t);
    const word = (w: string) => lines[t.findIndex((x) => x.value === w)];
    expect([word("one"), word("two"), word("three"), word("four")]).toEqual([0, 0, 1, 3]);
  });
  it("tags word chunks with their line", () => {
    const t = tokenize("one\ntwo");
    const { container } = render(<ReaderText tokens={t} tappedIndex={null} savedWords={new Set()} readingSentence={null} onWordTap={() => {}} />);
    expect(Array.from(container.querySelectorAll("[data-line]"), (n) => n.getAttribute("data-line"))).toEqual(["0", "1"]);
  });
});

describe("tapping near a word", () => {
  it("picks the nearest word within 24 px and ignores the word buttons themselves", () => {
    const t = tokenize("The fox ran.");
    const { container } = render(<ReaderText tokens={t} tappedIndex={null} savedWords={new Set()} readingSentence={null} onWordTap={() => {}} />);
    const boxes: Record<string, [number, number, number, number]> = { The: [20, 0, 60, 36], fox: [68, 0, 86, 36], ran: [94, 0, 140, 36] };
    for (const b of container.querySelectorAll<HTMLElement>("[data-token-index]")) {
      const [l, tp, r, bt] = boxes[b.textContent ?? ""];
      b.getBoundingClientRect = () => ({ left: l, top: tp, right: r, bottom: bt, width: r - l, height: bt - tp, x: l, y: tp, toJSON: () => ({}) });
    }
    const idx = (w: string) => t.find((x) => x.value === w)!.index;
    const surface = container.firstElementChild!;
    expect(wordFromSurfaceClick({ target: surface, clientX: 64, clientY: 18 }, container)).toBe(idx("fox")); // 4 px from both: the small word's centre is nearer
    expect(wordFromSurfaceClick({ target: surface, clientX: 90, clientY: 50 }, container)).toBe(idx("fox")); // below the line, nearest "fox"
    expect(wordFromSurfaceClick({ target: surface, clientX: 400, clientY: 18 }, container)).toBeNull();
    // a click ON a button is that button's own business
    expect(wordFromSurfaceClick({ target: screen.getByRole("button", { name: "fox" }), clientX: 70, clientY: 10 }, container)).toBeNull();
    // keyboard activation reports 0,0
    expect(wordFromSurfaceClick({ target: surface, clientX: 0, clientY: 0 }, container)).toBeNull();
  });
});
