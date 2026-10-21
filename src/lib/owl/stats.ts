/** Tiny render counters, read by the dev showcase's frame-time readout and by the e2e spec. */
export const owlStats = { frames: 0, lastDtMs: 0, avgDtMs: 0 };

export function recordOwlFrame(dtMs: number): void {
  owlStats.frames++;
  if (dtMs > 0) {
    owlStats.lastDtMs = dtMs;
    owlStats.avgDtMs = owlStats.avgDtMs ? owlStats.avgDtMs * 0.9 + dtMs * 0.1 : dtMs;
  }
  if (typeof window !== "undefined") (window as unknown as { __owlStats?: typeof owlStats }).__owlStats = owlStats;
}
