"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import StampStar from "@/components/StampStar";
import { stampLand } from "@/lib/motionReader";

/** Where the big stamp lands, in viewport coordinates (the saved word's box). */
export interface StampSpot {
  key: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export const STAMP_SIZE = 96;
/** How long the stamp stays on the paper before it lifts away, in ms. */
export const STAMP_HOLD_MS = 1300;

/**
 * The rubber stamp that lands BIG on the page over the word the child just saved. A portal above the sheet's scrim, it
 * ignores pointers and is hidden from assistive tech (the Save button announces the result). Under reduced motion it
 * simply appears settled, then lifts away.
 */
export default function SaveStamp({ spot, onDone }: { spot: StampSpot | null; onDone: () => void }) {
  if (!spot || typeof document === "undefined") return null;
  // Keyed, so every save mounts a fresh stamp that starts un-lifted.
  return createPortal(<LandedStamp key={spot.key} spot={spot} onDone={onDone} />, document.body);
}

function LandedStamp({ spot, onDone }: { spot: StampSpot; onDone: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const stop = stampLand(ref.current);
    const lift = setTimeout(() => setLeaving(true), STAMP_HOLD_MS - 250);
    const done = setTimeout(onDone, STAMP_HOLD_MS);
    return () => {
      stop();
      clearTimeout(lift);
      clearTimeout(done);
    };
  }, [onDone]);

  const cx = spot.left + spot.width / 2;
  const cy = spot.top + spot.height / 2;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="save-stamp"
      className="pointer-events-none fixed z-[70] grid place-items-center transition-opacity duration-200"
      style={{ left: cx - STAMP_SIZE / 2, top: cy - STAMP_SIZE / 2, width: STAMP_SIZE, height: STAMP_SIZE, opacity: leaving ? 0 : 1 }}
    >
      <StampStar size={STAMP_SIZE} seed={spot.key} />
    </span>
  );
}
