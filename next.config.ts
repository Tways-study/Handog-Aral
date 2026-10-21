import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["lucide-react", "radix-ui"] },
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
// Security headers (web target only: `headers()` is unsupported with `output: 'export'`). The CSP is deliberately
// conservative: no script-src/style-src/connect-src, because Next's inline scripts, the Tesseract WASM worker, the
// service worker and the Capacitor origin would break.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), interest-cohort=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const webConfig: NextConfig = {
  ...baseConfig,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The worker must always be revalidated so updates are found, and may control the whole origin.
        source: "/serwist/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  ...(process.env.NODE_ENV !== "production" ? { pageExtensions: ["tsx", "ts", "jsx", "js", "dev.tsx"] } : {}),
};

const nextConfig: NextConfig = isCapacitor ? capacitorConfig : withSerwist(webConfig);

export default nextConfig;
