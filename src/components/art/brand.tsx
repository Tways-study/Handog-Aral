// Static SVG markup for the app icons and share images. Bundled by scripts/lib/render-art.mjs
// (gen-pwa-icons.mjs, gen-og.mjs) so the icons always show the same owl as the app.
import { renderToStaticMarkup } from "react-dom/server";
import OwlGroup from "@/components/art/OwlGroup";
import StickerArt from "@/components/stickers/StickerArt";
import { Sparkle } from "@/components/art/parts";
import type { StickerId } from "@/lib/stickers/ids";

export const owlMarkup = (): string => renderToStaticMarkup(<OwlGroup mood="idle" />);

export const stickerMarkup = (id: StickerId, size: number): string => renderToStaticMarkup(<StickerArt id={id} size={size} />);

/** 512 canvas. Sun and owl sit inside the 80% maskable safe zone (a circle of radius 205 about the centre). */
export function iconSvg({ rounded }: { rounded: boolean }): string {
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" rx={rounded ? 112 : 0} fill="#FBF7EE" />
      <circle cx="256" cy="262" r="178" fill="#F08A24" />
      <circle cx="256" cy="262" r="178" fill="none" stroke="#FFD49A" strokeWidth="8" strokeDasharray="1 22" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(106 92) scale(2.5)">
        <OwlGroup mood="idle" />
      </g>
      <g transform="translate(0 0)">
        <Sparkle cx={110} cy={150} s={20} />
        <Sparkle cx={410} cy={120} s={15} fill="#fff" />
      </g>
    </svg>,
  );
}

export default iconSvg;
