import { memo } from "react";
import { cn } from "@/lib/utils";
import OwlGroup from "@/components/art/OwlGroup";

import type { OwlOutfit } from "@/stores/settings";

export type MascotMood = "idle" | "cheer" | "think" | "wave" | "sleep";

interface MascotProps {
  mood?: MascotMood;
  /** Accessory the owl wears: round glasses, a scholar cap with a tassel, or a bow tie. */
  outfit?: OwlOutfit;
  /** Pixel size (number) or any CSS length. */
  size?: number | string;
  className?: string;
  /** Pass a label only when the owl carries meaning; it is decorative (aria-hidden) by default. */
  title?: string;
}

/**
 * The Handog owl, kawaii flat gouache: chubby, huge shiny eyes, rosy cheeks, tummy scallops.
 * Static (no animation inside); every part is a `data-part` group so GSAP can target it. The 3D
 * owl falls back to this one.
 */
function Mascot({ mood = "idle", outfit = "none", size = 96, className, title }: MascotProps) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 120 120"
      width={px}
      height={px}
      className={cn("inline-block shrink-0 select-none", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
      data-mood={mood}
      data-outfit={outfit}
    >
      <OwlGroup mood={mood} outfit={outfit} />
    </svg>
  );
}

// The SVG is a few hundred nodes: skip re-rendering it when only the owl's loading state changes around it.
export default memo(Mascot);
