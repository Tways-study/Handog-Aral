import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StickerId } from "@/lib/stickers/ids";

export interface StickerArtProps {
  id: StickerId;
  /** Locked stickers render as a dashed silhouette (no colour, no detail) so the collection shows what is left to find. */
  locked?: boolean;
  /** CSS pixels, square. */
  size?: number;
  className?: string;
  /** Pass a label only when the sticker carries meaning on its own; decorative (aria-hidden) by default. */
  title?: string;
}

/**
 * One authored SVG sticker per id. CONTRACT (fixed): the props above. PLACEHOLDER body: the art track
 * replaces it with the real illustrations (die-cut, white border, subtle shine, owl peeking where it fits).
 */
export default function StickerArt({ locked = false, size = 96, className, title }: StickerArtProps) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full border-2", locked ? "border-dashed border-line text-ink-2" : "border-line bg-card text-sunrise", className)}
      style={{ width: size, height: size }}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <Star style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}
