import { useId } from "react";
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

const CREAM = "#FFF8EA";
const INK = "#1D2340";

/** Six flat-gouache motifs, drawn in a 160x210 notebook. Motif area is roughly x 30-140, y 80-196. */
function Motif({ id }: { id: CoverId }) {
  switch (id) {
    case "fox":
      return (
        <g>
          <path d="M52 132 L60 98 L82 124 Z" fill="#F08A24" />
          <path d="M128 132 L120 98 L98 124 Z" fill="#F08A24" />
          <path d="M60 124 L63 108 L75 122 Z" fill={CREAM} />
          <path d="M120 124 L117 108 L105 122 Z" fill={CREAM} />
          <path d="M48 128 Q90 108 132 128 L108 176 Q90 188 72 176 Z" fill="#F08A24" />
          <path d="M70 152 Q90 142 110 152 Q106 172 90 182 Q74 172 70 152 Z" fill={CREAM} />
          <ellipse cx="90" cy="168" rx="5" ry="3.6" fill={INK} />
          <circle cx="75" cy="142" r="3.8" fill={INK} />
          <circle cx="105" cy="142" r="3.8" fill={INK} />
          <path d="M82 175q8 6 16 0" stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M90 92 L103 125 L139 128 L111 151 L120 186 L90 167 L60 186 L69 151 L41 128 L77 125 Z" fill="#2B3A8C" />
          <path d="M90 108 L98 128 L120 130 L103 144 L108 166 L90 155 L72 166 L77 144 L60 130 L82 128 Z" fill="#F08A24" />
          <circle cx="40" cy="104" r="3.5" fill="#2B3A8C" />
          <circle cx="140" cy="100" r="3" fill="#2B3A8C" />
          <circle cx="132" cy="182" r="3.5" fill="#2B3A8C" />
          <path d="M42 176v10M37 181h10" stroke="#2B3A8C" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "rice":
      return (
        <g>
          <circle cx="116" cy="112" r="14" fill="#F2B233" />
          <path d="M0 210V152q20-12 40 0t40 0 40 0 40 0V210Z" fill="#1F5C3C" />
          <g stroke="#FFF8EA" strokeWidth={3} strokeLinecap="round" fill="none">
            <path d="M50 192V136M50 150q-8-4-10-12M50 150q8-4 10-12M50 164q-8-4-10-12M50 164q8-4 10-12" />
            <path d="M88 192V122M88 138q-8-4-10-12M88 138q8-4 10-12M88 154q-8-4-10-12M88 154q8-4 10-12M88 170q-8-4-10-12M88 170q8-4 10-12" />
            <path d="M126 192V140M126 154q-8-4-10-12M126 154q8-4 10-12M126 168q-8-4-10-12M126 168q8-4 10-12" />
          </g>
          <g fill="#F2B233">
            <ellipse cx="50" cy="132" rx="3.5" ry="6" />
            <ellipse cx="88" cy="117" rx="3.5" ry="6" />
            <ellipse cx="126" cy="135" rx="3.5" ry="6" />
          </g>
        </g>
      );
    case "rainbow":
      return (
        <g>
          <path d="M32 186a58 58 0 0 1 116 0" fill="none" stroke="#F2B233" strokeWidth={11} />
          <path d="M43 186a47 47 0 0 1 94 0" fill="none" stroke="#FFF8EA" strokeWidth={11} />
          <path d="M54 186a36 36 0 0 1 72 0" fill="none" stroke="#7FB2F0" strokeWidth={11} />
          <path d="M65 186a25 25 0 0 1 50 0" fill="none" stroke="#8ED1A6" strokeWidth={11} />
          <path d="M22 196q-2-14 12-14 4-10 16-6 8-6 16 2 12 0 12 12v6z" fill={CREAM} />
          <path d="M104 196q-2-12 10-12 4-8 14-4 6-4 14 2 10 0 10 10v4z" fill={CREAM} />
        </g>
      );
    case "turtle":
      return (
        <g>
          <path d="M44 172q0-48 46-48t46 48z" fill="#6CC596" />
          <path d="M90 124v48M66 140l24 14 24-14M56 172l34-18 34 18" stroke="#2E7D55" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M36 172h108a5 5 0 0 1 0 10H36a5 5 0 0 1 0-10z" fill={CREAM} />
          <path d="M126 150q16-2 18 8-6 8-18 4z" fill={CREAM} />
          <circle cx="137" cy="154" r="2.3" fill={INK} />
          <path d="M50 182v10q0 4 6 4h8q4 0 4-6v-8zM104 182v10q0 4 6 4h8q4 0 4-6v-8z" fill={CREAM} />
          <path d="M30 176l-8 4 8 3z" fill={CREAM} />
        </g>
      );
    case "basket":
      return (
        <g>
          <path d="M52 132q0-34 38-34t38 34" fill="none" stroke="#8A5A2B" strokeWidth={6} strokeLinecap="round" />
          <circle cx="72" cy="128" r="11" fill="#C8323A" />
          <circle cx="92" cy="120" r="12" fill="#2E7D55" />
          <circle cx="110" cy="128" r="10" fill="#F08A24" />
          <path d="M90 108q4-8 10-8" stroke="#2E7D55" strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <path d="M36 136h108l-14 56q-1 4-6 4H56q-5 0-6-4z" fill="#A86B34" />
          <path d="M40 150h100M44 164h92M48 178h84" stroke="#8A5A2B" strokeWidth={3} />
          <path d="M66 138l-6 54M90 138v58M114 138l6 54" stroke="#8A5A2B" strokeWidth={3} />
        </g>
      );
  }
}

/** A notebook cover in the book's jacket colour, with a spine, a label plate and one flat-gouache motif. */
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
          <path d="M6 0H138a22 22 0 0 1 22 22V188a22 22 0 0 1-22 22H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z" />
        </clipPath>
      </defs>
      <path
        d="M6 0H138a22 22 0 0 1 22 22V188a22 22 0 0 1-22 22H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z"
        fill={JACKET_FILL[jacket]}
      />
      <path d="M0 6a6 6 0 0 1 6-6h8v210H6a6 6 0 0 1-6-6z" fill="#000" opacity="0.22" />
      {label && (
        <g>
          <rect x="34" y="20" width="100" height="46" rx="9" fill="#FFFDF7" stroke="#000" strokeOpacity="0.08" strokeWidth={2} />
          <path d="M44 40h80M44 54h56" stroke="#C3D3EE" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      <g clipPath={`url(#${clipId})`}>
        <Motif id={coverId} />
      </g>
    </svg>
  );
}
