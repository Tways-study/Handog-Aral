"use client";

// Dev/QA aid only, like /design: picked up as a route only when next.config.ts lists the "dev.tsx" page
// extension. The art showcase: every owl mood x outfit, covers, stickers, stamps and empty-state art,
// on a light and a dark panel side by side (the dark panel scopes the `.dark` tokens).
import { notFound } from "next/navigation";
import { BookOpen, Lock, Moon, Palette, Sparkles, Stamp, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyQuiz, EmptyShelf, EmptyWords, NotFoundArt, OfflineArt, PeekOverNotebook } from "@/components/art";
import BookCover from "@/components/BookCover";
import { StampShape } from "@/components/DifficultyStamp";
import Mascot, { type MascotMood } from "@/components/Mascot";
import StampCheck from "@/components/StampCheck";
import StampStar from "@/components/StampStar";
import StickerArt from "@/components/stickers/StickerArt";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STICKER_IDS } from "@/lib/stickers/ids";
import type { CoverId, Jacket } from "@/shared/types";

const MOODS: MascotMood[] = ["idle", "cheer", "think", "wave", "sleep"];
const OUTFITS = ["none", "glasses", "cap", "bow"] as const;
const COVERS: { id: CoverId; jacket: Jacket }[] = [
  { id: "fox", jacket: "indigo" },
  { id: "star", jacket: "kangkong" },
  { id: "rice", jacket: "mango" },
  { id: "rainbow", jacket: "gumamela" },
  { id: "turtle", jacket: "indigo" },
  { id: "basket", jacket: "kangkong" },
];
const JACKETS: Jacket[] = ["indigo", "kangkong", "mango", "gumamela"];

/** The same content on a light panel and a dark panel. */
function Both({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] p-4 text-[var(--ink-2)]">
        <Badge variant="secondary" className="mb-3 gap-1">
          <Sun className="size-3.5" aria-hidden="true" /> Light
        </Badge>
        {children}
      </div>
      {/* --background is resolved at :root, so paint from --paper, which .dark redefines */}
      <div className="dark rounded-3xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] p-4 text-[var(--ink-2)]">
        <Badge variant="secondary" className="mb-3 gap-1">
          <Moon className="size-3.5" aria-hidden="true" /> Night
        </Badge>
        {children}
      </div>
    </div>
  );
}

function Section({ icon, title, note, children }: { icon: ReactNode; title: string; note?: string; children: ReactNode }) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-2xl">
          {icon}
          {title}
        </CardTitle>
        {note && <CardDescription>{note}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Both>{children}</Both>
      </CardContent>
    </Card>
  );
}

function OwlGrid({ size }: { size: number }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{size} px</p>
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {OUTFITS.flatMap((outfit) => MOODS.map((mood) => <Mascot key={`${outfit}-${mood}`} mood={mood} outfit={outfit} size={size} />))}
      </div>
    </div>
  );
}

export default function ArtShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-8">
      <h1 className="flex items-center gap-2 font-heading text-4xl font-extrabold">
        <Palette aria-hidden="true" /> Art showcase
      </h1>
      <p className="mt-1 text-muted-foreground">Owl family, covers, stickers, stamps and empty states. Dev only.</p>

      <Section icon={<Sparkles aria-hidden="true" />} title="Owl" note="5 moods (idle, cheer, think, wave, sleep) by 4 outfits (none, glasses, cap, bow). Each size shows every combination.">
        <div className="space-y-6">
          <OwlGrid size={64} />
          <OwlGrid size={120} />
          <OwlGrid size={240} />
        </div>
      </Section>

      <Section icon={<BookOpen aria-hidden="true" />} title="Book covers" note="Six motifs in four jackets, at 120 px and 280 px.">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            {COVERS.map((c) => (
              <div key={c.id} className="w-[120px]">
                <BookCover coverId={c.id} jacket={c.jacket} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-6">
            {COVERS.slice(0, 4).map((c, i) => (
              <div key={c.id} className="w-[280px]">
                <BookCover coverId={c.id} jacket={JACKETS[(i + 1) % 4]} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={<Sparkles aria-hidden="true" />} title="Stickers" note="Die-cut stickers at 96 px; small row at 48 px; second block is the locked silhouette.">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-4">
            {STICKER_IDS.map((id) => (
              <StickerArt key={id} id={id} size={96} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {STICKER_IDS.map((id) => (
              <StickerArt key={id} id={id} size={48} />
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Lock className="size-4" aria-hidden="true" /> Locked
          </p>
          <div className="flex flex-wrap gap-4">
            {STICKER_IDS.map((id) => (
              <StickerArt key={id} id={id} locked size={96} />
            ))}
          </div>
        </div>
      </Section>

      <Section icon={<Stamp aria-hidden="true" />} title="Stamps" note="Star and check at chip size (26 px) and card size (52 px), then the difficulty shapes.">
        <div className="space-y-4">
          {[26, 52].map((s) => (
            <div key={s} className="flex flex-wrap items-center gap-4">
              {[0, 1, 2].map((i) => (
                <StampStar key={i} size={s} seed={i} />
              ))}
              {[0, 1].map((i) => (
                <StampCheck key={i} size={s} seed={i} />
              ))}
            </div>
          ))}
          <div className="flex items-center gap-4">
            <StampShape level="easy" />
            <StampShape level="medium" />
            <StampShape level="hard" />
          </div>
        </div>
      </Section>

      <Section icon={<BookOpen aria-hidden="true" />} title="Empty states and decoration" note="EmptyShelf, EmptyWords, EmptyQuiz, OfflineArt, NotFoundArt, PeekOverNotebook (the loading frame).">
        <div className="flex flex-wrap gap-4">
          <EmptyShelf size={200} />
          <EmptyWords size={200} />
          <EmptyQuiz size={200} />
          <OfflineArt size={200} />
          <NotFoundArt size={200} />
          <PeekOverNotebook size={200} />
        </div>
      </Section>
    </main>
  );
}
