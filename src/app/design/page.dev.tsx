"use client";

// Dev/QA aid only. `page.dev.tsx` is picked up as a route only when next.config.ts lists the
// "dev.tsx" page extension (next dev on the web target); production and Capacitor builds skip it.
import { useRef, useState } from "react";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Moon, ScanLine, Sparkles, Star, Sun, Volume2 } from "lucide-react";
import BookCover from "@/components/BookCover";
import DifficultyStamp from "@/components/DifficultyStamp";
import Mascot from "@/components/Mascot";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sampleBooks } from "@/data/books";
import { useMotion } from "@/lib/motion";
import { useSettings } from "@/stores/settings";

const SWATCHES: { group: string; tokens: string[] }[] = [
  { group: "Paper and ink", tokens: ["paper", "paper-2", "card-surface", "ink", "ink-2", "rule", "margin", "line", "line-strong"] },
  { group: "Sunrise and marker", tokens: ["sunrise", "sunrise-ink", "marker", "ring"] },
  { group: "Jackets", tokens: ["indigo", "kangkong", "mango", "gumamela"] },
  { group: "Stamps and states", tokens: ["stamp-easy", "stamp-medium", "stamp-hard", "success", "warning", "destructive"] },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-heading text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { theme, setTheme, fontSize, setFontSize, dyslexiaFont, setDyslexiaFont, colorOverlay, setColorOverlay } = useSettings();
  const { markWord, stampIn, enterPanel } = useMotion();
  const wordRef = useRef<HTMLSpanElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [tapped, setTapped] = useState(true);
  const [speed, setSpeed] = useState([0.8]);

  return (
    <PageContainer>
      <PageHeader
        title="Pad Paper Storybook"
        subtitle="Design system showcase. Dev only."
        trailing={
          <Button
            variant="secondary"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border-[1.5px] bg-card p-4">
        <ToggleGroup type="single" value={fontSize} onValueChange={(v) => v && setFontSize(v as typeof fontSize)} variant="outline" aria-label="Font size">
          {(["small", "medium", "large"] as const).map((s) => (
            <ToggleGroupItem key={s} value={s} onClick={() => {
              document.documentElement.classList.remove("font-small", "font-medium", "font-large");
              document.documentElement.classList.add(`font-${s}`);
            }}>{s}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-3">
          <Switch id="dys" checked={dyslexiaFont} onCheckedChange={(v) => { setDyslexiaFont(v); document.body.classList.toggle("dyslexia-font", v); }} />
          <Label htmlFor="dys">Dyslexia font</Label>
        </div>
        <ToggleGroup type="single" value={colorOverlay} onValueChange={(v) => v && setColorOverlay(v as typeof colorOverlay)} variant="outline" aria-label="Colour overlay">
          {(["none", "yellow", "blue", "pink"] as const).map((o) => (
            <ToggleGroupItem key={o} value={o}>{o}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Section title="Colour tokens">
        <div className="space-y-5">
          {SWATCHES.map((g) => (
            <div key={g.group}>
              <h3 className="mb-2 font-heading text-lg font-bold">{g.group}</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {g.tokens.map((t) => (
                  <div key={t} className="overflow-hidden rounded-xl border-[1.5px]">
                    <div className="h-12" style={{ background: `var(--${t})` }} />
                    <p className="bg-card px-2 py-1 text-xs font-bold">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <div className="space-y-2">
          <p className="font-heading text-5xl font-extrabold">Baloo 2 display</p>
          <p className="font-heading text-3xl font-bold">Heading, Maayong aga, Ana!</p>
          <p className="font-heading text-xl font-bold">Subheading for a section</p>
          <p className="text-base">Body in Atkinson Hyperlegible, 16px. The small fox ran through the enormous forest.</p>
          <p className="text-[0.9375rem] text-ink-2">Secondary text, 15px, in ink-2.</p>
          <p className="text-sm font-bold text-ink-2">Caption 14px bold</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button><Bookmark /> Tipigi</Button>
          <Button variant="ink"><Volume2 /> Pamatii</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small 44</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Star"><Star /></Button>
          <Button size="icon-lg" aria-label="Scan"><ScanLine /></Button>
        </div>
        <Button size="xl" className="mt-4 w-full max-w-md"><ScanLine /> I-scan ang pahina</Button>
      </Section>

      <Section title="Motion helpers">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => { setTapped(true); requestAnimationFrame(() => markWord(wordRef.current)); }}>Mark word</Button>
          <Button variant="secondary" onClick={() => stampIn(stampRef.current)}>Stamp in</Button>
          <Button variant="secondary" onClick={() => enterPanel(panelRef.current)}>Enter panel</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <p className="text-xl">
            The fox ran through the{" "}
            <span ref={wordRef} className="word-mark" data-state={tapped ? "tapped" : undefined}>enormous</span> forest and{" "}
            <span className="word-mark" data-state="saved">whispered</span>.
          </p>
          <div ref={stampRef} className="grid size-16 place-items-center rounded-full border-[3px] border-stamp-hard text-stamp-hard" aria-label="Star stamp" role="img">
            <Star className="size-8" />
          </div>
          <div ref={panelRef} className="rounded-2xl border-[1.5px] bg-card p-4 shadow-md">Word panel content</div>
        </div>
      </Section>

      <Section title="Components">
        <div className="grid items-start gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Cards are paper with a line border.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nm">Name</Label>
                <Input id="nm" placeholder="Ana" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sw">Notifications</Label>
                <Switch id="sw" defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sl">Voice speed {speed[0].toFixed(1)}</Label>
                <Slider id="sl" min={0.4} max={1.2} step={0.1} value={speed} onValueChange={setSpeed} />
              </div>
              <Progress value={60} aria-label="Progress" />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Tabs defaultValue="a">
              <TabsList>
                <TabsTrigger value="a">Tanan</TabsTrigger>
                <TabsTrigger value="b">Dali</TabsTrigger>
                <TabsTrigger value="c">Budlay</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="pt-2">All words.</TabsContent>
              <TabsContent value="b" className="pt-2">Easy words.</TabsContent>
              <TabsContent value="c" className="pt-2">Hard words.</TabsContent>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              <Badge variant="chip"><Star className="text-warning-text" />12 ka bituon</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Natapos</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Alert><Sparkles /><AlertTitle>Gin-explain sang AI</AlertTitle><AlertDescription>Konektado kag handa.</AlertDescription></Alert>
            <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Indi ma-scan ang pahina.</AlertDescription></Alert>
            <Alert variant="warning"><AlertTitle>Warning</AlertTitle><AlertDescription>Offline pack is not downloaded.</AlertDescription></Alert>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Reset progress?</DialogTitle><DialogDescription>This removes saved words on this device.</DialogDescription></DialogHeader>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild><Button variant="secondary">Sheet</Button></SheetTrigger>
            <SheetContent><SheetHeader><SheetTitle>Sheet</SheetTitle><SheetDescription>Side panel.</SheetDescription></SheetHeader></SheetContent>
          </Sheet>
          <Drawer>
            <DrawerTrigger asChild><Button variant="secondary">Drawer (word sheet)</Button></DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="font-heading text-4xl font-extrabold">enormous</DrawerTitle>
                <DrawerDescription>/ih-NOR-mus/</DrawerDescription>
              </DrawerHeader>
              <div className="space-y-3 px-5 pb-6">
                <DifficultyStamp level="hard" />
                <p className="rounded-2xl bg-secondary p-4 text-xl font-bold">Daku gid-gid, mas daku pa sa ordinaryo.</p>
              </div>
            </DrawerContent>
          </Drawer>
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline">Tooltip</Button></TooltipTrigger>
            <TooltipContent>Hear the word</TooltipContent>
          </Tooltip>
          <Button variant="secondary" onClick={() => toast("Mas klaro na ang 3 ka pulong.")}>Toast</Button>
          <Button variant="secondary" onClick={() => toast("May bag-o nga bersyon sang app.", { action: { label: "I-update", onClick: () => {} }, duration: 6000 })}>Toast + action</Button>
        </div>
        <ScrollArea className="mt-4 h-24 rounded-2xl border-[1.5px] bg-card">
          <p className="p-3 text-[0.9375rem]">Scroll area. {"The turtle was patient and never gave up. ".repeat(12)}</p>
        </ScrollArea>
      </Section>

      <Section title="Difficulty stamps">
        <div className="flex flex-wrap items-center gap-6">
          <DifficultyStamp level="easy" />
          <DifficultyStamp level="medium" />
          <DifficultyStamp level="hard" />
          <DifficultyStamp level="hard" showLabel={false} />
        </div>
      </Section>

      <Section title="Mascot">
        <div className="flex flex-wrap items-end gap-8">
          {(["idle", "cheer", "think"] as const).map((m) => (
            <div key={m} className="text-center"><Mascot mood={m} size={120} /><p className="mt-1 text-sm font-bold text-ink-2">{m}</p></div>
          ))}
          <Mascot size={48} />
        </div>
      </Section>

      <Section title="Book covers">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {sampleBooks.map((b) => (
            <div key={b.id}>
              <BookCover coverId={b.coverId} jacket={b.jacket} title={b.title} className="drop-shadow-md" />
              <p className="mt-1 text-center text-xs font-bold text-ink-2">{b.coverId}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pad paper">
        <div className={`pad overflow-hidden rounded-2xl border-[1.5px] py-0 ${colorOverlay !== "none" ? `overlay-${colorOverlay}` : ""}`}>
          <p className="pad-line font-heading text-lg font-bold">Bag-o nga pulong</p>
          <p className="pad-text">
            The small fox ran through the <span className="word-mark" data-state="tapped">enormous</span> forest. It was a cold
            day, and snow covered every tree and path. The fox <span className="word-mark" data-state="saved">whispered</span> to
            itself: &ldquo;What an adventure this is!&rdquo; It searched for food in the wide wilderness, determined and brave.
          </p>
          <ul>
            {[["enormous", "daku gid-gid", "hard"], ["whispered", "naghutik", "medium"], ["smooth", "hamis", "easy"]].map(([w, tr, lv]) => (
              <li key={w} className="pad-line flex items-center justify-between gap-3">
                <b className="font-heading text-[1.1875rem]">{w}</b>
                <span className="truncate text-ink-2">{tr}</span>
                <DifficultyStamp level={lv as "easy" | "medium" | "hard"} showLabel={false} />
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </PageContainer>
  );
}
