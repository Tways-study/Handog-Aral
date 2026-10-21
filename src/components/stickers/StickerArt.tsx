import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StickerId } from "@/lib/stickers/ids";
import { STICKER_LOOK, Subject } from "@/components/stickers/subjects";

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

type DieCutProps = Omit<React.SVGProps<SVGCircleElement & SVGRectElement>, "ref" | "r" | "x" | "y" | "rx">;

function DieCut({ shape, inset = 0, ...props }: { shape: "circle" | "card"; inset?: number } & DieCutProps) {
  return shape === "circle" ? (
    <circle cx={48} cy={48} r={43 - inset} {...props} />
  ) : (
    <rect x={5 + inset} y={5 + inset} width={86 - inset * 2} height={86 - inset * 2} rx={24 - inset} {...props} />
  );
}

/**
 * One authored SVG sticker per id: a die-cut with a thick white border, soft stacked shadow and a small
 * shine arc. Locked = the same die-cut as a dashed silhouette with a lock. 96x96 viewBox, 48-200 px.
 */
export default function StickerArt({ id, locked = false, size = 96, className, title }: StickerArtProps) {
  const { shape, bg } = STICKER_LOOK[id];
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={cn("inline-block shrink-0 select-none", locked && "text-ink-2", className)}
      data-sticker={id}
      data-locked={locked ? "true" : "false"}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
    >
      {locked ? (
        <g>
          <DieCut shape={shape} inset={2} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeOpacity={0.85} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" />
          <Lock x={30} y={30} width={36} height={36} strokeWidth={2.4} color="currentColor" aria-hidden="true" />
        </g>
      ) : (
        <g>
          {[4.5, 3, 1.5].map((dy) => (
            <g key={dy} transform={`translate(0 ${dy})`}>
              <DieCut shape={shape} fill="#1D2340" fillOpacity={0.09} />
            </g>
          ))}
          <DieCut shape={shape} fill="#fff" />
          <DieCut shape={shape} inset={6} fill={bg} stroke="#4A2E14" strokeOpacity={0.18} strokeWidth={1.5} />
          <Subject id={id} />
          <path d={shape === "circle" ? "M20 34Q23 26 31 21" : "M20 36Q20 24 32 20"} stroke="#fff" strokeOpacity={0.85} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </g>
      )}
    </svg>
  );
}
