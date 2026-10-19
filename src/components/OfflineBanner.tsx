"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useT } from "@/hooks/useT";

/**
 * Slim, honest offline notice at the top of the content column. The live region is always
 * mounted so screen readers announce the change; it never overlaps the nav.
 */
export default function OfflineBanner() {
  const { online } = useOnlineStatus();
  const t = useT();
  return (
    <div role="status" aria-live="polite" data-slot="offline-banner">
      {!online && (
        <div className="flex items-start gap-2.5 border-b-[1.5px] border-border bg-paper-2 px-5 py-2.5 text-[0.9375rem] leading-snug text-ink lg:px-8">
          <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-2" />
          <span>{t.shell.offlineBanner}</span>
        </div>
      )}
    </div>
  );
}
