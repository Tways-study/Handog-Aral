import type { ReactElement } from "react";

export type OwlGroupMood = "idle" | "cheer" | "think" | "wave" | "sleep";
export type OwlGroupOutfit = "none" | "glasses" | "cap" | "bow";

/** Owl palette. Authored art, so hex lives here; shared by Mascot, covers, stickers and empty states. */
export const OWL = {
  contour: "#4A2E14", // thin ink-brown outline used on every piece of the family
  body: "#A86B34",
  shade: "#8A5A2B",
  light: "#CE955A",
  belly: "#F2D3A0",
  bellyLine: "#D6A96E",
  eye: "#FFFDF7",
  pupil: "#1D2340",
  beak: "#F08A24",
  cheek: "#E9776E",
  gold: "#F2B233",
  indigo: "#2B3A8C",
} as const;

const SW = 2.2;

interface OwlGroupProps {
  mood?: OwlGroupMood;
  outfit?: OwlGroupOutfit;
}

function Wing({ side, angle }: { side: "left" | "right"; angle: number }) {
  const sx = side === "left" ? 29 : 91;
  const sy = 80;
  return (
    <g data-part={`wing-${side}`} transform={`rotate(${angle} ${sx} ${sy})`}>
      <ellipse cx={sx} cy={sy + 14} rx={9.5} ry={16} fill={OWL.shade} stroke={OWL.contour} strokeWidth={SW} />
      <path d={`M${sx - 3.5} ${sy + 6}q-1 6 1 12`} stroke={OWL.light} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.7} />
    </g>
  );
}

function Eye({ cx, mood, side }: { cx: number; mood: OwlGroupMood; side: "left" | "right" }) {
  const cy = 50;
  const part = `eye-${side}`;
  if (mood === "cheer" || mood === "sleep") {
    // happy crescent (cheer) or closed rest arc (sleep)
    const d = mood === "cheer" ? `M${cx - 11} ${cy + 5}Q${cx} ${cy - 11} ${cx + 11} ${cy + 5}` : `M${cx - 11} ${cy - 1}Q${cx} ${cy + 10} ${cx + 11} ${cy - 1}`;
    return (
      <g data-part={part}>
        <path d={d} stroke={OWL.pupil} strokeWidth={4.2} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  const dx = mood === "think" ? (side === "left" ? 5 : 3) : 0;
  const dy = mood === "think" ? -4 : 2;
  const px = cx + dx + (side === "left" ? 1 : -1);
  const py = cy + dy;
  return (
    <g data-part={part}>
      <circle cx={cx} cy={cy} r={15} fill={OWL.eye} stroke={OWL.contour} strokeWidth={SW} />
      <circle cx={px} cy={py} r={10} fill={OWL.pupil} />
      <circle cx={px - 3.6} cy={py - 4.2} r={3.8} fill="#fff" />
      <circle cx={px + 3.8} cy={py + 4.4} r={1.9} fill="#fff" />
    </g>
  );
}

function Outfit({ outfit, mood }: { outfit: OwlGroupOutfit; mood: OwlGroupMood }) {
  if (outfit === "glasses") {
    // Closed-eye moods push the glasses up onto the forehead so no arc ever crosses a lens ring.
    const up = mood === "cheer" || mood === "sleep";
    return (
      <g data-part="outfit-glasses" data-up={up ? "true" : undefined} transform={up ? "translate(60 27) rotate(-5) scale(0.8) translate(-60 -50)" : undefined} fill="none" stroke="#3B2412" strokeWidth={2.8} strokeLinecap="round">
        <circle cx={42} cy={50} r={17.5} fill="#fff" fillOpacity={0.08} />
        <circle cx={78} cy={50} r={17.5} fill="#fff" fillOpacity={0.08} />
        <path d="M59 49q1-3 2 0M25 45l-7-3M95 45l7-3" />
      </g>
    );
  }
  if (outfit === "cap")
    return (
      <g data-part="outfit-cap" stroke={OWL.contour} strokeWidth={SW} strokeLinejoin="round">
        <path d="M38 20v12q22 9 44 0V20z" fill="#23306F" />
        <path d="M60 3 101 17 60 31 19 17Z" fill={OWL.indigo} />
        <path d="M60 6 92 17" stroke="#6E7FD6" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
        <path d="M60 17 23 19v17" fill="none" stroke={OWL.gold} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={60} cy={17} r={3} fill={OWL.gold} />
        <path d="M20 35h6l1.5 8h-9z" fill={OWL.gold} />
      </g>
    );
  if (outfit === "bow")
    return (
      <g data-part="outfit-bow" stroke={OWL.contour} strokeWidth={SW} strokeLinejoin="round">
        <path d="M60 83 41 73q-4 10 0 21z" fill="#C8323A" />
        <path d="M60 83 79 73q4 10 0 21z" fill="#C8323A" />
        <rect x={54.5} y={77} width={11} height={12} rx={4.5} fill="#E4545C" />
      </g>
    );
  return null;
}

/** The Handog owl as a bare <g> in a 120x120 box, so other art can embed it (<g transform> to place it). Static. */
export default function OwlGroup({ mood = "idle", outfit = "none" }: OwlGroupProps): ReactElement {
  const cheer = mood === "cheer";
  const wingL = cheer ? 140 : mood === "wave" ? 12 : 12;
  const wingR = cheer ? -140 : mood === "wave" ? -152 : mood === "think" ? 118 : -12;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g data-part="ears" fill={OWL.shade} stroke={OWL.contour} strokeWidth={SW}>
        <ellipse cx={28} cy={22} rx={9} ry={12.5} transform="rotate(-28 28 22)" />
        <ellipse cx={92} cy={22} rx={9} ry={12.5} transform="rotate(28 92 22)" />
      </g>
      <g data-part="feet" fill={OWL.beak} stroke={OWL.contour} strokeWidth={SW}>
        <path d="M37 111q1-5 6-5t6 0q5 0 6 5-2 5-9 5t-9-5z" />
        <path d="M65 111q1-5 6-5t6 0q5 0 6 5-2 5-9 5t-9-5z" transform="translate(-2 0)" />
      </g>
      <ellipse data-part="body" cx={60} cy={86} rx={34} ry={25} fill={OWL.body} stroke={OWL.contour} strokeWidth={SW} />
      <g data-part="belly">
        <ellipse cx={60} cy={93} rx={21} ry={15.5} fill={OWL.belly} />
        <path d="M47 92q3.5 3.6 7 0M56.5 92q3.5 3.6 7 0M66 92q3.5 3.6 7 0M51.5 100q3.5 3.6 7 0M61.5 100q3.5 3.6 7 0" stroke={OWL.bellyLine} strokeWidth={2} fill="none" />
      </g>
      <g data-part="head">
        <ellipse cx={60} cy={50} rx={45} ry={37} fill={OWL.body} stroke={OWL.contour} strokeWidth={SW} />
        <path d="M23 38Q27 25 42 20" stroke={OWL.light} strokeWidth={3.4} fill="none" />
        <path d="M97 58Q94 72 80 80" stroke={OWL.shade} strokeWidth={4} fill="none" opacity={0.55} />
      </g>
      <g data-part="cheeks" fill={OWL.cheek} opacity={0.62}>
        <circle cx={26} cy={66} r={5.2} />
        <circle cx={94} cy={66} r={5.2} />
      </g>
      <Eye cx={42} mood={mood} side="left" />
      <Eye cx={78} mood={mood} side="right" />
      <g data-part="beak" stroke={OWL.contour} strokeWidth={SW}>
        {cheer ? (
          <>
            <path d="M53.5 59Q60 53 66.5 59 63.500 64 60 64T53.500 59Z" fill={OWL.beak} />
            <path d="M55.500 63.500Q60 74 64.500 63.500Q60 61 55.500 63.500Z" fill="#C8323A" />
          </>
        ) : (
          <path d="M54 59Q60 54 66 59 63.500 69 60 69T54 59Z" fill={OWL.beak} />
        )}
      </g>
      <Wing side="left" angle={wingL} />
      <Wing side="right" angle={wingR} />
      <Outfit outfit={outfit} mood={mood} />
      {cheer && (
        <g data-part="sparkles" fill={OWL.gold} stroke={OWL.contour} strokeWidth={1.4}>
          <path d="M8 26l2.200 5.300L15.500 33.500 10.200 35.700 8 41 5.800 35.700.5 33.500 5.800 31.300z" />
          <path d="M112 20l1.800 4.200 4.200 1.800-4.200 1.800L112 32l-1.800-4.200L106 26l4.200-1.800z" />
        </g>
      )}
      {mood === "think" && (
        <g data-part="thought" fill="#fff" stroke={OWL.contour} strokeWidth={1.6}>
          <circle cx={106} cy={20} r={2.600} />
          <circle cx={111} cy={10} r={3.800} />
        </g>
      )}
      {mood === "wave" && (
        <g data-part="wave-marks" fill="none" strokeLinecap="round">
          <path d="M110 40q5 3 4 9M114 34q8 5 6 15" stroke={OWL.contour} strokeWidth={5} />
          <path d="M110 40q5 3 4 9M114 34q8 5 6 15" stroke={OWL.gold} strokeWidth={2.4} />
        </g>
      )}
      {mood === "sleep" && (
        <g data-part="zzz" fill="none">
          <path d="M97 22h9l-9 10h9M108 8h6l-6 7h6" stroke={OWL.contour} strokeWidth={5.4} />
          <path d="M97 22h9l-9 10h9" stroke={OWL.gold} strokeWidth={3} />
          <path d="M108 8h6l-6 7h6" stroke={OWL.gold} strokeWidth={2.4} />
        </g>
      )}
    </g>
  );
}
