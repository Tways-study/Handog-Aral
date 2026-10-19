import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

let mockPath = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));
vi.mock("@/hooks/useOnlineStatus", () => ({ useOnlineStatus: () => ({ online: true }) }));

import AppShell, { isActive } from "./AppShell";

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
  it("renders both navs with the five destinations as links (hiligaynon labels)", () => {
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
    expect(within(bottom).getByText("Balay")).toBeTruthy();
    expect(within(bottom).getByText("Libro")).toBeTruthy();
    expect(within(bottom).getByText("Pulong")).toBeTruthy();
    expect(within(bottom).getByText("Pasulit")).toBeTruthy();
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
    expect(screen.getByText("Laktawan sa sulod").getAttribute("href")).toBe("#main");
  });
});
