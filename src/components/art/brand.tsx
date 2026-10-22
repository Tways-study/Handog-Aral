// Static SVG markup for the app icons and share images. Bundled by scripts/lib/render-art.mjs
// (gen-pwa-icons.mjs, gen-og.mjs) so the icons always show the same owl as the app.
import { renderToStaticMarkup } from "react-dom/server";
import OwlGroup from "@/components/art/OwlGroup";
import StickerArt from "@/components/stickers/StickerArt";
import type { StickerId } from "@/lib/stickers/ids";

export const owlMarkup = (): string => renderToStaticMarkup(<OwlGroup mood="idle" />);

export const stickerMarkup = (id: StickerId, size: number): string => renderToStaticMarkup(<StickerArt id={id} size={size} />);

export const ICON_PURPLE = "#8A6FF0";

/**
 * 512 canvas. A solid purple tile with the owl's face filling it and bleeding off the bottom edge,
 * like the app-icon style we chose. The maskable (square) variant draws the owl smaller so its face
 * stays inside the 80% safe zone (a circle of radius 205 about the centre).
 */
export function iconSvg({ rounded }: { rounded: boolean }): string {
  const scale = rounded ? 5 : 3.4;
  const tx = 256 - 60 * scale;
  const ty = (rounded ? 270 : 262) - 60 * scale;
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <clipPath id="tile">
          <rect width="512" height="512" rx={rounded ? 112 : 0} />
        </clipPath>
      </defs>
      <g clipPath="url(#tile)">
        <rect width="512" height="512" fill={ICON_PURPLE} />
        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <OwlGroup mood="idle" />
        </g>
      </g>
    </svg>,
  );
}

/** Android adaptive-icon foreground: the owl on transparent, inside the 66dp safe circle of the 108dp canvas. */
export function launcherForegroundSvg(): string {
  const scale = 0.68;
  const t = 54 - 60 * scale;
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
      <g transform={`translate(${t} ${t}) scale(${scale})`}>
        <OwlGroup mood="idle" />
      </g>
    </svg>,
  );
}

export default iconSvg;
