"use client";

import type { ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { AppProvider } from "@/context/AppContext";

// The Capacitor export ships files locally, so no service worker there.
const SW_ENABLED =
  process.env.NEXT_PUBLIC_BUILD_TARGET !== "capacitor" && process.env.NODE_ENV === "production";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={!SW_ENABLED}>
      <AppProvider>{children}</AppProvider>
    </SerwistProvider>
  );
}
