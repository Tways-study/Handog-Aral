"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

export type StampLevel = "easy" | "medium" | "hard";

const COLOR: Record<StampLevel, string> = {
  easy: "text-stamp-easy",
  medium: "text-stamp-medium",
  hard: "text-stamp-hard",
};

/** Shape carries the meaning (circle = easy, square = medium, triangle = hard); colour only reinforces it. */
export function StampShape({ level, className }: { level: StampLevel; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-[22px] shrink-0", COLOR[level], className)}
    >
      {level === "easy" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </>
      )}
      {level === "medium" && (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5.5" />
          <rect x="8.5" y="8.5" width="7" height="7" rx="2.5" />
        </>
      )}
      {level === "hard" && (
        <>
          <path d="M12 3.5 21 19.500H3z" strokeWidth={3.2} />
          <path d="M12 11.5 14.5 16h-5z" />
        </>
      )}
    </svg>
  );
}

interface DifficultyStampProps {
  level: StampLevel;
  /** Show the word next to the shape. When false the shape is exposed to assistive tech with the label. */
  showLabel?: boolean;
  /** Override the translated label. */
  label?: string;
  className?: string;
}

export default function DifficultyStamp({ level, showLabel = true, label, className }: DifficultyStampProps) {
  const t = useT();
  const text = label ?? t.difficulty[level];
  if (!showLabel) {
    return (
      <span role="img" aria-label={text} className={cn("inline-grid size-[26px] place-items-center", className)}>
        <StampShape level={level} />
      </span>
    );
  }
  return (
    <span
      data-slot="difficulty-stamp"
      data-level={level}
      className={cn("inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground", className)}
    >
      <StampShape level={level} />
      {text}
    </span>
  );
}
