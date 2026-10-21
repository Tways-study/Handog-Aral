import OwlGroup, { OWL } from "@/components/art/OwlGroup";
import ArtSvg, { type ArtProps } from "@/components/art/ArtSvg";
import { C, CW, Sparkle } from "@/components/art/parts";

const line = { stroke: C.contour, strokeWidth: CW, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const WOOD = "#C48A4E";

/** An owl beside an empty shelf: one lonely book and a dashed slot waiting for the next. */
export function EmptyShelf(props: ArtProps) {
  return (
    <ArtSvg {...props} name="empty-shelf">
      <g {...line}>
        <rect x={92} y={54} width={14} height={54} rx={4} fill={C.indigo} />
        <path d="M96 66h6" stroke="#fff" strokeOpacity={0.7} strokeWidth={2} />
        <rect x={112} y={60} width={34} height={48} rx={5} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeDasharray="5 5" strokeWidth={2.4} />
        <rect x={8} y={106} width={144} height={11} rx={5.5} fill={WOOD} />
        <path d="M14 109h132" stroke="#E0A868" strokeWidth={2} />
      </g>
      <g transform="translate(0 32) scale(0.7)">
        <OwlGroup mood="idle" />
      </g>
      <Sparkle cx={100} cy={30} s={6} />
      <Sparkle cx={140} cy={40} s={4} fill="#fff" />
    </ArtSvg>
  );
}

/** An owl holding up an empty word card. */
export function EmptyWords(props: ArtProps) {
  return (
    <ArtSvg {...props} name="empty-words">
      <g transform="translate(37 2) scale(0.86)">
        <OwlGroup mood="idle" />
      </g>
      <g transform="rotate(-5 80 88)">
        <rect x={46} y={72} width={68} height={36} rx={8} fill={C.paper} {...line} />
        <path d="M58 86h44M58 97h26" stroke="#C3D3EE" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 6" />
      </g>
      <ellipse cx={47} cy={92} rx={7} ry={10} transform="rotate(-8 51 92)" fill={OWL.shade} {...line} />
      <ellipse cx={113} cy={92} rx={7} ry={10} transform="rotate(8 110 92)" fill={OWL.shade} {...line} />
      <Sparkle cx={26} cy={30} s={6} />
      <Sparkle cx={136} cy={24} s={5} fill="#fff" />
    </ArtSvg>
  );
}

/** A thinking owl and a big question mark. */
export function EmptyQuiz(props: ArtProps) {
  return (
    <ArtSvg {...props} name="empty-quiz">
      <g transform="translate(14 8) scale(0.88)">
        <OwlGroup mood="think" />
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M112 38Q112 20 128 20Q144 20 144 34Q144 44 132 50Q128 53 128 60" stroke={C.contour} strokeWidth={14} />
        <path d="M112 38Q112 20 128 20Q144 20 144 34Q144 44 132 50Q128 53 128 60" stroke={C.gold} strokeWidth={8.5} />
        <circle cx={128} cy={76} r={7.5} fill={C.contour} stroke={C.contour} strokeWidth={2.4} />
        <circle cx={128} cy={76} r={5} fill={C.gold} stroke="none" />
      </g>
      <Sparkle cx={150} cy={60} s={5} fill="#fff" />
    </ArtSvg>
  );
}

/** An owl, a cloud and an unplugged cable: no connection right now. */
export function OfflineArt(props: ArtProps) {
  return (
    <ArtSvg {...props} name="offline">
      <g transform="translate(8 4) scale(0.8)">
        <OwlGroup mood="idle" />
      </g>
      <g {...line}>
        <path d="M104 52Q96 52 96 44Q96 36 105 36Q108 24 122 26Q134 20 142 32Q154 32 154 44Q154 52 144 52Z" fill={C.paper} strokeDasharray="0" />
        <path d="M104 44q3 -3 6 0M130 44q3 -3 6 0" strokeWidth={2} fill="none" />
        <path d="M112 47q10 -5 20 0" strokeWidth={2} fill="none" />
        <path d="M100 62 148 30" stroke={C.gumamela} strokeWidth={4.5} />
        {/* cable and socket */}
        <path d="M70 108Q84 108 90 100" fill="none" stroke={C.contour} strokeWidth={7} />
        <path d="M70 108Q84 108 90 100" fill="none" stroke={C.sunrise} strokeWidth={3.4} />
        <rect x={88} y={88} width={18} height={14} rx={4} fill={C.indigo} transform="rotate(-24 97 95)" />
        <path d="M104 86 110 83M106 92 112 89" strokeWidth={2.4} />
        <rect x={126} y={84} width={20} height={24} rx={6} fill={C.paper} />
        <path d="M130 94h4M130 100h4" strokeWidth={2.4} />
      </g>
      <Sparkle cx={118} cy={74} s={5} fill={C.gold} />
    </ArtSvg>
  );
}

/** An owl peering through a magnifying glass: page not found. */
export function NotFoundArt(props: ArtProps) {
  return (
    <ArtSvg {...props} name="not-found">
      <g transform="translate(14 6) scale(0.86)">
        <OwlGroup mood="idle" />
      </g>
      <g {...line}>
        <path d="M100 76 120 98" stroke={C.contour} strokeWidth={11} />
        <path d="M100 76 120 98" stroke="#C48A4E" strokeWidth={6.5} />
        <circle cx={85} cy={48} r={21} fill="#CFE3F8" fillOpacity={0.4} stroke={C.contour} strokeWidth={9} />
        <circle cx={85} cy={48} r={21} fill="none" stroke={C.indigo} strokeWidth={5} />
        <path d="M72 38Q76 31 84 29" stroke="#fff" strokeWidth={3.5} fill="none" />
      </g>
      <Sparkle cx={22} cy={26} s={6} />
      <Sparkle cx={140} cy={30} s={5} fill="#fff" />
    </ArtSvg>
  );
}

/** First-paint decoration: an owl peeking over the top edge of a ruled notebook page. */
export function PeekOverNotebook(props: ArtProps) {
  return (
    <ArtSvg {...props} name="peek-notebook">
      <g transform="translate(40 -4) scale(0.8)">
        <OwlGroup mood="idle" />
      </g>
      <g {...line}>
        <rect x={10} y={72} width={140} height={60} rx={10} fill={C.paper} />
        <path d="M24 88H136M24 100H136M24 112H136" stroke="#C3D3EE" strokeWidth={2.4} />
        <path d="M34 72V132" stroke="#E0756C" strokeWidth={2} />
        <ellipse cx={58} cy={72} rx={9} ry={6} fill={OWL.shade} />
        <ellipse cx={102} cy={72} rx={9} ry={6} fill={OWL.shade} />
      </g>
    </ArtSvg>
  );
}
