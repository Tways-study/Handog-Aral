import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import WordPanel from "./WordPanel";
import type { ResolvedExplanation } from "@/shared/schemas";

const entry = (over: Partial<ResolvedExplanation> = {}): ResolvedExplanation =>
  ({
    word: "enormous",
    phonetic: "/eh-NOR-mus/",
    english: "Very, very big.",
    translation: "Daku gid-gid",
    emoji: "",
    difficulty: "medium",
    example: "The enormous fox ran.",
    source: "curated",
    language: "tagalog",
    ...over,
  }) as ResolvedExplanation;

const noop = () => {};
const panel = (e: ResolvedExplanation, extra: { saved?: boolean; pending?: boolean } = {}) =>
  render(<WordPanel entry={e} saved={extra.saved ?? false} pending={extra.pending} onSave={noop} onRemove={noop} onSpeak={vi.fn()} />);
const hasReserve = (c: HTMLElement) => c.innerHTML.includes("min-h-[7rem]");

afterEach(cleanup);

describe("WordPanel", () => {
  it("sizes to content once settled: no min-height reserves, the example block carries the dashed rule", () => {
    const { container } = panel(entry());
    expect(hasReserve(container)).toBe(false);
    expect(container.innerHTML).not.toContain("min-h-[4.5rem]");
    expect(container.innerHTML).not.toContain("min-h-[4.75rem]");
    expect(container.innerHTML).toContain("border-dashed");
  });

  it("renders no dashed rule or example block when there is no example", () => {
    const { container } = panel(entry({ example: undefined }));
    expect(container.innerHTML).not.toContain("border-dashed");
  });

  it("keeps the reserves while pending or while the entry is offline (an upgrade can still land)", () => {
    const off = panel(entry({ source: "offline", example: undefined }));
    expect(hasReserve(off.container)).toBe(true);
    expect(off.container.innerHTML).toContain("min-h-[4.5rem]");
    expect(off.container.innerHTML).toContain("min-h-[4.75rem]");
    cleanup();
    const pend = panel(entry({ translation: "" }), { pending: true });
    expect(hasReserve(pend.container)).toBe(true);
  });

  it("does not hold the reserve for a pending lookup that resolves to a settled entry", () => {
    const placeholder = entry({ source: "offline", translation: "", english: "", phonetic: "", example: undefined });
    const { container, rerender } = panel(placeholder, { pending: true });
    expect(hasReserve(container)).toBe(true);
    rerender(<WordPanel entry={entry({ source: "curated" })} saved={false} onSave={noop} onRemove={noop} onSpeak={noop} />);
    expect(hasReserve(container)).toBe(false);
  });

  it("keeps the reserve after an offline entry upgrades in place, so the panel never shrinks", () => {
    const off = entry({ source: "offline", example: undefined });
    const { container, rerender } = panel(off);
    rerender(<WordPanel entry={entry({ source: "ai" })} saved={false} onSave={noop} onRemove={noop} onSpeak={noop} />);
    expect(hasReserve(container)).toBe(true);
    // a different word that never was upgradable settles to content size
    rerender(<WordPanel entry={entry({ word: "forest", source: "curated" })} saved={false} onSave={noop} onRemove={noop} onSpeak={noop} />);
    expect(hasReserve(container)).toBe(false);
  });

  it("hides a placeholder or empty phonetic and an empty English line", () => {
    const { container } = panel(entry({ phonetic: "/enormous/", english: "" }));
    expect(screen.queryByText("/enormous/")).toBeNull();
    expect(screen.queryByText("Sa English")).toBeNull();
    expect(container.querySelector("p.text-base")).toBeNull();
    cleanup();
    panel(entry());
    expect(screen.getByText("/eh-NOR-mus/")).toBeTruthy();
  });

  it("unsaved I-save is the primary; saved settles to a neutral secondary with a stamped check and a star", () => {
    panel(entry());
    expect(screen.getByRole("button", { name: "I-save" }).getAttribute("data-variant")).toBe("default");
    expect(document.querySelector("[data-slot=stamp-star]")).toBeNull();
    cleanup();
    panel(entry(), { saved: true });
    const saved = screen.getByRole("button", { name: "Naka-save na" });
    expect(saved.getAttribute("data-variant")).toBe("secondary");
    expect(saved.getAttribute("aria-pressed")).toBe("true");
    expect(saved.querySelector("[data-slot=stamp-check]")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Nakakuha ka ng bituin" })).toBeTruthy();
  });
});

describe("WordPanel first-tap emphasis", () => {
  it("marks the home-language well only when emphasised", () => {
    const { container, rerender } = render(<WordPanel entry={entry()} saved={false} onSave={noop} onRemove={noop} onSpeak={vi.fn()} />);
    expect(container.querySelector("[data-slot=home-well]")?.getAttribute("data-emphasis")).toBeNull();
    rerender(<WordPanel entry={entry()} saved={false} emphasize onSave={noop} onRemove={noop} onSpeak={vi.fn()} />);
    expect(container.querySelector("[data-slot=home-well]")?.getAttribute("data-emphasis")).toBe("true");
  });
});
