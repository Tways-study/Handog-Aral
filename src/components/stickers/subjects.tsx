import type { ReactElement } from "react";
import OwlGroup from "@/components/art/OwlGroup";
import { C, CW, Sparkle, starPath } from "@/components/art/parts";
import type { StickerId } from "@/lib/stickers/ids";

/** Inner disc colour and die-cut shape per sticker. Subjects live in the 14..82 box of a 96x96 sticker. */
export const STICKER_LOOK: Record<StickerId, { shape: "circle" | "card"; bg: string }> = {
  "first-word": { shape: "card", bg: "#FFE3B8" },
  "five-words": { shape: "card", bg: "#CDEBD8" },
  "ten-words": { shape: "card", bg: "#D3DBF7" },
  "twenty-five-words": { shape: "card", bg: "#F9D3D0" },
  "hard-word": { shape: "circle", bg: "#CFE3F8" },
  "first-scan": { shape: "card", bg: "#E4DCF5" },
  "first-listen": { shape: "circle", bg: "#FFE3B8" },
  "first-quiz": { shape: "card", bg: "#CDEBD8" },
  "quiz-perfect": { shape: "circle", bg: "#FFF0B8" },
  "match-first": { shape: "circle", bg: "#F9D3D0" },
  "streak-3": { shape: "circle", bg: "#FFE3B8" },
  "streak-7": { shape: "circle", bg: "#F5CFC9" },
  "first-book": { shape: "card", bg: "#D3DBF7" },
  "all-books": { shape: "card", bg: "#FFF0B8" },
};

const line = { stroke: C.contour, strokeWidth: CW, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const HEADING = 'var(--font-baloo), "Baloo 2", ui-rounded, system-ui, sans-serif';

function Num({ x, y, size, children }: { x: number; y: number; size: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={HEADING} fontWeight={800} fontSize={size} fill="#fff" stroke={C.contour} strokeWidth={size * 0.2} paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  );
}

function WordCard({ x, y, rot = 0, w = 40, h = 30, fill = C.paper }: { x: number; y: number; rot?: number; w?: number; h?: number; fill?: string }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6} fill={fill} {...line} />
      <path d={`M${x - w / 2 + 7} ${y + h / 2 - 8}h${w - 14}`} stroke="#C3D3EE" strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

function Stack({ n, badge, size = 17 }: { n: number; badge: string; size?: number }) {
  const cards = Array.from({ length: n }, (_, i) => i);
  return (
    <g>
      {cards.map((i) => (
        <WordCard key={i} x={46 + (i % 2 ? 2 : -2)} y={66 - i * 9} rot={(i % 2 ? 4 : -4) + i} />
      ))}
      <path d="M36 46h22" stroke={C.ink} strokeWidth={0} />
      <circle cx={66} cy={64} r={badge.length > 1 ? 15 : 13} fill={C.sunrise} {...line} />
      <path d="M57 56Q62 52 68 52" stroke="#FFC27A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Num x={66} y={64 + size * 0.34} size={size}>{badge}</Num>
    </g>
  );
}

function Flame({ x, y, s, outer, inner, core }: { x: number; y: number; s: number; outer: string; inner: string; core?: string }) {
  const d = "M0 -24C3 -14 15 -10 15 5C15 17 8 24 0 24C-8 24 -15 17 -15 5C-15 -3 -10 -6 -7 -13C-3 -9 -2 -15 0 -24Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill={outer} stroke={C.contour} strokeWidth={CW / s} strokeLinejoin="round" />
      <path d={d} fill={inner} transform="translate(0 7) scale(0.6)" />
      {core && <path d={d} fill={core} transform="translate(0 13) scale(0.32)" />}
      <path d="M-10 4Q-10 -3 -6 -8" stroke="#fff" strokeOpacity={0.6} strokeWidth={3 / s} strokeLinecap="round" fill="none" />
    </g>
  );
}

export function Subject({ id }: { id: StickerId }): ReactElement {
  switch (id) {
    case "first-word":
      return (
        <g>
          <WordCard x={48} y={50} rot={-7} w={48} h={40} />
          <path d="M37 62 48 34 59 62M41.5 53h13" transform="rotate(-7 48 50)" stroke={C.contour} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M37 62 48 34 59 62M41.5 53h13" transform="rotate(-7 48 50)" stroke={C.sunrise} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Sparkle cx={70} cy={28} s={9} />
          <Sparkle cx={24} cy={72} s={5} fill="#fff" />
        </g>
      );
    case "five-words":
      return <Stack n={2} badge="5" />;
    case "ten-words":
      return <Stack n={3} badge="10" size={16} />;
    case "twenty-five-words":
      return (
        <g>
          <Stack n={4} badge="25" size={15} />
          <Sparkle cx={78} cy={22} s={6} />
        </g>
      );
    case "hard-word":
      return (
        <g {...line}>
          <path d="M16 74 40 34Q42 30 44 34L68 74Z" fill="#8F9FE0" />
          <path d="M34 74 60 42Q62 38 64 42L84 74Z" fill={C.indigo} />
          <path d="M36 44 40 36 44 44Q40 48 36 44Z" fill="#fff" strokeWidth={1.8} />
          <path d="M56 52 62 44 68 52Q62 56 56 52Z" fill="#fff" strokeWidth={1.8} />
          <path d="M40 34V20" strokeWidth={3} />
          <path d="M40 20 56 24 40 30Z" fill={C.gumamela} />
          <circle cx={74} cy={26} r={6} fill={C.gold} strokeWidth={1.8} />
        </g>
      );
    case "first-scan":
      return (
        <g>
          <g transform="rotate(-4 44 50)">
            <rect x={26} y={24} width={40} height={50} rx={6} fill={C.paper} {...line} />
            <path d="M33 36h26M33 44h26M33 52h16" stroke="#C3D3EE" strokeWidth={2.6} strokeLinecap="round" />
          </g>
          <path d="M18 34V24Q18 18 24 18h10M72 18h10Q86 18 86 24v10M86 62v10Q86 78 80 78H72M34 78H24Q18 78 18 72V62" stroke={C.contour} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M18 34V24Q18 18 24 18h10M72 18h10Q86 18 86 24v10M86 62v10Q86 78 80 78H72M34 78H24Q18 78 18 72V62" stroke={C.sunrise} strokeWidth={3.6} fill="none" strokeLinecap="round" />
          <path d="M22 50h62" stroke={C.sunrise} strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
          <g transform="translate(54 50) scale(0.36)">
            <OwlGroup mood="idle" />
          </g>
        </g>
      );
    case "first-listen":
      return (
        <g>
          <g transform="translate(5 24) scale(0.55)">
            <OwlGroup mood="idle" />
          </g>
          <g fill="none" strokeLinecap="round">
            <path d="M70 42Q75 48 70 54M76 35Q86 48 76 61" stroke="#fff" strokeWidth={7.5} />
            <path d="M70 42Q75 48 70 54M76 35Q86 48 76 61" stroke={C.contour} strokeWidth={5.8} />
            <path d="M70 42Q75 48 70 54M76 35Q86 48 76 61" stroke={C.indigo} strokeWidth={3.2} />
          </g>
        </g>
      );
    case "first-quiz":
      return (
        <g>
          <g transform="rotate(-5 48 50)">
            <rect x={26} y={18} width={44} height={58} rx={8} fill={C.indigo} {...line} />
            <path d="M26 18h8v58h-8z" fill="#000" opacity={0.2} />
            <rect x={34} y={26} width={30} height={42} rx={5} fill={C.paper} />
            <path d="M40 38h18M40 60h14" stroke="#C3D3EE" strokeWidth={2.6} strokeLinecap="round" />
          </g>
          <path d="M40 50 49 59 70 36" stroke={C.contour} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 50 49 59 70 36" stroke={C.kangkong} strokeWidth={7.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Sparkle cx={74} cy={24} s={7} />
        </g>
      );
    case "quiz-perfect":
      return (
        <g {...line}>
          <path d="M33 30Q16 28 20 42Q24 54 38 54M63 30Q80 28 76 42Q72 54 58 54" fill="none" strokeWidth={6.5} />
          <path d="M33 30Q16 28 20 42Q24 54 38 54M63 30Q80 28 76 42Q72 54 58 54" fill="none" stroke={C.gold} strokeWidth={3} />
          <path d="M31 20H65V36Q65 56 48 58Q31 56 31 36Z" fill={C.gold} />
          <path d="M37 24V36Q37 48 44 52" stroke="#FFF3C4" strokeWidth={3.5} fill="none" />
          <path d={starPath(48, 38, 9, 4.2)} fill="#fff" strokeWidth={1.6} />
          <path d="M44 58H52V68H44Z" fill={C.gold} />
          <path d="M34 68H62Q66 68 66 72V74H30V72Q30 68 34 68Z" fill="#D99A1F" />
          <Sparkle cx={78} cy={26} s={7.5} fill="#fff" />
          <Sparkle cx={20} cy={64} s={5} />
        </g>
      );
    case "match-first":
      return (
        <g>
          <g transform="rotate(-12 38 52)">
            <rect x={20} y={28} width={34} height={46} rx={7} fill={C.indigo} {...line} />
            <path d={starPath(37, 51, 8.5, 4)} fill={C.marker} stroke="none" />
          </g>
          <g transform="rotate(11 60 50)">
            <rect x={43} y={24} width={34} height={46} rx={7} fill={C.paper} {...line} />
            <path d="M60 58C46 50 49 38 55 38Q60 38 60 43Q60 38 65 38C71 38 74 50 60 58Z" fill={C.gumamela} {...line} strokeWidth={1.8} />
          </g>
          <Sparkle cx={76} cy={20} s={6} />
        </g>
      );
    case "streak-3":
      return (
        <g>
          <Flame x={32} y={62} s={0.9} outer={C.sunrise} inner={C.gold} />
          <Flame x={58} y={50} s={1.35} outer={C.sunrise} inner={C.gold} core="#FFF3C4" />
          <Num x={58} y={62} size={22}>3</Num>
        </g>
      );
    case "streak-7":
      return (
        <g>
          <Flame x={30} y={64} s={0.85} outer={C.sunrise} inner={C.gold} />
          <Flame x={60} y={48} s={1.5} outer={C.gumamela} inner={C.sunrise} core="#FFE08A" />
          <Num x={60} y={62} size={23}>7</Num>
          <Sparkle cx={22} cy={30} s={6} />
          <Sparkle cx={80} cy={24} s={5} fill="#fff" />
        </g>
      );
    case "first-book":
      return (
        <g>
          <g transform="rotate(-5 46 48)">
            <rect x={26} y={16} width={44} height={58} rx={8} fill={C.gumamela} {...line} />
            <path d="M26 16h8v58h-8z" fill="#000" opacity={0.2} />
            <rect x={39} y={24} width={26} height={16} rx={5} fill={C.paper} />
            <path d="M44 32h16" stroke="#C3D3EE" strokeWidth={2.4} strokeLinecap="round" />
            <path d="M54 74V90L60 85 66 90V74Z" fill={C.indigo} {...line} strokeWidth={2} />
          </g>
          <Sparkle cx={74} cy={26} s={8} />
          <Sparkle cx={20} cy={56} s={5} fill="#fff" />
        </g>
      );
    case "all-books": {
      const books = [
        { x: 16, h: 38, f: C.indigo },
        { x: 26, h: 46, f: C.kangkong },
        { x: 36, h: 36, f: C.gold },
        { x: 46, h: 48, f: C.gumamela },
        { x: 56, h: 40, f: C.sunrise },
        { x: 66, h: 44, f: C.mint },
      ];
      return (
        <g>
          {books.map((b, i) => (
            <g key={b.x} transform={i === 4 ? `rotate(8 ${b.x + 4.5} 74)` : undefined}>
              <rect x={b.x} y={74 - b.h} width={9} height={b.h} rx={3} fill={b.f} {...line} strokeWidth={2} />
              <path d={`M${b.x + 2.5} ${74 - b.h + 8}h4`} stroke="#fff" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
            </g>
          ))}
          <rect x={12} y={74} width={72} height={7} rx={3.5} fill="#C48A4E" {...line} />
          <Sparkle cx={78} cy={22} s={7} />
        </g>
      );
    }
  }
}
