import { useId } from "react";
import OwlGroup from "@/components/art/OwlGroup";
import { C, CW, Eye, Face, Sparkle, starPath } from "@/components/art/parts";
import { cn } from "@/lib/utils";
import type { CoverId, Jacket } from "@/shared/types";

interface BookCoverProps {
  coverId: CoverId;
  jacket: Jacket;
  className?: string;
  /** Show the blank notebook label plate (title goes in HTML over it, not in the SVG). Default true. */
  label?: boolean;
  /** Accessible name. Decorative (aria-hidden) when omitted. */
  title?: string;
}

const JACKET_FILL: Record<Jacket, string> = {
  indigo: "var(--indigo)",
  kangkong: "var(--kangkong)",
  mango: "var(--mango)",
  gumamela: "var(--gumamela)",
};

const COVER = "M6 0H138a22 22 0 0 1 22 22V188a22 22 0 0 1-22 22H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z";

/** A tiny owl peeking up from the bottom-right corner. */
function OwlPeek() {
  return (
    <g transform="translate(103 170) rotate(-7 24 24) scale(0.42)">
      <OwlGroup mood="idle" />
    </g>
  );
}

/** Six kawaii gouache motifs in a 160x210 notebook. Motif area is roughly x 30-140, y 78-198. */
function Motif({ id }: { id: CoverId }) {
  const line = { stroke: C.contour, strokeWidth: CW, strokeLinejoin: "round", strokeLinecap: "round" } as const;
  switch (id) {
    case "fox":
      return (
        <g {...line}>
          {/* ears */}
          <path d="M44 132Q40 98 62 94Q80 104 84 124Z" fill={C.sunrise} />
          <path d="M132 132Q136 98 114 94Q96 104 92 124Z" fill={C.sunrise} />
          <path d="M53 124Q52 108 62 104Q70 110 73 122Z" fill={C.cream} strokeWidth={0} />
          <path d="M123 124Q124 108 114 104Q106 110 103 122Z" fill={C.cream} strokeWidth={0} />
          {/* head: round with soft cheek bumps */}
          <path d="M36 152Q36 116 88 116Q140 116 140 152Q142 178 116 186Q88 194 60 186Q34 178 36 152Z" fill={C.sunrise} />
          <path d="M44 160Q60 150 74 168Q88 180 102 168Q116 150 132 160Q130 178 112 184Q88 190 64 184Q46 178 44 160Z" fill={C.cream} strokeWidth={0} />
          <path d="M52 128Q64 120 80 120" stroke="#FFC27A" strokeWidth={4} fill="none" />
          <ellipse cx={88} cy={160} rx={5.5} ry={4} fill={C.ink} stroke="none" />
          <path d="M82 167q6 5 12 0" stroke={C.ink} strokeWidth={1.8} fill="none" />
          <Eye cx={66} cy={146} r={6.5} />
          <Eye cx={110} cy={146} r={6.5} />
          <circle cx={54} cy={162} r={6} fill={C.cheek} opacity={0.75} stroke="none" />
          <circle cx={122} cy={162} r={6} fill={C.cheek} opacity={0.75} stroke="none" />
          <Sparkle cx={40} cy={100} s={6} />
        </g>
      );
    case "star":
      return (
        <g {...line}>
          <path d={starPath(78, 138, 44, 24)} fill={C.contour} stroke={C.contour} strokeWidth={12} />
          <path d={starPath(78, 138, 44, 24)} fill={C.gold} stroke={C.gold} strokeWidth={8} />
          <path d="M60 114Q68 102 82 98" stroke="#FFF3C4" strokeWidth={4.5} fill="none" />
          <Face cx={78} cy={140} gap={22} r={5} />
          <Sparkle cx={40} cy={104} s={6} fill={C.cream} />
          <Sparkle cx={134} cy={110} s={5} fill={C.marker} />
          <Sparkle cx={38} cy={172} s={4.5} fill={C.marker} />
          <OwlPeek />
        </g>
      );
    case "rice":
      return (
        <g {...line}>
          {/* steam */}
          <path d="M70 108q-8-8 0-16M90 112q-8-8 0-18M110 108q-8-8 0-16" stroke={C.cream} strokeWidth={4.5} fill="none" opacity={0.9} />
          {/* rice mound */}
          <path d="M40 150Q40 112 88 112Q136 112 136 150Z" fill="#FFFFFF" />
          <path d="M58 128q4-6 10-4M80 120q4-4 10-2M104 128q4-6 10-3M72 138q4-3 8-1M96 140q4-3 8-1" stroke="#E4D9C0" strokeWidth={2.4} fill="none" />
          {/* bowl */}
          <path d="M32 148H144Q144 196 112 196H64Q32 196 32 148Z" fill={C.cream} />
          <path d="M33 164H143" stroke={C.kangkong} strokeWidth={5} fill="none" />
          <path d="M44 154Q46 176 58 188" stroke="#fff" strokeWidth={4} fill="none" opacity={0.9} />
          <Face cx={88} cy={177} gap={26} r={4.8} />
          <Sparkle cx={140} cy={104} s={5} fill={C.marker} />
          <Sparkle cx={36} cy={112} s={4.5} fill={C.cream} />
        </g>
      );
    case "rainbow":
      return (
        <g {...line}>
          <g fill="none" strokeLinecap="butt">
            <path d="M88 176m-39 0a39 39 0 0 1 78 0" stroke={C.contour} strokeWidth={46} />
            <path d="M34 176a54 54 0 0 1 108 0" stroke={C.gumamela} strokeWidth={10} />
            <path d="M44 176a44 44 0 0 1 88 0" stroke={C.gold} strokeWidth={10} />
            <path d="M54 176a34 34 0 0 1 68 0" stroke={C.mint} strokeWidth={10} />
            <path d="M64 176a24 24 0 0 1 48 0" stroke="#7FB2F0" strokeWidth={10} />
          </g>
          <g transform="translate(104 158) rotate(-6 24 24) scale(0.44)">
            <OwlGroup mood="wave" />
          </g>
          <path d="M26 192Q22 172 40 172Q46 160 62 166Q74 158 86 170Q104 168 102 192Z" fill={C.paper} />
          <Face cx={64} cy={181} gap={18} r={4} />
          <path d="M96 198Q94 184 108 184Q114 176 126 180Q136 176 144 186Q154 188 150 198Z" fill={C.paper} />
          <Sparkle cx={38} cy={102} s={6} fill={C.cream} />
          <Sparkle cx={128} cy={100} s={5} fill={C.marker} />
        </g>
      );
    case "turtle":
      return (
        <g {...line}>
          {/* tail, feet */}
          <path d="M34 178q-8-2-10 4 6 4 14 0z" fill={C.mint} />
          <path d="M52 178H72V192Q72 198 64 198H58Q50 198 50 190Z" fill={C.mint} />
          <path d="M104 178H124V190Q124 198 116 198H110Q102 198 102 192Z" fill={C.mint} />
          {/* head */}
          <path d="M120 150Q120 130 140 130Q156 134 154 154Q150 172 132 172Q120 170 120 150Z" fill={C.mint} />
          <Eye cx={140} cy={147} r={4.8} />
          <circle cx={149} cy={158} r={4} fill={C.cheek} opacity={0.75} stroke="none" />
          <path d="M138 160q5 4 10 0" stroke={C.ink} strokeWidth={1.8} fill="none" />
          {/* shell */}
          <path d="M36 182Q36 118 82 118Q128 118 128 182Z" fill={C.kangkong} />
          <path d="M82 118v64M58 136l24 14 24-14M46 182l36-24 36 24" stroke="#1F5C3C" strokeWidth={3} fill="none" />
          <path d="M82 150L58 136V160L82 172L106 160V136Z" fill="#3E9C6E" strokeWidth={0} />
          <path d="M52 140Q58 126 72 122" stroke="#9FE0BC" strokeWidth={4.5} fill="none" />
          <path d="M34 182H130" stroke={C.contour} strokeWidth={CW} />
          <Sparkle cx={42} cy={102} s={6} fill={C.cream} />
          <Sparkle cx={132} cy={104} s={4.5} fill={C.marker} />
        </g>
      );
    case "basket":
      return (
        <g {...line}>
          <path d="M50 134Q50 100 88 100Q126 100 126 134" fill="none" stroke={C.contour} strokeWidth={9} />
          <path d="M50 134Q50 100 88 100Q126 100 126 134" fill="none" stroke="#C48A4E" strokeWidth={5} />
          {/* fruit with faces */}
          <circle cx={68} cy={134} r={16} fill={C.gumamela} />
          <path d="M60 124Q62 118 68 118" stroke="#E98A8F" strokeWidth={3.5} fill="none" />
          <Face cx={68} cy={136} gap={11} r={2.8} mouth={false} />
          <path d="M80 130Q80 108 100 112Q112 118 108 134Q102 142 90 142Q80 140 80 130Z" fill={C.gold} />
          <path d="M86 118Q92 112 98 114" stroke="#FFF3C4" strokeWidth={3.5} fill="none" />
          <Eye cx={92} cy={128} r={3} />
          <Eye cx={104} cy={128} r={3} />
          <path d="M94 134q4 3 8 0" stroke={C.ink} strokeWidth={1.6} fill="none" />
          <circle cx={112} cy={138} r={13} fill={C.sunrise} />
          <path d="M104 130Q106 124 112 124" stroke="#FFC27A" strokeWidth={3} fill="none" />
          <path d="M70 118q4-10 14-8" stroke={C.kangkong} strokeWidth={3.5} fill="none" />
          <path d="M84 110Q96 98 104 106Q94 114 84 110Z" fill={C.mint} />
          {/* basket */}
          <path d="M34 146H142L128 190Q126 197 118 197H58Q50 197 48 190Z" fill="#C48A4E" />
          <path d="M40 160H136M44 174H132M47 186H129" stroke="#8A5A2B" strokeWidth={3} fill="none" />
          <path d="M62 148L56 196M88 148V197M114 148L120 196" stroke="#8A5A2B" strokeWidth={3} fill="none" />
          <path d="M34 146H142" stroke={C.contour} strokeWidth={5} />
          <path d="M36 146H140" stroke="#E0A868" strokeWidth={2.4} />
          <Sparkle cx={40} cy={108} s={5} fill={C.cream} />
          <Sparkle cx={138} cy={112} s={4.5} fill={C.marker} />
        </g>
      );
  }
}

/** A glossy notebook cover in the book's jacket colour: stitched spine, label plate and one kawaii motif. */
export default function BookCover({ coverId, jacket, className, label = true, title }: BookCoverProps) {
  const clipId = `cover-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 160 210"
      className={cn("block h-auto w-full", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
      data-cover={coverId}
      data-jacket={jacket}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={COVER} />
        </clipPath>
      </defs>
      <path d={COVER} fill={JACKET_FILL[jacket]} />
      <g clipPath={`url(#${clipId})`}>
        {/* spine band, rounded stitching, glossy shoulder */}
        <path d="M0 0h14v210H0z" fill="#000" opacity="0.22" />
        <path d="M23 12V198" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 8" />
        <path d="M24 6H136Q152 6 154 26" stroke="#fff" strokeOpacity={0.28} strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M20 204H132Q150 204 154 186" stroke="#000" strokeOpacity={0.16} strokeWidth={4} strokeLinecap="round" fill="none" />
        {label && (
          <g>
            <rect x="34" y="20" width="100" height="46" rx="14" fill="#FFFDF7" stroke={C.contour} strokeOpacity="0.55" strokeWidth={1.6} />
            <path d="M46 40h76M46 54h52" stroke="#C3D3EE" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        )}
        <Motif id={coverId} />
      </g>
      <path d={COVER} fill="none" stroke={C.contour} strokeOpacity={0.5} strokeWidth={2} />
    </svg>
  );
}
