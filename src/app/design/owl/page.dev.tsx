"use client";

// Dev/QA aid only (page.dev.tsx is a route only under `next dev`). Showcase of the 3D owl.
import { useEffect, useState } from "react";
import { Activity, ArrowUpFromLine, Hand, Lightbulb, PartyPopper } from "lucide-react";
import Owl, { type OwlMood, type OwlOutfit, type OwlReaction } from "@/components/owl/Owl";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setOwlForceSvg } from "@/lib/owl/capability";
import { setOwlSlotLimit } from "@/lib/owl/slots";
import { owlStats } from "@/lib/owl/stats";

const MOODS: OwlMood[] = ["idle", "cheer", "think", "wave", "sleep"];
const OUTFITS: OwlOutfit[] = ["none", "glasses", "cap", "bow"];
const SIZES = ["64", "96", "160", "240"];
const REACTIONS: { kind: OwlReaction["kind"]; label: string; icon: typeof Hand }[] = [
  { kind: "hop", label: "Hop", icon: ArrowUpFromLine },
  { kind: "cheer", label: "Cheer", icon: PartyPopper },
  { kind: "think", label: "Think", icon: Lightbulb },
  { kind: "wave", label: "Wave", icon: Hand },
];

export default function OwlShowcase() {
  const [size, setSize] = useState("160");
  const [only, setOnly] = useState("all");
  const [bg, setBg] = useState<"light" | "dark">("light");
  const [forceSvg, setForceSvg] = useState(false);
  const [reaction, setReaction] = useState<OwlReaction>({ kind: "hop", key: 0 });
  const [taps, setTaps] = useState(0);
  const [stats, setStats] = useState({ frames: 0, ms: 0 });

  useEffect(() => {
    const id = setInterval(() => setStats({ frames: owlStats.frames, ms: owlStats.avgDtMs }), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    // The page limit is one live 3D owl; the showcase lifts it so every mood can be reviewed at once.
    setOwlSlotLimit(Number(new URLSearchParams(location.search).get("slots") ?? 12));
    return () => {
      setOwlForceSvg(false);
      setOwlSlotLimit(1);
    };
  }, []);

  const px = Number(size);
  return (
    <main className={`min-h-screen p-4 ${bg === "dark" ? "bg-[#14182e] text-white" : "bg-paper text-ink"}`} data-testid="owl-showcase">
      <h1 className="font-heading text-2xl font-bold">3D owl showcase</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ToggleGroup type="single" value={size} onValueChange={(v) => v && setSize(v)} variant="outline" aria-label="Size">
          {SIZES.map((s) => (
            <ToggleGroupItem key={s} value={s} aria-label={`${s} pixels`}>
              {s}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup type="single" value={bg} onValueChange={(v) => v && setBg(v as "light" | "dark")} variant="outline" aria-label="Background">
          <ToggleGroupItem value="light">Light</ToggleGroupItem>
          <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" value={only} onValueChange={(v) => v && setOnly(v)} variant="outline" aria-label="Mood filter">
          {["all", ...MOODS].map((m) => (
            <ToggleGroupItem key={m} value={m} aria-label={`show ${m}`}>
              {m}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant={forceSvg ? "default" : "outline"}
          aria-pressed={forceSvg}
          onClick={() => {
            setOwlForceSvg(!forceSvg);
            setForceSvg(!forceSvg);
          }}
        >
          Force SVG fallback
        </Button>
        <span className="inline-flex items-center gap-1 text-sm" data-testid="owl-stats">
          <Activity className="size-4" aria-hidden /> frames {stats.frames} · {stats.ms ? stats.ms.toFixed(1) : "-"} ms/frame
        </span>
      </div>

      <section className="mt-6 flex flex-wrap items-center gap-6">
        <div className="flex flex-col items-center gap-2" data-testid="interactive-owl">
          <Owl interactive priority="hero" size={240} title="Tap the owl" onTap={() => setTaps((t) => t + 1)} reaction={reaction} />
          <p className="text-sm" data-testid="tap-count">taps: {taps}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map(({ kind, label, icon: Icon }) => (
            <Button key={kind} variant="outline" onClick={() => setReaction((r) => ({ kind, key: r.key + 1 }))}>
              <Icon className="size-4" aria-hidden /> {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="mt-8 overflow-x-auto" aria-label="Moods and outfits">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${OUTFITS.length}, max-content)` }}>
          {MOODS.filter((m) => only === "all" || m === only).flatMap((m) =>
            OUTFITS.map((o) => (
              <figure key={`${m}-${o}`} className="m-0 flex flex-col items-center gap-1" data-cell={`${m}-${o}`}>
                <Owl mood={m} outfit={o} size={px} />
                <figcaption className="text-xs">
                  {m} / {o}
                </figcaption>
              </figure>
            )),
          )}
        </div>
      </section>
    </main>
  );
}
