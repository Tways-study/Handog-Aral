"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RadioGroup } from "radix-ui";
import Mascot from "@/components/Mascot";
import StampCheck from "@/components/StampCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/useT";
import { useMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Language } from "@/shared/schemas";
import type { Jacket } from "@/shared/types";
import { JACKET_CLASS } from "@/features/home/jacket";
import { useSettings } from "@/stores/settings";

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

export default function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const { fadeRoute, enterPanel } = useMotion();
  const coverRef = useRef<HTMLElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setChildName = useSettings((s) => s.setChildName);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const [name, setName] = useState("");

  useEffect(() => {
    const stopCover = fadeRoute(coverRef.current);
    const stopLower = enterPanel(lowerRef.current);
    return () => {
      stopCover();
      stopLower();
    };
  }, [fadeRoute, enterPanel]);

  const finish = (childName: string) => {
    setChildName(childName);
    setOnboarded(true);
    router.replace("/");
  };

  const options: { value: Language; label: string }[] = [
    { value: "hiligaynon", label: t.welcome.optionHiligaynon },
    { value: "tagalog", label: t.welcome.optionTagalog },
  ];

  return (
    <form
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-xl lg:justify-center lg:py-10"
      onSubmit={(e) => {
        e.preventDefault();
        finish(name.trim());
      }}
    >
      <section
        ref={coverRef}
        className="relative mt-[6.5rem] flex min-h-[19rem] flex-1 flex-col justify-between gap-6 rounded-[0.375rem_1.75rem_1.75rem_0.375rem] bg-indigo py-7 pr-5 pl-10 text-indigo-fg shadow-lg lg:mt-24 lg:min-h-[22rem] lg:flex-none lg:py-9 lg:pr-8 lg:pl-14"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-5 rounded-l-[0.375rem] bg-black/25 lg:w-6" />
        <Mascot mood="cheer" size={132} className="absolute -top-[7.25rem] right-5 lg:right-8 lg:-top-[8.25rem] lg:size-[150px]" />
        <div>
          <h1 className="max-w-[8ch] font-heading text-[clamp(2.75rem,14vw,3.5rem)] leading-[0.95] font-extrabold lg:max-w-none lg:text-6xl">
            {t.welcome.appName}
          </h1>
          <p className="mt-3 font-heading text-lg font-bold lg:text-xl">{t.welcome.tagline}</p>
          <p className="mt-2 max-w-[26ch] text-base">{t.welcome.intro}</p>
        </div>

        <div className="rounded-[0.625rem] border-2 border-black/10 bg-label-paper px-4 pt-3 pb-2 text-label-ink">
          <Label htmlFor="child-name" className="text-[0.9375rem] leading-snug font-bold text-label-ink-2">
            {t.welcome.nameLabel}
          </Label>
          <Input
            id="child-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.welcome.namePlaceholder}
            maxLength={24}
            autoComplete="given-name"
            enterKeyHint="go"
            className="h-12 rounded-none border-0 border-b-2 border-label-ink-2 bg-transparent px-0.5 font-heading text-xl font-bold text-label-ink placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-label-ink-2"
          />
        </div>
      </section>

      <div ref={lowerRef} className="mt-8 flex flex-col gap-8 lg:mt-10">
        <div className="flex flex-col gap-3">
          <span id="language-label" className="text-base font-bold">
            {t.welcome.languageLabel}
          </span>
          <RadioGroup.Root
            value={language}
            onValueChange={(v) => setLanguage(v as Language)}
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
                    "group relative flex min-h-32 cursor-pointer flex-col justify-end rounded-[0.25rem_1rem_1rem_0.25rem] py-3 pr-2 pl-5 text-left shadow-sm outline-none transition-[transform,box-shadow] duration-150 focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring motion-safe:active:scale-[0.98] data-[state=checked]:shadow-[0_0_0_3px_var(--paper),0_0_0_5.5px_var(--ink)]",
                    JACKET_CLASS[JACKET_FOR[o.value]],
                  )}
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-3.5 rounded-l-[0.25rem] bg-black/25" />
                  <span className="mb-3 flex justify-end">
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

        <div className="flex flex-col gap-1">
          <Button type="submit" size="xl" className="w-full">
            {t.welcome.start}
          </Button>
          <Button type="button" variant="link" className="self-center" onClick={() => finish("")}>
            {t.welcome.skip}
          </Button>
        </div>
      </div>
    </form>
  );
}
