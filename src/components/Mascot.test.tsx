import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Mascot, { type MascotMood } from "./Mascot";

afterEach(cleanup);

const MOODS: MascotMood[] = ["idle", "cheer", "think", "wave", "sleep"];
const OUTFITS = ["none", "glasses", "cap", "bow"] as const;

describe("Mascot", () => {
  for (const mood of MOODS)
    for (const outfit of OUTFITS)
      it(`renders ${mood} / ${outfit} decoratively with its data attributes`, () => {
        const { container } = render(<Mascot mood={mood} outfit={outfit} />);
        const svg = container.querySelector("svg")!;
        expect(svg.getAttribute("aria-hidden")).toBe("true");
        expect(svg.getAttribute("role")).toBeNull();
        expect(svg.getAttribute("data-mood")).toBe(mood);
        expect(svg.getAttribute("data-outfit")).toBe(outfit);
        for (const part of ["body", "head", "beak", "wing-left", "wing-right", "eye-left", "eye-right"])
          expect(svg.querySelector(`[data-part="${part}"]`), part).toBeTruthy();
        expect(svg.querySelector("animate, animateTransform, style")).toBeNull();
        expect(Boolean(svg.querySelector(`[data-part="outfit-${outfit}"]`))).toBe(outfit !== "none");
      });

  it("exposes a name only when titled", () => {
    render(<Mascot title="Owl" />);
    expect(screen.getByRole("img", { name: "Owl" })).toBeTruthy();
  });
});
