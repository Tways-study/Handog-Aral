"use client";

import { useEffect, useState } from "react";
import { isReachable } from "@/lib/api";

const POLL_MS = 30_000;

/** Online status that trusts the proxy being reachable, not just navigator.onLine. Defaults to true on the server. */
export function useOnlineStatus(): { online: boolean } {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (navigator.onLine === false) {
        if (!cancelled) setOnline(false);
        return;
      }
      let ok = false;
      try {
        ok = await isReachable();
      } catch {
        ok = false;
      }
      if (!cancelled) setOnline(ok);
    };

    const onOffline = () => setOnline(false);
    const onOnline = () => void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    setOnline(navigator.onLine !== false);
    void check();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { online };
}
