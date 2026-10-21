import { useId } from "react";
import { cn } from "@/lib/utils";

/** Deterministic tilt per instance (3-6 degrees, alternating sides) so SSR and CSR agree. */
const TILTS = [-4, 5, -3, 6, -5, 3.5] as const;
export const stampTilt = (seed: number): number => TILTS[Math.abs(Math.trunc(seed)) % TILTS.length];

interface StampStarProps {
  /** Pixel size of the square stamp. */
  size?: number;
  /** Picks the tilt and the ink-bleed noise; same seed, same stamp. */
  seed?: number;
  /** Accessible name. The stamp is decorative (aria-hidden) when omitted. */
  label?: string;
  className?: string;
}

/**
 * A rubber-stamp star: double ring, sunrise star with an ink outline, and a rough bleeding edge
 * from an feTurbulence + feDisplacementMap filter. Authored, not a CSS imitation. Static; the
 * caller animates a wrapper (stampIn) when it lands.
 */
export default function StampStar({ size = 28, seed = 0, label, className }: StampStarProps) {
  const filterId = `bleed-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      data-slot="stamp-star"
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("shrink-0", className)}
      style={{ transform: `rotate(${stampTilt(seed)}deg)` }}
    >
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(Math.abs(seed) % 9) + 2} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <circle cx="32" cy="32" r="29" fill="none" className="stroke-ink" strokeWidth="2.6" />
        <circle cx="32" cy="32" r="24.5" fill="none" className="stroke-ink" strokeWidth="1.2" />
        <path
          d="M32 12.5 37.6 25.6 51.8 26.8 41 36.1 44.3 50 32 42.6 19.7 50 23 36.1 12.2 26.8 26.4 25.6Z"
          className="fill-sunrise stroke-ink"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
