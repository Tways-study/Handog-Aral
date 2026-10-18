import { createSerwistRoute } from "@serwist/turbopack";

// Serves /serwist/sw.js, built from src/app/sw.ts. Excluded from the Capacitor
// export because pageExtensions is limited to .tsx there.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
