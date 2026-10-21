"use client";

import { Download, Share, SquarePlus } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";

/**
 * "Install the app" control for Settings (an adults' screen, so English). Shows the browser's install
 * prompt when one is available, and a short Share, Add to Home Screen note on iOS Safari. It renders
 * nothing when already installed, inside the Capacitor app, or when the browser offers no way to
 * install. It never opens a prompt on its own.
 */
export default function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, isNative, promptInstall } = useInstallPrompt();
  if (isInstalled || isNative) return null;

  if (canInstall) {
    return (
      <div data-slot="install-app" className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[44ch] text-[0.9375rem] text-ink-2">
          Add Handog Aral to your home screen. It opens full screen and works without internet.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void promptInstall()}>
          <Download aria-hidden="true" />
          Install the app
        </Button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div data-slot="install-app" className="text-[0.9375rem] text-ink-2">
        <p className="font-bold text-ink">Install the app</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          In Safari, tap <Share aria-hidden="true" className="size-5 text-ink" />
          <span className="font-bold text-ink">Share</span>, then
          <SquarePlus aria-hidden="true" className="size-5 text-ink" />
          <span className="font-bold text-ink">Add to Home Screen</span>.
        </p>
      </div>
    );
  }

  return null;
}
