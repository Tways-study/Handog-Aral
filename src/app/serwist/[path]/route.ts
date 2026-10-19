import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

// Serves /serwist/sw.js, built from src/app/sw.ts. Excluded from the Capacitor
// export because pageExtensions is limited to .tsx there.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  // Same as the package default plus fonts (so the type is available offline on first install).
  globPatterns: [
    ".next/static/**/*.{js,css,html,ico,apng,png,avif,jpg,jpeg,jfif,pjpeg,pjp,gif,svg,webp,json,webmanifest,woff,woff2}",
    "public/**/*",
  ],
  // The ~10MB Tesseract pack is opt-in (warmOfflinePack) and cached at runtime, never precached.
  globIgnores: ["public/tesseract/**", "**/*.map"],
  // Server-rendered offline fallback document, see `fallbacks` in sw.ts.
  additionalPrecacheEntries: [{ url: "/offline", revision: randomUUID() }],
});
