"use client";

import { type ReactNode } from "react";
import { Info } from "lucide-react";
import Owl from "@/components/owl/Owl";
import { LensDoodle, PencilDoodle, PhotoDoodle } from "@/components/art/ScanDoodles";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

const FOCUS =
  "outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface TileProps {
  label: string;
  help: string;
  onClick: () => void;
  doodle?: ReactNode;
  className?: string;
}

/**
 * One way to start. The accessible name comes from the visible text (label + helper), so what a voice-control user
 * sees is exactly what they can say (WCAG 2.5.3). The art is decorative. Pressing sinks the tile 2px, it never shifts layout.
 */
function Tile({ label, help, onClick, doodle, className }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-slot="scan-tile"
      className={cn(
        "pressable group flex min-h-36 min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border-[1.5px] border-line bg-card p-4 text-left text-foreground shadow-tile hover:bg-secondary active:shadow-pressed lg:min-h-48 lg:p-5",
        FOCUS,
        className,
      )}
    >
      {doodle}
      <span className="grid gap-1">
        <span className="font-heading text-lg leading-tight font-extrabold [overflow-wrap:anywhere] lg:text-xl">{label}</span>
        <span className="text-[0.9375rem] leading-snug text-ink-2 [overflow-wrap:anywhere]">{help}</span>
      </span>
    </button>
  );
}

/**
 * The three ways to start. The camera is the hero: an indigo book-jacket tile with a sunrise lens, and the page's hero
 * owl perched on its edge holding that lens up. Gallery and typing are cream tiles with authored pad-paper doodles.
 * At lg the camera tile is tall and the other two stack beside it, so the stage is filled instead of ending halfway.
 */
export function ScanTiles({ onCamera, onGallery, onType }: { onCamera: () => void; onGallery: () => void; onType: () => void }) {
  const s = useT().scan;
  const desktop = useMediaQuery("(min-width: 1024px)");
  return (
    <div className="mt-[5.5rem] px-3 lg:mt-24 lg:px-6" data-slot="scan-tiles">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3 lg:grid-cols-[1.5fr_1fr] lg:grid-rows-2">
        <div className="relative col-span-full flex lg:col-span-1 lg:row-span-2">
          {/* The owl perches on the jacket's top edge; the lens hangs in front of its tummy. Both ignore pointers. */}
          <div aria-hidden="true" className="pointer-events-none absolute right-6 -top-[5.25rem] z-10 lg:right-10 lg:-top-[7.5rem]">
            <Owl mood="wave" size={desktop ? 136 : 96} priority="hero" />
            <LensDoodle size={desktop ? 76 : 56} className="absolute -bottom-3.5 -left-5 lg:-left-6" />
          </div>
          <button
            type="button"
            onClick={onCamera}
            data-slot="scan-tile"
            data-primary
            className={cn(
              "pressable group flex min-h-36 w-full min-w-0 flex-col items-start justify-end gap-1 rounded-[1.375rem] border-[1.5px] border-transparent bg-indigo p-5 text-left text-indigo-fg shadow-cta hover:brightness-110 active:shadow-pressed lg:min-h-80 lg:p-7",
              FOCUS,
            )}
          >
            <span className="font-heading text-2xl leading-tight font-extrabold [overflow-wrap:anywhere] lg:text-3xl">{s.openCamera}</span>
            <span className="max-w-[24ch] text-[0.9375rem] leading-snug lg:text-base">{s.openCameraHelp}</span>
          </button>
        </div>
        <Tile label={s.pickGallery} help={s.pickGalleryHelp} onClick={onGallery} doodle={<PhotoDoodle />} />
        <Tile label={s.typeText} help={s.typeTextHelp} onClick={onType} doodle={<PencilDoodle />} />
      </div>
    </div>
  );
}

/** The processing moment: the thinking owl, a determinate bar, an honest note about who is reading, and Cancel. */
export function ScanProgress({ progress, onCancel }: { progress: number; onCancel: () => void }) {
  const s = useT().scan;
  return (
    <div className="grid gap-4 pt-2 pr-5 pl-[var(--pad-gutter)] pb-2" data-slot="scan-progress">
      <div className="flex items-center gap-4">
        <Mascot mood="think" size={80} />
        <div className="min-w-0">
          <p role="status" className="font-heading text-xl leading-tight font-bold lg:text-2xl">
            {s.scanning}
          </p>
          <p className="mt-1 text-[0.9375rem] font-bold text-ink-2 tabular-nums">{s.scanningPercent(progress)}</p>
        </div>
      </div>
      <Progress value={progress} aria-label={s.scanning} className="max-w-md" />
      <p className="flex max-w-md items-start gap-2 text-[0.9375rem] leading-snug text-ink-2">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {s.scanningNote}
      </p>
      <Button type="button" variant="secondary" className="w-fit" onClick={onCancel}>
        {s.cancel}
      </Button>
    </div>
  );
}
