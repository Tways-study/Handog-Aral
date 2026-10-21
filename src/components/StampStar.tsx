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
 * A rubber-stamp star: heavy ring, dotted inner ring, a chubby rounded sunrise star with an ink outline and a shine, and a rough bleeding edge
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
        <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed={(Math.abs(seed) % 9) + 2} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <circle cx="32" cy="32" r="28.5" fill="none" className="stroke-ink" strokeWidth="3.4" />
        <circle cx="32" cy="32" r="23" fill="none" className="stroke-ink" strokeWidth="1.6" strokeDasharray="0.1 5.2" strokeLinecap="round" />
        <path
          d="M32 15.5 36.8 26 48.5 27.2 39.8 35 42.4 46.5 32 40.6 21.6 46.5 24.2 35 15.5 27.2 27.2 26Z"
          className="fill-sunrise stroke-ink"
          strokeWidth="3.4"
          strokeLinejoin="round"
          transform="translate(-6.400 -6.600) scale(1.200)"
        />
        <path d="M22 26.500 28.500 20.500" stroke="#FFD49A" strokeWidth="2.800" strokeLinecap="round" />
      </g>
    </svg>
  );
}
