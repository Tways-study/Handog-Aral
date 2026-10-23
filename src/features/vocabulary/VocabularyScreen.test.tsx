import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/words" }));
vi.mock("next/link", () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));
vi.mock("@/lib/tts", () => ({ speechLang: () => "en-US", speak: vi.fn(async () => {}), stop: vi.fn(async () => {}) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div data-testid="drawer">{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

// WordPanel is owned by the reader; test against its frozen props contract only.
vi.mock("@/components/WordPanel", () => ({
  default: (p: { entry: { word: string }; onRemove: () => void; onSpeak: () => void }) => (
    <div>
      <h2>{p.entry.word}</h2>
      <button onClick={p.onSpeak}>Listen</button>
      <button onClick={p.onRemove}>Remove</button>
    </div>
  ),
}));

import VocabularyScreen, { filterWords } from "./VocabularyScreen";
import { getDb, type SavedWord } from "@/stores/db";
import { learnWord } from "@/lib/vocabulary";
import { speak } from "@/lib/tts";
import { useProgress } from "@/stores/progress";
import type { ResolvedExplanation } from "@/shared/schemas";

const entry = (word: string, translation: string, difficulty: "easy" | "medium" | "hard"): ResolvedExplanation => ({
  word, translation, difficulty, phonetic: `/${word}/`, english: `about ${word}`, emoji: "", example: null, source: "ai", language: "tagalog",
});

beforeEach(async () => {
  const db = getDb()!;
  await Promise.all([db.wordCache.clear(), db.words.clear(), db.lookupQueue.clear()]);
  useProgress.getState().resetAll();
});
afterEach(cleanup);

describe("filterWords", () => {
  const rows = [
    { word: "cat", translation: "iring", english: "a pet", difficulty: "easy" },
    { word: "umbrella", translation: "payong", english: "rain cover", difficulty: "hard" },
  ] as SavedWord[];
  it("filters by difficulty and by word or translation", () => {
    expect(filterWords(rows, "", "hard").map((r) => r.word)).toEqual(["umbrella"]);
    expect(filterWords(rows, "IRING", "all").map((r) => r.word)).toEqual(["cat"]);
    expect(filterWords(rows, "cat", "hard")).toEqual([]);
  });
});

describe("VocabularyScreen", () => {
  it("shows the calm empty state with links to scan and books", async () => {
    render(<VocabularyScreen />);
    const empty = await screen.findByTestId("words-empty");
    expect(within(empty).getByRole("link", { name: "Mag-scan" }).getAttribute("href")).toBe("/scan");
    expect(within(empty).getByRole("link", { name: "Mga Aklat" }).getAttribute("href")).toBe("/books");
  });

  it("lists words, searches, filters, and shows a no-matches state", async () => {
    await learnWord(entry("cat", "iring", "easy"), null);
    await learnWord(entry("umbrella", "payong", "hard"), null);
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(2));
    expect(screen.getByText(/2 pang salita para mabuksan/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Hanapin ang salita"), { target: { value: "pay" } });
    expect(screen.getAllByTestId("word-row")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Hanapin ang salita"), { target: { value: "zzz" } });
    expect(screen.getByTestId("no-matches")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ipakita lahat" }));
    expect(screen.getAllByTestId("word-row")).toHaveLength(2);

    fireEvent.click(screen.getByRole("radio", { name: /Mahirap/ }));
    expect(screen.getAllByTestId("word-row")).toHaveLength(1);
    expect(screen.getByText("umbrella")).toBeTruthy();
  });

  it("opens detail, speaks, and removing a word drops it from the list and the progress count", async () => {
    await learnWord(entry("cat", "iring", "easy"), null);
    await learnWord(entry("dog", "ido", "easy"), null);
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(2));
    expect(useProgress.getState().savedWordCount).toBe(2);

    fireEvent.click(screen.getByText("cat").closest("button")!);
    const drawer = await screen.findByTestId("drawer");
    fireEvent.click(within(drawer).getByRole("button", { name: "Listen" }));
    expect(speak).toHaveBeenCalledWith("cat", expect.objectContaining({ rate: expect.any(Number) }));

    fireEvent.click(within(drawer).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(1));
    expect(screen.queryByTestId("drawer")).toBeNull();
    expect(screen.queryByText("cat")).toBeNull();
    await waitFor(() => expect(useProgress.getState().savedWordCount).toBe(1));
  });

  it("the header owl says how many words were collected, and every word has a letter tile (never an emoji)", async () => {
    await learnWord({ ...entry("cat", "iring", "easy"), emoji: "🐱" }, null);
    await learnWord({ ...entry("dog", "ido", "easy"), emoji: "" }, null);
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(2));
    expect(screen.getByText("2 salita na ang naipon mo!")).toBeTruthy();
    const tiles = Array.from(document.querySelectorAll("[data-slot=word-tile]"), (n) => [n.getAttribute("data-kind"), n.textContent]);
    expect(tiles).toEqual(expect.arrayContaining([["letter", "C"], ["letter", "D"]]));
    // decorative: the word is read from its own text, never from the tile
    expect(document.querySelectorAll("[data-slot=word-tile][aria-hidden=true]")).toHaveLength(2);
  });

  it("offers the Pares game only from three words", async () => {
    await learnWord(entry("cat", "iring", "easy"), null);
    await learnWord(entry("dog", "ido", "easy"), null);
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(2));
    expect(screen.queryByRole("link", { name: "Maglaro tayo ng Pares" })).toBeNull();
    cleanup();
    await learnWord(entry("sun", "adlaw", "easy"), null);
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByTestId("word-row")).toHaveLength(3));
    expect(screen.getByRole("link", { name: "Maglaro tayo ng Pares" }).getAttribute("href")).toBe("/play");
  });

  it("the empty state keeps Scan as a paper button, not the orange one", async () => {
    render(<VocabularyScreen />);
    const empty = await screen.findByTestId("words-empty");
    expect(within(empty).getByRole("link", { name: "Mag-scan" }).getAttribute("data-variant")).toBe("secondary");
    expect(empty.querySelector("[data-art=empty-words]")).toBeTruthy();
  });
});
