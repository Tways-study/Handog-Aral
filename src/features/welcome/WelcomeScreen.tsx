"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/hooks/useT";
import type { Language } from "@/shared/schemas";
import { useSettings } from "@/stores/settings";

export default function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setChildName = useSettings((s) => s.setChildName);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const [name, setName] = useState("");

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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:justify-center">
      <div className="relative mt-10 rounded-[0.375rem_1.375rem_1.375rem_0.375rem] bg-indigo py-7 pr-5 pl-9 text-indigo-fg shadow-md">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4 rounded-l-[0.375rem] bg-black/25" />
        <Mascot mood="cheer" size={96} className="absolute -top-12 right-5" />
        <h1 className="font-heading text-4xl leading-none font-extrabold">{t.welcome.appName}</h1>
        <p className="mt-2 font-heading text-lg font-bold">{t.welcome.tagline}</p>
        <p className="mt-3 max-w-[22ch] text-base">{t.welcome.intro}</p>
      </div>

      <form
        className="mt-8 flex flex-1 flex-col gap-6 lg:flex-none"
        onSubmit={(e) => {
          e.preventDefault();
          finish(name.trim());
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="child-name" className="text-base font-bold leading-snug">
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
            className="h-14 text-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id="language-label" className="text-base font-bold">
            {t.welcome.languageLabel}
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            spacing={2}
            value={language}
            onValueChange={(v) => v && setLanguage(v as Language)}
            aria-labelledby="language-label"
            className="w-full"
          >
            {options.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value} className="flex-1 text-base">
                {language === o.value && <Check aria-hidden="true" />}
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2 lg:mt-4">
          <Button type="submit" size="xl" className="w-full">
            {t.welcome.start}
          </Button>
          <Button type="button" variant="link" className="self-center" onClick={() => finish("")}>
            {t.welcome.skip}
          </Button>
        </div>
      </form>
    </div>
  );
}
