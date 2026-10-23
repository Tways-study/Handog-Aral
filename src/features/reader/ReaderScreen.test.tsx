import "fake-indexeddb/auto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ResolvedExplanation } from "@/shared/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@/lib/tts", () => ({ speechLang: () => "en-US", speak: vi.fn(() => Promise.resolve()), stop: vi.fn(() => Promise.resolve()), isSpeaking: () => false }));
vi.mock("@/lib/dictionary/explain", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dictionary/explain")>("@/lib/dictionary/explain");
  const e: ResolvedExplanation = {
    word: "enormous",
    phonetic: "/ih-NOR-mus/",
    english: "Very, very big.",
    translation: "Daku gid-gid.",
    emoji: "",
    difficulty: "hard",
    example: "The enormous tree gave shade.",
    source: "curated",
    language: "tagalog",
  };
  return { ...actual, explain: vi.fn(() => Promise.resolve(e)) };
});

import ReaderScreen from "./ReaderScreen";
import { useCelebrations } from "@/components/celebration/queue";
import { getDb } from "@/stores/db";
import { useMoments } from "@/stores/moments";
import { useProgress } from "@/stores/progress";
import { useRewards } from "@/stores/rewards";

function setDesktop(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe("ReaderScreen layouts", () => {
  it("shows the empty docked panel with the prompt at >= lg", async () => {
    setDesktop(true);
    render(<ReaderScreen bookId="fox" />);
    expect(screen.getByRole("complementary")).toBeTruthy();
    expect(screen.getByText("I-tap ang salita")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getAllByRole("button", { name: "enormous" })[0] ?? screen.getAllByRole("button", { name: "forest" })[0]));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await screen.findByText("Daku gid-gid.")).toBeTruthy();
    expect(screen.getByRole("complementary").textContent).toContain("Daku gid-gid.");
  });

  it("opens the explanation in a Drawer dialog below lg and marks the tapped word", async () => {
    setDesktop(false);
    render(<ReaderScreen bookId="fox" />);
    expect(screen.queryByRole("complementary")).toBeNull();
    const word = screen.getAllByRole("button", { name: "forest" })[0];
    await act(async () => fireEvent.click(word));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Daku gid-gid.");
    expect(word.getAttribute("data-state")).toBe("tapped");
  });
});

describe("ReaderScreen moments", () => {
  beforeEach(async () => {
    await getDb()?.words.clear();
    useMoments.getState().reset();
    useRewards.getState().reset();
    useProgress.getState().resetAll();
    useCelebrations.getState().clear();
  });

  it("the first word ever tapped: the owl says it on the sheet, the well glows, and a later visit gets nothing", async () => {
    setDesktop(false);
    const { unmount } = render(<ReaderScreen bookId="fox" />);
    await act(async () => fireEvent.click(screen.getAllByRole("button", { name: "forest" })[0]));
    await screen.findByRole("dialog");
    expect(screen.getByText("Nabasa mo na!")).toBeTruthy();
    expect(document.querySelector("[data-slot=home-well]")?.getAttribute("data-emphasis")).toBe("true");
    expect(useMoments.getState().firstTap).toBe(true);
    unmount();
    render(<ReaderScreen bookId="fox" />);
    await act(async () => fireEvent.click(screen.getAllByRole("button", { name: "forest" })[0]));
    await screen.findByRole("dialog");
    expect(screen.queryByText("Nabasa mo na!")).toBeNull();
    expect(document.querySelector("[data-slot=home-well]")?.getAttribute("data-emphasis")).toBeNull();
  });

  it("a tap near a word (not on it) chooses the nearest word", async () => {
    setDesktop(true);
    const { container } = render(<ReaderScreen bookId="fox" />);
    const forest = screen.getAllByRole("button", { name: "forest" })[0];
    forest.getBoundingClientRect = () => ({ left: 100, top: 100, right: 160, bottom: 136, width: 60, height: 36, x: 100, y: 100, toJSON: () => ({}) });
    // every other word is far away
    for (const b of container.querySelectorAll<HTMLElement>("[data-token-index]")) {
      if (b !== forest) b.getBoundingClientRect = () => ({ left: 900, top: 900, right: 950, bottom: 936, width: 50, height: 36, x: 900, y: 900, toJSON: () => ({}) });
    }
    const surface = container.querySelector("[data-slot=reading-surface]")!;
    await act(async () => fireEvent.click(surface, { clientX: 130, clientY: 150 })); // 14 px under the word
    expect(await screen.findByText("Daku gid-gid.")).toBeTruthy();
    expect(forest.getAttribute("data-state")).toBe("tapped");
    // far from every word: nothing happens
    cleanup();
    setDesktop(true);
    const second = render(<ReaderScreen bookId="fox" />);
    for (const b of second.container.querySelectorAll<HTMLElement>("[data-token-index]")) {
      b.getBoundingClientRect = () => ({ left: 900, top: 900, right: 950, bottom: 936, width: 50, height: 36, x: 900, y: 900, toJSON: () => ({}) });
    }
    await act(async () => fireEvent.click(second.container.querySelector("[data-slot=reading-surface]")!, { clientX: 20, clientY: 20 }));
    expect(second.container.querySelector("[data-slot=word-panel]")).toBeNull();
  });

  it("opening a bundled book is reported to the rewards engine", () => {
    setDesktop(true);
    render(<ReaderScreen bookId="fox" />);
    expect(useRewards.getState().flags.openedBooks).toEqual(["fox"]);
  });

  it("saving: the stamp lands, the Pulong tab is told to pop, and only then the rewards engine hears about it", async () => {
    setDesktop(true);
    const pops: string[] = [];
    const onPop = (e: Event) => pops.push(String((e as CustomEvent).detail));
    window.addEventListener("handog:pop-tab", onPop);
    try {
      render(<ReaderScreen bookId="fox" />);
      await act(async () => fireEvent.click(screen.getAllByRole("button", { name: "forest" })[0]));
      const save = await screen.findByRole("button", { name: "I-save" });
      await act(async () => fireEvent.click(save));
      await waitFor(() => expect(document.querySelector("[data-slot=save-stamp]")).toBeTruthy());
      // the stamp is up, but no sticker yet (it would land on top of the stamp)
      expect(useRewards.getState().earned["first-word"]).toBeUndefined();
      expect(useMoments.getState().firstSave).toBe(true);
      await waitFor(() => expect(pops).toEqual(["words"]), { timeout: 2000 });
      await waitFor(() => expect(useRewards.getState().earned["first-word"]).toBeDefined(), { timeout: 3000 });
      // the real difficulty ("hard") went with the event
      expect(useRewards.getState().earned["hard-word"]).toBeDefined();
      expect(useProgress.getState().bookProgress.fox).toBeGreaterThan(0);
    } finally {
      window.removeEventListener("handog:pop-tab", onPop);
    }
  });
});
