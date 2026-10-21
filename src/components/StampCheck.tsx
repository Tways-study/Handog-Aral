import { useId } from "react";
import { stampTilt } from "@/components/StampStar";
import { cn } from "@/lib/utils";

interface StampCheckProps {
  size?: number;
  seed?: number;
  /** Accessible name. The stamp is decorative (aria-hidden) when omitted. */
  label?: string;
  className?: string;
}

/**
 * A teacher's rubber-stamped check mark in the success (kangkong) colour: double ring, heavy
 * check, rough ink-bleed edge. Same treatment as StampStar so the two read as one set.
 */
export default function StampCheck({ size = 28, seed = 0, label, className }: StampCheckProps) {
  const filterId = `bleed-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      data-slot="stamp-check"
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("shrink-0 text-success", className)}
      style={{ transform: `rotate(${stampTilt(seed + 1)}deg)` }}
    >
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={(Math.abs(seed) % 9) + 5} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="29" strokeWidth="2.6" />
        <circle cx="32" cy="32" r="24.5" strokeWidth="1.2" />
        <path d="M17.5 33.5 27.5 43.5 47 21" strokeWidth="7" />
      </g>
    </svg>
  );
}
