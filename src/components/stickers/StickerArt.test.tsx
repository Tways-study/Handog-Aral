import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StickerArt from "./StickerArt";
import { STICKER_IDS } from "@/lib/stickers/ids";

afterEach(cleanup);

describe("StickerArt", () => {
  for (const id of STICKER_IDS)
    it(`draws ${id} unlocked and locked, decoratively`, () => {
      const open = render(<StickerArt id={id} />).container.querySelector("svg")!;
      expect(open.getAttribute("aria-hidden")).toBe("true");
      expect(open.getAttribute("viewBox")).toBe("0 0 96 96");
      expect(open.getAttribute("data-locked")).toBe("false");
      expect(open.querySelectorAll("path,rect,circle,ellipse").length).toBeGreaterThan(8);
      cleanup();
      const locked = render(<StickerArt id={id} locked />).container.querySelector("svg")!;
      expect(locked.getAttribute("data-locked")).toBe("true");
      expect(locked.querySelector("[data-washed=true]")?.querySelectorAll("path,rect,circle,ellipse").length).toBeGreaterThan(8);
      expect(locked.querySelector("svg.lucide-lock")).toBeTruthy();
    });

  it("is labelled only when titled and honours size", () => {
    render(<StickerArt id="streak-3" size={64} title="Three day streak" />);
    const el = screen.getByRole("img", { name: "Three day streak" });
    expect(el.getAttribute("width")).toBe("64");
  });
});
