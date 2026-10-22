import type { ReactElement } from "react";

export type OwlGroupMood = "idle" | "cheer" | "think" | "wave" | "sleep";
export type OwlGroupOutfit = "none" | "glasses" | "cap" | "bow";

/**
 * Owl palette. Authored art, so hex lives here; shared by Mascot, covers, stickers and empty states.
 * Sampled from the reference sheet in public/mascot/owl-expression-sheet.png.
 */
export const OWL = {
  contour: "#4A2E14", // ink-brown outline for the books and props around the owl (the owl itself has none)
  body: "#B46F45",
  shade: "#9C5936",
  light: "#CC8A5C",
  belly: "#F8E0BD",
  bellyLine: "#D9AE86",
  eye: "#FDEDD9",
  pupil: "#27273E",
  beak: "#F8A23D",
  cheek: "#F6A29B",
  gold: "#F5C53F",
  indigo: "#2B3A8C",
  sky: "#6B8DE8",
} as const;

interface OwlGroupProps {
  mood?: OwlGroupMood;
  outfit?: OwlGroupOutfit;
}

const SHOULDER = { left: { x: 18, y: 80 }, right: { x: 102, y: 80 } } as const;

function Wing({ side, angle }: { side: "left" | "right"; angle: number }) {
  const { x, y } = SHOULDER[side];
  return (
    <g data-part={`wing-${side}`} transform={`rotate(${angle} ${x} ${y})`}>
      <ellipse cx={x + (side === "left" ? -1 : 1)} cy={y + 14} rx={8} ry={14} fill={OWL.shade} />
      <path d={`M${x + (side === "left" ? -3.5 : 3.5)} ${y + 7}q${side === "left" ? -1 : 1} 6 1 11`} stroke={OWL.light} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.55} />
    </g>
  );
}

function Eye({ cx, mood, side }: { cx: number; mood: OwlGroupMood; side: "left" | "right" }) {
  const cy = 60;
  const part = `eye-${side}`;
  if (mood === "cheer" || mood === "sleep") {
    // happy crescent (cheer) or closed rest arc (sleep), drawn on the cream disc
    const d = mood === "cheer" ? `M${cx - 10} ${cy + 4}Q${cx} ${cy - 10} ${cx + 10} ${cy + 4}` : `M${cx - 10} ${cy - 1}Q${cx} ${cy + 9} ${cx + 10} ${cy - 1}`;
    return (
      <g data-part={part}>
        <circle cx={cx} cy={cy} r={19} fill={OWL.eye} />
        <path d={d} stroke={OWL.pupil} strokeWidth={3.8} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  const dx = mood === "think" ? (side === "left" ? 5 : 3.5) : 0;
  const dy = mood === "think" ? -4.5 : 1;
  const px = cx + dx + (side === "left" ? 1 : -1);
  const py = cy + dy;
  return (
    <g data-part={part}>
      <circle cx={cx} cy={cy} r={19} fill={OWL.eye} />
      <circle cx={px} cy={py} r={12} fill={OWL.pupil} />
      <circle cx={px - 3.8} cy={py - 4.4} r={4.2} fill="#fff" />
      <circle cx={px + 4.2} cy={py + 4.6} r={2} fill="#fff" />
    </g>
  );
}

function Outfit({ outfit, mood }: { outfit: OwlGroupOutfit; mood: OwlGroupMood }) {
  if (outfit === "glasses") {
    // Closed-eye moods push the glasses up onto the forehead so no arc ever crosses a lens ring.
    const up = mood === "cheer" || mood === "sleep";
    return (
      <g data-part="outfit-glasses" data-up={up ? "true" : undefined} transform={up ? "translate(60 38) rotate(-5) scale(0.8) translate(-60 -60)" : undefined} fill="none" stroke="#3B2412" strokeWidth={3} strokeLinecap="round">
        <circle cx={41} cy={60} r={21} fill="#fff" fillOpacity={0.08} />
        <circle cx={79} cy={60} r={21} fill="#fff" fillOpacity={0.08} />
        <path d="M59 58q1-3 2 0M20 55l-6-3M100 55l6-3" />
      </g>
    );
  }
  if (outfit === "cap")
    return (
      <g data-part="outfit-cap" strokeLinejoin="round">
        <path d="M38 27v12q22 9 44 0V27z" fill="#23306F" />
        <path d="M60 9 102 24 60 39 18 24Z" fill={OWL.indigo} />
        <path d="M60 12 92 24" stroke="#6E7FD6" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
        <path d="M60 24 23 26v17" fill="none" stroke={OWL.gold} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={60} cy={24} r={3.2} fill={OWL.gold} />
        <path d="M20 42h6l1.5 8h-9z" fill={OWL.gold} />
      </g>
    );
  if (outfit === "bow")
    return (
      <g data-part="outfit-bow" strokeLinejoin="round">
        <path d="M60 90 41 81q-4 10 0 21z" fill="#C8323A" />
        <path d="M60 90 79 81q4 10 0 21z" fill="#C8323A" />
        <rect x={54.5} y={84} width={11} height={12} rx={4.5} fill="#E4545C" />
      </g>
    );
  return null;
}

/** Little gold "ta-da" ticks, as on the reference sheet. */
function Ticks({ x, y }: { x: number; y: number }) {
  return (
    <g data-part="ticks" stroke={OWL.gold} strokeWidth={3.6} strokeLinecap="round" fill="none">
      <path d={`M${x} ${y + 6}l-3.5 -7.5`} />
      <path d={`M${x + 8} ${y + 2}l1.5 -8.5`} />
      <path d={`M${x + 12} ${y + 12}l7 -4`} />
    </g>
  );
}

/**
 * The Handog owl as a bare <g> in a 120x120 box, so other art can embed it (<g transform> to place
 * it). Static. A chubby egg of one brown, cream "goggle" eyes, rosy cheeks, a tiny beak and a
 * smiling tummy, with no outline, like the reference sheet.
 */
export default function OwlGroup({ mood = "idle", outfit = "none" }: OwlGroupProps): ReactElement {
  const cheer = mood === "cheer";
  const wingL = cheer ? 150 : 10;
  const wingR = cheer ? -150 : mood === "wave" ? -150 : mood === "think" ? 78 : -10;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g data-part="ears" fill={OWL.shade}>
        <path d="M20 54Q13 34 23 20Q38 22 49 37Z" />
        <path d="M100 54Q107 34 97 20Q82 22 71 37Z" />
      </g>
      <g data-part="feet" fill={OWL.beak}>
        <path d="M36 112q2-7 9-7t9 7q-2 5-9 5t-9-5z" />
        <path d="M66 112q2-7 9-7t9 7q-2 5-9 5t-9-5z" />
      </g>
      <path data-part="body" d="M60 31C93 31 107 52 107 77C107 99 89 111 60 111C31 111 13 99 13 77C13 52 27 31 60 31Z" fill={OWL.body} />
      <g data-part="head">
        <path d="M26 48Q31 38 46 34" stroke={OWL.light} strokeWidth={4} fill="none" opacity={0.6} />
        <path d="M103 70Q102 88 88 100" stroke={OWL.shade} strokeWidth={5} fill="none" opacity={0.35} />
      </g>
      <g data-part="belly">
        <ellipse cx={60} cy={98} rx={27} ry={15} fill={OWL.belly} />
        <path d="M46 94q3 3 6 0M68 94q3 3 6 0M54 102q6 5 12 0" stroke={OWL.bellyLine} strokeWidth={2.2} fill="none" />
      </g>
      <Eye cx={41} mood={mood} side="left" />
      <Eye cx={79} mood={mood} side="right" />
      <g data-part="cheeks" fill={OWL.cheek} opacity={0.9}>
        <circle cx={30} cy={84} r={7} />
        <circle cx={90} cy={84} r={7} />
      </g>
      <g data-part="beak">
        {cheer ? (
          <>
            <path d="M55 73Q60 67 65 73 63 77 60 77T55 73Z" fill={OWL.beak} />
            <path d="M56.500 77Q60 84 63.500 77Q60 75.500 56.500 77Z" fill="#E0644A" />
          </>
        ) : (
          <path d="M55 73Q60 67 65 73 63 81 60 81T55 73Z" fill={OWL.beak} />
        )}
      </g>
      <Wing side="left" angle={wingL} />
      <Wing side="right" angle={wingR} />
      <Outfit outfit={outfit} mood={mood} />
      {cheer && (
        <g data-part="sparkles">
          <g fill={OWL.gold}>
            <path d="M9 30l2.200 5.300L16.500 37.500 11.200 39.700 9 45 6.800 39.700 1.500 37.500 6.800 35.300z" />
            <path d="M111 26l1.800 4.200 4.200 1.800-4.200 1.800L111 38l-1.800-4.200L105 32l4.200-1.800z" />
          </g>
        </g>
      )}
      {mood === "wave" && <Ticks x={102} y={22} />}
      {mood === "think" && (
        <g data-part="thought" fill="none" stroke={OWL.sky} strokeWidth={4.4} strokeLinecap="round">
          <path d="M100 18q0-9 8-9t0 10q-5 2.500-5 7" />
          <circle cx={103} cy={34} r={0.8} fill={OWL.sky} />
        </g>
      )}
      {mood === "sleep" && (
        <g data-part="zzz" fill="none" stroke={OWL.sky} strokeWidth={3.2} strokeLinejoin="round">
          <path d="M97 22h9l-9 10h9" />
          <path d="M108 8h6l-6 7h6" strokeWidth={2.6} />
        </g>
      )}
    </g>
  );
}
