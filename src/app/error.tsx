"use client";

import { useEffect } from "react";
import SystemPage from "./_system/SystemPage";

/** Route-level error boundary. Renders inside the shell (the nav stays); the error is only logged, never shown. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[handog-aral] route error:", error);
  }, [error]);
  return <SystemPage kind="error" onRetry={reset} />;
}
