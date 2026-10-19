"use client";

import Mascot from "@/components/Mascot";
import { useT } from "@/hooks/useT";

/** First paint: a designed pad-paper page with the owl, rendered in the server HTML before any state loads. */
export default function LoadingFrame() {
  const t = useT();
  return (
    <div className="pad grid min-h-dvh place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <Mascot mood="think" size={96} />
        <p className="font-heading text-lg font-bold text-ink-2">{t.shell.loading}</p>
      </div>
    </div>
  );
}
