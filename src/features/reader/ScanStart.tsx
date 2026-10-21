"use client";

import { useId, type ComponentType, type SVGProps } from "react";
import { Camera, ImagePlus, Info, Keyboard } from "lucide-react";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

const FOCUS =
  "outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface TileProps {
  icon: Icon;
  label: string;
  help: string;
  onClick: () => void;
  primary?: boolean;
}

/**
 * One way to start. The accessible name is the label alone (the helper is the description), so
 * "Buksa ang camera" stays the button's name. Primary is the sunrise camera tile; the others are
 * cream tiles lifted off the pad. Pressing sinks the tile 2px, it never shifts layout.
 */
function Tile({ icon: TileIcon, label, help, onClick, primary = false }: TileProps) {
  const id = useId();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-help`}
      data-slot="scan-tile"
      data-primary={primary || undefined}
      className={cn(
        "pressable group flex min-w-0 flex-col items-start gap-3 text-left",
        FOCUS,
        primary
          ? "col-span-full min-h-36 justify-end rounded-[1.375rem] bg-primary p-5 text-primary-foreground shadow-cta hover:bg-primary/90 active:shadow-pressed lg:col-span-1 lg:min-h-52"
          : "min-h-36 justify-between rounded-2xl border-[1.5px] border-line bg-card p-4 text-foreground shadow-tile hover:bg-secondary active:shadow-pressed lg:min-h-52",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center rounded-2xl",
          primary ? "size-14 bg-primary-foreground text-primary" : "size-12 bg-secondary text-foreground group-hover:bg-card",
        )}
      >
        <TileIcon className={primary ? "size-7" : "size-6"} strokeWidth={2.2} />
      </span>
      <span className="grid gap-1">
        <span
          id={`${id}-label`}
          className={cn("font-heading leading-tight font-extrabold [overflow-wrap:anywhere]", primary ? "text-2xl" : "text-lg")}
        >
          {label}
        </span>
        <span id={`${id}-help`} className={cn("text-[0.9375rem] leading-snug [overflow-wrap:anywhere]", primary ? "text-primary-foreground" : "text-ink-2")}>
          {help}
        </span>
      </span>
    </button>
  );
}

/** The three entry points. The owl perches on the camera tile's top edge, like on a book cover. */
export function ScanTiles({ onCamera, onGallery, onType, perch = true }: { onCamera: () => void; onGallery: () => void; onType: () => void; perch?: boolean }) {
  const s = useT().scan;
  return (
    <div className="relative mt-6 px-3 lg:px-6">
      {perch && <Mascot mood="idle" size={64} className="pointer-events-none absolute -top-[3.25rem] right-8 z-10 lg:left-[calc(1.5rem+1.25rem)] lg:right-auto" />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Tile primary icon={Camera} label={s.openCamera} help={s.openCameraHelp} onClick={onCamera} />
        <Tile icon={ImagePlus} label={s.pickGallery} help={s.pickGalleryHelp} onClick={onGallery} />
        <Tile icon={Keyboard} label={s.typeText} help={s.typeTextHelp} onClick={onType} />
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
