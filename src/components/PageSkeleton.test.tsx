import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HomeSkeleton, ListSkeleton } from "./PageSkeleton";

afterEach(cleanup);

describe("PageSkeleton", () => {
  it("HomeSkeleton announces one busy status and draws only static bars", () => {
    const { container } = render(<HomeSkeleton label="Ginahanda" />);
    expect(screen.getAllByRole("status", { name: "Ginahanda" }).length).toBeGreaterThan(0);
    expect(container.querySelector('[data-slot="home-skeleton"]')?.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(5);
    expect(container.querySelector("animate, animateTransform")).toBeNull();
  });

  it("ListSkeleton shows the ruled rows", () => {
    const { container } = render(<ListSkeleton label="Ginahanda" />);
    expect(container.querySelector('[data-slot="pad-skeleton"]')).toBeTruthy();
  });
});
