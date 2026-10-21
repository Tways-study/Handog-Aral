import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ArtProps {
  /** Width in px (or any CSS length); height follows the 4:3 box. */
  size?: number | string;
  className?: string;
  /** Pass a label only when the picture carries meaning; decorative (aria-hidden) by default. */
  title?: string;
}

/** The shared 160x120 canvas for empty-state and decoration art. */
export default function ArtSvg({ size = 160, className, title, name, children }: ArtProps & { name: string; children: ReactNode }) {
  const w = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 160 120"
      width={w}
      className={cn("inline-block h-auto shrink-0 select-none", className)}
      data-art={name}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
    >
      {children}
    </svg>
  );
}
