import { C, Eye } from "@/components/art/parts";
import { cn } from "@/lib/utils";

/**
 * The back of a Pares card: a small owl face stamped like a notebook cover emblem. It carries no colour of its own
 * beyond the cream face and sunrise beak, so it sits on any jacket (the card back is the indigo jacket) in light and dark.
 */
export default function CardBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false" data-art="card-back" className={cn("inline-block h-auto select-none", className)}>
      <g stroke={C.contour} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 22 8 6l15 8Z" fill={C.cream} />
        <path d="M54 22 56 6 41 14Z" fill={C.cream} />
        <path d="M32 10c15 0 24 8 24 22s-9 20-24 20S8 46 8 32 17 10 32 10Z" fill={C.cream} />
        <circle cx={22} cy={30} r={9} fill={C.white} />
        <circle cx={42} cy={30} r={9} fill={C.white} />
        <path d="M29 38h6l-3 6Z" fill={C.sunrise} />
      </g>
      <Eye cx={22} cy={30} r={5} />
      <Eye cx={42} cy={30} r={5} />
      <circle cx={12} cy={40} r={3.2} fill={C.cheek} opacity={0.8} />
      <circle cx={52} cy={40} r={3.2} fill={C.cheek} opacity={0.8} />
    </svg>
  );
}
