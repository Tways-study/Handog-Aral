/** A word's on-screen box, tagged with its token index. Viewport coordinates, like getBoundingClientRect. */
export interface WordRect {
  index: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** How far (px) from a word a tap may land and still choose it. */
export const NEAREST_WORD_RADIUS = 24;

/** Distance from a point to a rectangle (0 when inside). */
export function distanceToRect(x: number, y: number, r: Pick<WordRect, "left" | "top" | "right" | "bottom">): number {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

/**
 * The word nearest to a tap, within `radius` px of it, or null. A tap inside a box always wins; ties go to
 * the box whose centre is closer (so a tap between two touching words picks the nearer one).
 */
export function nearestWordIndex(rects: readonly WordRect[], x: number, y: number, radius = NEAREST_WORD_RADIUS): number | null {
  let best: { index: number; d: number; c: number } | null = null;
  for (const r of rects) {
    const d = distanceToRect(x, y, r);
    if (d > radius) continue;
    const c = Math.hypot((r.left + r.right) / 2 - x, (r.top + r.bottom) / 2 - y);
    if (!best || d < best.d || (d === best.d && c < best.c)) best = { index: r.index, d, c };
  }
  return best ? best.index : null;
}

/** Measures every word button under `root`. */
export function measureWords(root: ParentNode): WordRect[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-token-index]"), (el) => {
    const b = el.getBoundingClientRect();
    return { index: Number(el.dataset.tokenIndex), left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  });
}

/** Targets that handle their own taps; the surface hit test leaves them alone. */
export const INTERACTIVE_SELECTOR = "button, a, input, textarea, select, label, [role=button], [role=dialog]";

/**
 * Resolves a click on the reading surface to a token index, or null. Clicks on real controls (the word buttons
 * themselves, links, the rescan buttons) are left to those controls. Keyboard activation (clientX/Y both 0) is
 * never a surface tap. Runs on click, not pointer-down, so starting a scroll never opens a word.
 */
export function wordFromSurfaceClick(
  e: { target: EventTarget | null; clientX: number; clientY: number },
  root: ParentNode,
  radius = NEAREST_WORD_RADIUS,
): number | null {
  const target = e.target as Element | null;
  if (target && typeof target.closest === "function" && target.closest(INTERACTIVE_SELECTOR)) return null;
  if (e.clientX === 0 && e.clientY === 0) return null;
  return nearestWordIndex(measureWords(root), e.clientX, e.clientY, radius);
}
