import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EmptyQuiz, EmptyShelf, EmptyWords, NotFoundArt, OfflineArt, PeekOverNotebook } from "@/components/art";

afterEach(cleanup);

const ALL = { EmptyShelf, EmptyWords, EmptyQuiz, OfflineArt, NotFoundArt, PeekOverNotebook };

describe("art components", () => {
  for (const [name, Art] of Object.entries(ALL))
    it(`${name} is decorative by default, labelled with a title, and sized by prop`, () => {
      const { container } = render(<Art size={120} className="x" />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("width")).toBe("120px");
      expect(svg.getAttribute("class")).toContain("x");
      cleanup();
      render(<Art title="hello" />);
      expect(screen.getByRole("img", { name: "hello" })).toBeTruthy();
    });
});

describe("CardBack", () => {
  it("is a decorative owl-face emblem", async () => {
    const { CardBack } = await import("@/components/art");
    const { container } = render(<CardBack className="w-10" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("data-art")).toBe("card-back");
  });
});
