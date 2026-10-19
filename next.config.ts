import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  // Parallel agents/tools can point NEXT_DIST_DIR at a private folder (e.g. .next-reader) to avoid clobbering .next.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // The dev badge sits on top of the bottom nav while testing the shell.
  devIndicators: false,
  env: {
    // Lets client code (e.g. the service worker provider) know which target it was built for.
    NEXT_PUBLIC_BUILD_TARGET: isCapacitor ? "capacitor" : "web",
  },
};

// Capacitor: static export into out/. pageExtensions limited to .tsx so route.ts
// API handlers (including the Serwist route) are left out of the export.
const capacitorConfig: NextConfig = {
  ...baseConfig,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  pageExtensions: ["tsx"],
};

// Web: normal build with the Serwist service worker enabled. In `next dev` only, files named
// page.dev.tsx also become routes (the /design showcase); production builds never see them.
const webConfig: NextConfig = {
  ...baseConfig,
  ...(process.env.NODE_ENV !== "production" ? { pageExtensions: ["tsx", "ts", "jsx", "js", "dev.tsx"] } : {}),
};

const nextConfig: NextConfig = isCapacitor ? capacitorConfig : withSerwist(webConfig);

export default nextConfig;
