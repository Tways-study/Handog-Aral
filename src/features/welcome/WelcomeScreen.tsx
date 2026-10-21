"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RadioGroup } from "radix-ui";
import Owl, { type OwlReaction } from "@/components/owl/Owl";
import StampCheck from "@/components/StampCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useT } from "@/hooks/useT";
import { buzz } from "@/lib/haptics";
import { useMotion } from "@/lib/motion";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { Language } from "@/shared/schemas";
import type { Jacket } from "@/shared/types";
import { JACKET_CLASS } from "@/features/home/jacket";
import { useSettings } from "@/stores/settings";
import SpeechTag from "@/features/home/SpeechTag";
import SuperpowerStep from "./SuperpowerStep";

/** The teacher's check, stamped onto the chosen notebook's label. Lands once when it appears. */
function SelectedStamp() {
  const ref = useRef<HTMLSpanElement>(null);
  const { stampIn } = useMotion();
  useEffect(() => stampIn(ref.current), [stampIn]);
  return (
    <span ref={ref} className="inline-flex">
      <StampCheck size={30} />
    </span>
  );
}

const JACKET_FOR: Record<Language, Jacket> = { hiligaynon: "indigo", tagalog: "gumamela" };

/** How long the owl waves hello before settling, in ms. */
const WAVE_MS = 2600;

export default function WelcomeScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const childName = useSettings((s) => s.childName);
  const setChildName = useSettings((s) => s.setChildName);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const router = useRouter();

  const finish = () => {
    setOnboarded(true);
    router.replace("/");
  };

  if (step === 2) {
    return (
      <SuperpowerStep
        name={childName}
        onDone={finish}
        onSkip={finish}
      />
    );
  }

  return (
    <NameStep
      onStart={(name) => {
        setChildName(name);
        setStep(2);
        window.scrollTo?.({ top: 0 });
      }}
      onSkip={() => {
        setChildName("");
        finish();
      }}
    />
  );
}

function NameStep({ onStart, onSkip }: { onStart: (name: string) => void; onSkip: () => void }) {
  const t = useT();
  const { fadeRoute, enterPanel } = useMotion();
  const coverRef = useRef<HTMLElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const [name, setName] = useState("");
  const roomy = useMediaQuery("(min-width: 360px) and (min-height: 700px)");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [waving, setWaving] = useState(true);
  const [reaction, setReaction] = useState<OwlReaction | undefined>({ kind: "wave", key: 1 });

  useEffect(() => {
    const stopCover = fadeRoute(coverRef.current);
    const stopLower = enterPanel(lowerRef.current);
    const id = window.setTimeout(() => setWaving(false), WAVE_MS);
    return () => {
      stopCover();
      stopLower();
      window.clearTimeout(id);
    };
  }, [fadeRoute, enterPanel]);

  const options: { value: Language; label: string }[] = [
    { value: "hiligaynon", label: t.welcome.optionHiligaynon },
    { value: "tagalog", label: t.welcome.optionTagalog },
  ];
  const owlSize = desktop ? 200 : roomy ? 168 : 132;

  return (
    <form
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-xl lg:justify-center lg:py-6"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(name.trim());
      }}
    >
      {/* The owl, perched on the notebook, says hello in its own speech tag. */}
      <div className="relative z-10 flex items-end justify-between gap-2 lg:mt-0">
        <SpeechTag tail="right" className="mb-3 min-w-0 flex-1 px-4 py-3 lg:mb-6">
          <p className="text-base leading-snug font-bold lg:text-lg">{t.welcome.owlHello}</p>
        </SpeechTag>
        <Owl
          priority="hero"
          size={owlSize}
          mood={waving ? "wave" : "idle"}
          interactive
          title={t.home.owlName}
          reaction={reaction}
          onTap={() => {
            setReaction({ kind: "hop", key: Date.now() });
            play("pop");
            buzz("tap");
          }}
          className="-mb-10 mr-1 lg:-mb-14"
        />
      </div>
      <section
        ref={coverRef}
        className="relative flex min-h-[15rem] flex-col justify-between gap-5 rounded-[0.375rem_1.75rem_1.75rem_0.375rem] bg-indigo pt-12 pr-5 pb-6 pl-10 text-indigo-fg shadow-lg lg:min-h-[16rem] lg:gap-5 lg:pt-12 lg:pr-8 lg:pb-7 lg:pl-14"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-5 rounded-l-[0.375rem] bg-black/25 lg:w-6" />
        <div>
          <h1 className="max-w-[8ch] font-heading text-[clamp(2.75rem,14vw,3.5rem)] leading-[0.95] font-extrabold lg:max-w-none lg:text-6xl">
            {t.welcome.appName}
          </h1>
          <p className="mt-3 font-heading text-lg font-bold lg:text-xl">{t.welcome.tagline}</p>
        </div>

        <div className="rounded-[0.625rem] border-2 border-black/10 bg-label-paper px-4 pt-3 pb-2 text-label-ink">
          <Label htmlFor="child-name" className="text-[0.9375rem] leading-snug font-bold text-label-ink-2">
            {t.welcome.nameLabel}
          </Label>
          <Input
            id="child-name"
            value={name}
            onChange={(e) => {
              const next = e.target.value;
              // The first letter makes the owl cheer.
              if (name.trim() === "" && next.trim() !== "") setReaction({ kind: "cheer", key: Date.now() });
              setName(next);
            }}
            placeholder={t.welcome.namePlaceholder}
            maxLength={24}
            autoComplete="given-name"
            enterKeyHint="go"
            className="h-12 rounded-none border-0 border-b-2 border-label-ink-2 bg-transparent px-0.5 font-heading text-xl font-bold text-label-ink placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-label-ink-2"
          />
        </div>
      </section>

      <div ref={lowerRef} className="mt-6 flex flex-1 flex-col gap-5 lg:mt-7 lg:flex-none lg:gap-6">
        <div className="flex flex-col gap-3">
          <span id="language-label" className="text-base font-bold">
            {t.welcome.languageLabel}
          </span>
          <RadioGroup.Root
            value={language}
            onValueChange={(v) => {
              setLanguage(v as Language);
              setReaction({ kind: "hop", key: Date.now() });
              play("flip");
            }}
            aria-labelledby="language-label"
            className="grid grid-cols-2 gap-4 px-1 pb-1"
          >
            {options.map((o) => {
              const selected = language === o.value;
              return (
                <RadioGroup.Item
                  key={o.value}
                  value={o.value}
                  className={cn(
                    "group relative flex min-h-28 lg:min-h-24 cursor-pointer flex-col justify-end rounded-[0.25rem_1rem_1rem_0.25rem] py-3 pr-2 pl-5 text-left shadow-sm outline-none transition-[transform,box-shadow] duration-150 focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring motion-safe:active:scale-[0.98] data-[state=checked]:shadow-[0_0_0_3px_var(--paper),0_0_0_5.5px_var(--ink)] motion-safe:data-[state=checked]:-rotate-2",
                    JACKET_CLASS[JACKET_FOR[o.value]],
                  )}
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-3.5 rounded-l-[0.25rem] bg-black/25" />
                  <span className="mb-2 flex justify-end">
                    <span className="grid size-9 place-items-center rounded-full bg-label-paper">
                      {selected ? (
                        <SelectedStamp />
                      ) : (
                        <span aria-hidden="true" className="size-6 rounded-full border-2 border-dashed border-label-ink-2" />
                      )}
                    </span>
                  </span>
                  <span className="block min-w-0 rounded-[0.5rem] border-2 border-black/10 bg-label-paper px-1.5 py-2 text-center font-heading text-[clamp(0.9375rem,4.6vw,1.0625rem)] leading-tight font-bold break-words text-label-ink">
                    {o.label}
                  </span>
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
        </div>

        <div className="sticky bottom-0 z-20 -mx-5 mt-auto flex flex-col gap-1 bg-linear-to-t from-background from-75% to-transparent px-5 pt-6 pb-1 lg:static lg:mx-0 lg:bg-none lg:p-0">
          <Button type="submit" size="xl" className="w-full">
            {t.welcome.start}
          </Button>
          <Button type="button" variant="link" className="self-center" onClick={onSkip}>
            {t.welcome.skip}
          </Button>
        </div>
      </div>
    </form>
  );
}
