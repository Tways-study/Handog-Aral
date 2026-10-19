import { cn } from "@/lib/utils";

export type MascotMood = "idle" | "cheer" | "think";

interface MascotProps {
  mood?: MascotMood;
  /** Pixel size (number) or any CSS length. */
  size?: number | string;
  className?: string;
  /** Pass a label only when the owl carries meaning; it is decorative (aria-hidden) by default. */
  title?: string;
}

const BROWN = "#8A5A2B";
const BODY = "#A86B34";
const INK = "#1D2340";
const BEAK = "#F08A24";

/** The Handog owl. Flat gouache shapes from the approved comp. No animation by default. */
export default function Mascot({ mood = "idle", size = 96, className, title }: MascotProps) {
  const px = typeof size === "number" ? `${size}px` : size;
  // Pupils: centred (idle), up-and-right (think), slightly larger and lower (cheer).
  const pupil =
    mood === "think" ? { lx: 48, rx: 78, y: 45, r: 7.5 } : mood === "cheer" ? { lx: 45, rx: 75, y: 50, r: 8.5 } : { lx: 45, rx: 75, y: 49, r: 8 };

  return (
    <svg
      viewBox="0 0 120 120"
      width={px}
      height={px}
      className={cn("inline-block shrink-0 select-none", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true, focusable: "false" })}
      data-mood={mood}
    >
      {/* ear tufts */}
      <path d="M22 36 L30 14 L44 30 Z" fill={BROWN} />
      <path d="M98 36 L90 14 L76 30 Z" fill={BROWN} />
      {/* body and belly */}
      <path d="M60 22c-26 0-42 18-42 44 0 28 18 46 42 46s42-18 42-46c0-26-16-44-42-44z" fill={BODY} />
      <path d="M60 58c-16 0-26 12-26 28 0 16 11 24 26 24s26-8 26-24c0-16-10-28-26-28z" fill="#F2D3A0" />
      <path
        d="M46 74q4 3 8 0M66 74q4 3 8 0M44 86q4 3 8 0M58 88q4 3 8 0M70 84q4 3 8 0M52 98q4 3 8 0M64 98q4 3 8 0"
        stroke="#C99A5E"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* eyes */}
      <circle cx="44" cy="48" r="16" fill="#FFF8EA" />
      <circle cx="76" cy="48" r="16" fill="#FFF8EA" />
      <circle cx={pupil.lx} cy={pupil.y} r={pupil.r} fill={INK} />
      <circle cx={pupil.rx} cy={pupil.y} r={pupil.r} fill={INK} />
      <circle cx={pupil.lx + 3} cy={pupil.y - 3} r="2.6" fill="#fff" />
      <circle cx={pupil.rx + 3} cy={pupil.y - 3} r="2.6" fill="#fff" />
      {mood === "think" && <path d="M64 33q9-5 19-1" stroke={BROWN} strokeWidth={3} strokeLinecap="round" fill="none" />}
      {mood === "cheer" && (
        <>
          <path d="M31 28q-5-6-12-5M89 28q5-6 12-5" stroke={BEAK} strokeWidth={3} strokeLinecap="round" fill="none" />
          <path d="M56 58 L60 72 L64 58 Z" fill="#C2410C" />
        </>
      )}
      {/* beak */}
      <path d={mood === "cheer" ? "M54 58 L60 66 L66 58 Z" : "M55 58 L60 68 L65 58 Z"} fill={BEAK} />
      {/* wings */}
      {mood === "cheer" ? (
        <>
          <path d="M22 74c-12-6-14-22-8-34 8 6 16 18 20 34z" fill={BROWN} />
          <path d="M98 74c12-6 14-22 8-34-8 6-16 18-20 34z" fill={BROWN} />
        </>
      ) : mood === "think" ? (
        <>
          <path d="M20 70c-6 10-4 26 6 34 2-12 6-22 10-28z" fill={BROWN} />
          <path d="M100 70c-2 8-8 16-18 22-10 2-18-2-22-8 14-2 28-8 40-14z" fill={BROWN} />
        </>
      ) : (
        <>
          <path d="M20 70c-6 10-4 26 6 34 2-12 6-22 10-28z" fill={BROWN} />
          <path d="M100 70c6 10 4 26-6 34-2-12-6-22-10-28z" fill={BROWN} />
        </>
      )}
      {/* feet */}
      <path d="M44 112l-4 6M50 113l0 6M70 113l0 6M76 112l4 6" stroke={BEAK} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
