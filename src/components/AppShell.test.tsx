import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";

let mockPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => ({ online: true }) }));

import { gsap } from "gsap";
import AppShell, { isActive, NAV_ITEMS, POP_TAB_EVENT } from "./AppShell";

function renderAt(path: string) {
  mockPath = path;
  return render(
    <AppShell>
      <h1>content</h1>
    </AppShell>,
  );
}

afterEach(cleanup);

describe("AppShell navigation", () => {
  it("renders both navs with the five destinations as links (tagalog labels)", () => {
    renderAt("/");
    const navs = screen.getAllByRole("navigation", { hidden: true });
    expect(navs).toHaveLength(2); // bottom nav (< lg) and rail (>= lg)
    for (const nav of navs) {
      const hrefs = within(nav).getAllByRole("link", { hidden: true }).map((a) => a.getAttribute("href"));
      for (const h of ["/", "/books", "/scan", "/words", "/quiz", "/settings"].filter((x) => nav.getAttribute("data-slot") === "nav-rail" || x !== "/settings")) {
        expect(hrefs).toContain(h);
      }
    }
    const bottom = navs.find((n) => n.getAttribute("data-slot") === "bottom-nav")!;
    expect(within(bottom).getByText("Tahanan")).toBeTruthy();
    expect(within(bottom).getByText("Aklat")).toBeTruthy();
    expect(within(bottom).getByText("Salita")).toBeTruthy();
    expect(within(bottom).getByText("Pagsusulit")).toBeTruthy();
  });

  it("marks the current destination with aria-current and only that one", () => {
    renderAt("/words");
    for (const nav of screen.getAllByRole("navigation", { hidden: true })) {
      const current = within(nav).getAllByRole("link", { hidden: true }).filter((a) => a.getAttribute("aria-current") === "page");
      expect(current).toHaveLength(1);
      expect(current[0].getAttribute("href")).toBe("/words");
    }
  });

  it("labels the icon-only Scan link and the Settings link", () => {
    renderAt("/");
    const scans = screen.getAllByRole("link", { name: "I-scan", hidden: true });
    expect(scans).toHaveLength(2);
    for (const s of scans) expect(s.getAttribute("href")).toBe("/scan");
    expect(screen.getAllByRole("link", { name: "Settings", hidden: true }).length).toBeGreaterThan(0);
  });

  it("treats the reader as part of Libro, and Home as exact-match only", () => {
    expect(isActive("/read/fox", { href: "/books", also: ["/read"] })).toBe(true);
    expect(isActive("/books/", { href: "/books" })).toBe(true);
    expect(isActive("/books", { href: "/" })).toBe(false);
    expect(isActive("/", { href: "/" })).toBe(true);
  });

  it("has no navigation on the welcome screen, but keeps main and the skip link", () => {
    renderAt("/welcome");
    expect(screen.queryAllByRole("navigation", { hidden: true })).toHaveLength(0);
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByText("Lumaktaw sa nilalaman").getAttribute("href")).toBe("#main");
  });
});

describe("AppShell extra routes and tab pop", () => {
  it("lights Salita (and only Salita) for /play and /stickers, so no tab looks wrong", () => {
    const words = NAV_ITEMS.find((i) => i.id === "words")!;
    expect(isActive("/play", words)).toBe(true);
    expect(isActive("/stickers", words)).toBe(true);
    expect(isActive("/words", words)).toBe(true);
    for (const path of ["/play", "/stickers"]) {
      const others = NAV_ITEMS.filter((i) => i.id !== "words");
      expect(others.some((i) => isActive(path, i))).toBe(false);
    }
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("pops the named tab icon once on handog:pop-tab, and ignores unknown names", () => {
    const impl = (query: string) => ({ matches: query.includes("no-preference"), media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false });
    vi.stubGlobal("matchMedia", impl);
    window.matchMedia = impl as unknown as typeof window.matchMedia;
    renderAt("/");
    const icons = document.querySelectorAll('[data-tab-icon="words"]');
    expect(icons.length).toBe(2);
    act(() => void window.dispatchEvent(new CustomEvent(POP_TAB_EVENT, { detail: "bogus" })));
    expect(gsap.getTweensOf(icons[0])).toHaveLength(0);
    act(() => void window.dispatchEvent(new CustomEvent(POP_TAB_EVENT, { detail: "words" })));
    expect(gsap.getTweensOf(icons[0]).length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});
