"use client";

import { useEffect, useSyncExternalStore } from "react";
import { atkinson, baloo, openDyslexic } from "@/lib/fonts";
import Mascot from "@/components/Mascot";
import { buttonVariants } from "@/components/ui/button";
import { systemStrings } from "@/data/strings/system";
import { readMirroredLanguage } from "@/stores/bootMirror";
import { cn } from "@/lib/utils";
import "./globals.css";

/**
 * Last-resort boundary: replaces the root layout, so it brings its own <html>/<body> and cannot use
 * the providers. The language is read defensively from the settings mirror; Filipino otherwise.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = useSyncExternalStore(
    () => () => {},
    readMirroredLanguage,
    () => "tagalog" as const,
  );
  useEffect(() => {
    console.error("[handog-aral] fatal error:", error);
  }, [error]);
  const t = systemStrings[lang];
  return (
    <html lang="fil" className={`${baloo.variable} ${atkinson.variable} ${openDyslexic.variable}`}>
      <body>
        <main className="grid min-h-dvh place-items-center px-5 py-16 text-center">
          <div className="flex flex-col items-center">
            <Mascot mood="think" size={120} />
            <h1 className="mt-6 font-heading text-3xl font-bold text-balance">{t.errorTitle}</h1>
            <p className="mt-3 max-w-[36ch] text-lg text-ink-2">{t.errorBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className={cn(buttonVariants({ size: "lg" }))}>
                {t.tryAgain}
              </button>
              {/* A full page load (not client navigation): it gets the app back to a clean state. */}
              {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination */}
              <button type="button" onClick={() => window.location.assign("/")} className={buttonVariants({ variant: "secondary", size: "lg" })}>
                {t.goHome}
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
