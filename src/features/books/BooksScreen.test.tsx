import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => "/books", useRouter: () => ({ push, replace: vi.fn() }) }));
let saved: { bookId: string | null }[] | null = [];
vi.mock("@/hooks/useSavedWords", () => ({ useSavedWords: () => saved }));
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import BooksScreen from "./BooksScreen";
import { bookStatus } from "./status";
import { defaultProgress, useProgress } from "@/stores/progress";
import { defaultSettings, useSettings } from "@/stores/settings";

beforeEach(() => {
  useSettings.setState({ ...defaultSettings });
  useProgress.setState({ ...defaultProgress, bookProgress: { fox: 100, star: 40 } });
});
afterEach(cleanup);

describe("bookStatus", () => {
  it("maps progress to new / progress / done", () => {
    expect(bookStatus(0)).toBe("new");
    expect(bookStatus(1)).toBe("progress");
    expect(bookStatus(99)).toBe("progress");
    expect(bookStatus(100)).toBe("done");
  });
});

describe("BooksScreen", () => {
  it("renders six books as links to /read/[id] with a plain-text status each", () => {
    render(<BooksScreen />);
    const links = within(screen.getByRole("list", { name: "Mga libro" })).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/read/fox", "/read/star", "/read/pedro", "/read/rainbow", "/read/turtle", "/read/market"]);
    expect(within(links[0]).getByText("Tapos")).toBeTruthy();
    expect(within(links[1]).getByText("Padayon")).toBeTruthy();
    expect(within(links[2]).getByText("Bag-o")).toBeTruthy();
    expect(links[1].textContent).toContain("Padayon");
  });

  it("shows the real saved-word count per book", () => {
    saved = [{ bookId: "fox" }, { bookId: "fox" }, { bookId: "star" }, { bookId: null }];
    render(<BooksScreen />);
    const links = within(screen.getByRole("list", { name: "Mga libro" })).getAllByRole("link");
    expect(within(links[0]).getByText("2 ka pulong")).toBeTruthy();
    expect(within(links[1]).getByText("1 ka pulong")).toBeTruthy();
    expect(within(links[2]).getByText("0 ka pulong")).toBeTruthy();
    saved = [];
  });

  it("counts finished books in the subtitle and uses Tagalog when set", () => {
    useSettings.setState({ language: "tagalog" });
    render(<BooksScreen />);
    expect(screen.getByText("1 aklat na ang natapos mo.")).toBeTruthy();
    expect(screen.getAllByText("Tuloy").length).toBe(1);
  });
});

describe("BooksScreen cover labels and opening", () => {
  it("shows every title in the cover label (no blank plate), two columns on a phone", () => {
    render(<BooksScreen />);
    const list = screen.getByRole("list", { name: "Mga libro" });
    expect(list.className).toContain("grid-cols-2");
    for (const a of within(list).getAllByRole("link")) {
      const label = a.querySelector("[data-jacket] span.font-heading");
      expect(label?.textContent?.trim().length).toBeGreaterThan(3);
      expect(label?.className).not.toContain("hidden");
    }
  });

  it("opens the book with the reduced-motion path at once (no matchMedia means no motion)", () => {
    push.mockClear();
    render(<BooksScreen />);
    const first = within(screen.getByRole("list", { name: "Mga libro" })).getAllByRole("link")[0];
    fireEvent.click(first);
    expect(push).toHaveBeenCalledWith("/read/fox");
  });

  it("leaves modified clicks to the browser", () => {
    push.mockClear();
    render(<BooksScreen />);
    const first = within(screen.getByRole("list", { name: "Mga libro" })).getAllByRole("link")[0];
    fireEvent.click(first, { metaKey: true });
    expect(push).not.toHaveBeenCalled();
  });
});
