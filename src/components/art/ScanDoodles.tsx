import { useId } from "react";
import { OWL } from "@/components/art/OwlGroup";
import { cn } from "@/lib/utils";

interface DoodleProps {
  size?: number;
  className?: string;
}

interface LensProps extends DoodleProps {
  /** Two owl wing tips grip the lens, so an owl standing behind it looks like it is holding it up. */
  held?: boolean;
}

const INK = "var(--label-ink)";
const PAPER = "var(--label-paper)";

/**
 * Hand-drawn pad-paper doodles for the Scan start screen. Authored SVG with fixed pigment tokens (the label colours do
 * not flip in dark mode, so a doodle looks the same on a cream card and on a night one). Decorative: aria-hidden.
 */

/** A camera lens with a sunrise in the glass: the camera tile's hero graphic. */
export function LensDoodle({ size = 72, className, held = false }: LensProps) {
  const clip = `lens-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true" focusable="false" data-slot="lens-doodle" className={cn("shrink-0", className)}>
      <defs>
        <clipPath id={clip}>
          <circle cx="36" cy="36" r="17.5" />
        </clipPath>
      </defs>
      <circle cx="36" cy="37" r="33" fill={INK} opacity="0.35" />
      <circle cx="36" cy="36" r="32" fill={INK} stroke={PAPER} strokeWidth="3" />
      <circle cx="36" cy="36" r="24.5" fill="var(--mango)" stroke={INK} strokeWidth="3" />
      <circle cx="36" cy="36" r="19.5" fill={INK} />
      <g clipPath={`url(#${clip})`}>
        <rect x="14" y="14" width="44" height="44" fill="var(--marker)" />
        <circle cx="36" cy="44" r="10" fill="var(--sunrise)" stroke={INK} strokeWidth="2" />
        <path d="M36 27v-3M25.500 31l-2.200-2.200M46.500 31l2.200-2.200" stroke={INK} strokeWidth="2.200" strokeLinecap="round" />
        <rect x="14" y="44" width="44" height="14" fill={INK} />
        <path d="M14 44h44" stroke={INK} strokeWidth="2.400" />
      </g>
      <path d="M26.500 24.500c2.500-3.400 6.200-5 9.500-5" fill="none" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
      <circle cx="49.500" cy="46" r="2.200" fill={PAPER} />
      {held && (
        <g data-part="grip" fill={OWL.shade} stroke={OWL.contour} strokeWidth="2.600" strokeLinejoin="round">
          <ellipse cx="9" cy="47" rx="6.500" ry="10.500" transform="rotate(24 9 47)" />
          <ellipse cx="63" cy="47" rx="6.500" ry="10.500" transform="rotate(-24 63 47)" />
        </g>
      )}
    </svg>
  );
}

/** A little photo with a folded corner, a sun and two hills: "pick from the gallery". */
export function PhotoDoodle({ size = 56, className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" data-slot="photo-doodle" className={cn("shrink-0", className)} style={{ transform: "rotate(-6deg)" }}>
      <path d="M9 12.500c0-1.700 1.300-3 3-3h30l13 13v28.500c0 1.700-1.300 3-3 3H12c-1.700 0-3-1.300-3-3z" fill={PAPER} stroke={INK} strokeWidth="2.800" strokeLinejoin="round" />
      <path d="M42 9.500v10c0 1.700 1.300 3 3 3h10" fill="var(--paper-2)" stroke={INK} strokeWidth="2.800" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="23" cy="26" r="5" fill="var(--sunrise)" stroke={INK} strokeWidth="2.200" />
      <path d="M11 49l12-13 8 8 7-7 12 12" fill="var(--kangkong)" stroke={INK} strokeWidth="2.600" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** A fat yellow pencil with a pink eraser: "type or paste". */
export function PencilDoodle({ size = 56, className }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" data-slot="pencil-doodle" className={cn("shrink-0", className)}>
      <g transform="rotate(45 32 32)">
        <rect x="23" y="4" width="18" height="10" rx="3" fill="var(--gumamela)" stroke={INK} strokeWidth="2.800" />
        <rect x="23" y="14" width="18" height="5" fill={PAPER} stroke={INK} strokeWidth="2.400" />
        <rect x="23" y="19" width="18" height="26" fill="var(--mango)" stroke={INK} strokeWidth="2.800" />
        <path d="M30 22v20M34 22v20" stroke={INK} strokeWidth="1.600" strokeLinecap="round" opacity="0.5" />
        <path d="M23 45h18l-9 15z" fill="var(--marker)" stroke={INK} strokeWidth="2.800" strokeLinejoin="round" />
        <path d="M29.500 54.500h5L32 60z" fill={INK} />
      </g>
    </svg>
  );
}

/** Four rounded viewfinder corners: the camera tile's frame, so its big area reads as "aim here". */
export function ViewfinderDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-slot="viewfinder-doodle" className={cn("pointer-events-none", className)} fill="none">
      <path
        d="M0 16V6a6 6 0 0 1 6-6h10M84 0h10a6 6 0 0 1 6 6v10M100 84v10a6 6 0 0 1-6 6H84M16 100H6a6 6 0 0 1-6-6V84"
        stroke="currentColor"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
    </svg>
  );
}
