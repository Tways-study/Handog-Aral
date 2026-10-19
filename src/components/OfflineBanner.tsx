"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useT } from "@/hooks/useT";

/**
 * Slim, honest offline notice at the top of the content column. It never overlaps the nav or the
 * page title: it opens and closes by easing its height (instant under reduced motion), so the
 * column shifts as one calm motion instead of a jump when connectivity changes.
 *
 * The live region stays mounted and carries the announcement; the visual strip is hidden from
 * assistive tech so the message is not read twice.
 */
export default function OfflineBanner() {
  const { online } = useOnlineStatus();
  const t = useT();
  return (
    <>
      <div role="status" aria-live="polite" data-slot="offline-banner" className="sr-only">
        {!online && t.shell.offlineBanner}
      </div>
      <div
        aria-hidden="true"
        data-state={online ? "online" : "offline"}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out data-[state=offline]:grid-rows-[1fr]"
      >
        <div className="overflow-hidden">
          <div className="flex items-start gap-2.5 border-b-[1.5px] border-border bg-paper-2 px-5 py-2.5 text-[0.9375rem] leading-snug text-ink lg:px-8">
            <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
            <span>{t.shell.offlineBanner}</span>
          </div>
        </div>
      </div>
    </>
  );
}
