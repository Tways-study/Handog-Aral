/** A reading-progress bar for shelf tiles: a plain width (no off-canvas sliver at 0%), reads as a progressbar when labelled. */
export default function ShelfBar({ pct, label }: { pct: number; label?: string }) {
  return (
    <div
      {...(label
        ? { role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct }
        : { "aria-hidden": true })}
      className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/15"
    >
      <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
    </div>
  );
}
