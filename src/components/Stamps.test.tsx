import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StampStar, { stampTilt } from "./StampStar";
import StampCheck from "./StampCheck";

afterEach(cleanup);

describe("stamps", () => {
  it("are decorative without a label", () => {
    const { container } = render(
      <>
        <StampStar />
        <StampCheck />
      </>,
    );
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("role")).toBeNull();
    }
  });

  it("expose a text alternative when labelled", () => {
    render(
      <>
        <StampStar label="Star earned" />
        <StampCheck label="Correct" />
      </>,
    );
    expect(screen.getByRole("img", { name: "Star earned" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Correct" })).toBeTruthy();
  });

  it("carry an ink-bleed filter and a deterministic 3-6 degree tilt", () => {
    const { container } = render(<StampStar seed={3} />);
    expect(container.querySelector("feTurbulence")).toBeTruthy();
    expect(container.querySelector("feDisplacementMap")).toBeTruthy();
    expect(stampTilt(3)).toBe(stampTilt(3));
    for (let i = 0; i < 12; i++) {
      const a = Math.abs(stampTilt(i));
      expect(a).toBeGreaterThanOrEqual(3);
      expect(a).toBeLessThanOrEqual(6);
    }
    expect(container.querySelector("svg")!.getAttribute("style")).toContain(`rotate(${stampTilt(3)}deg)`);
  });

  it("uses the success token for the check", () => {
    const { container } = render(<StampCheck />);
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("text-success");
  });
});
