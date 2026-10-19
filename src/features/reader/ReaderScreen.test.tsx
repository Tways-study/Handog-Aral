import "fake-indexeddb/auto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ResolvedExplanation } from "@/shared/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@/lib/tts", () => ({ speak: vi.fn(() => Promise.resolve()), stop: vi.fn(() => Promise.resolve()), isSpeaking: () => false }));
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
    language: "hiligaynon",
  };
  return { ...actual, explain: vi.fn(() => Promise.resolve(e)) };
});

import ReaderScreen from "./ReaderScreen";

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
    expect(screen.getByText("Pindota ang pulong")).toBeTruthy();
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
