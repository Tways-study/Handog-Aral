import type { ReactElement } from "react";
import { OWL } from "@/components/art/OwlGroup";

/** Shared drawing kit for the cute family: same contour, same eyes, same cheeks on every piece. */
export const C = {
  contour: OWL.contour,
  ink: "#1D2340",
  cream: "#FFF8EA",
  paper: "#FFFDF7",
  cheek: OWL.cheek,
  gold: OWL.gold,
  sunrise: "#F08A24",
  sunriseShade: "#D96E0F",
  marker: "#FFD49A",
  indigo: "#2B3A8C",
  kangkong: "#2E7D55",
  mint: "#6CC596",
  gumamela: "#C8323A",
  white: "#FFFFFF",
} as const;

export const CW = 2.4;

/** Glossy kawaii eye: ink disc, one large and one small white highlight. */
export function Eye({ cx, cy, r = 5 }: { cx: number; cy: number; r?: number }): ReactElement {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.ink} />
      <circle cx={cx - r * 0.34} cy={cy - r * 0.38} r={r * 0.4} fill="#fff" />
      <circle cx={cx + r * 0.36} cy={cy + r * 0.4} r={r * 0.2} fill="#fff" />
    </g>
  );
}

/** Two eyes, rosy cheeks and a tiny smile, centred on (cx, cy). */
export function Face({ cx, cy, gap = 22, r = 5, mouth = true }: { cx: number; cy: number; gap?: number; r?: number; mouth?: boolean }): ReactElement {
  return (
    <g>
      <Eye cx={cx - gap / 2} cy={cy} r={r} />
      <Eye cx={cx + gap / 2} cy={cy} r={r} />
      <circle cx={cx - gap / 2 - r * 1.5} cy={cy + r * 1.5} r={r * 0.9} fill={C.cheek} opacity={0.7} />
      <circle cx={cx + gap / 2 + r * 1.5} cy={cy + r * 1.5} r={r * 0.9} fill={C.cheek} opacity={0.7} />
      {mouth && <path d={`M${cx - 3.6} ${cy + r * 1.35}q3.6 3.8 7.2 0`} stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />}
    </g>
  );
}

/** A four-point sparkle centred on (cx, cy). */
export function Sparkle({ cx, cy, s = 6, fill = C.gold, stroke = C.contour }: { cx: number; cy: number; s?: number; fill?: string; stroke?: string | null }): ReactElement {
  const k = s * 0.28;
  return (
    <path
      d={`M${cx} ${cy - s}Q${cx + k} ${cy - k} ${cx + s} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + s}Q${cx - k} ${cy + k} ${cx - s} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - s}Z`}
      fill={fill}
      stroke={stroke ?? "none"}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  );
}

/** Rounded star path (use with a round linejoin stroke). */
export function starPath(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}
