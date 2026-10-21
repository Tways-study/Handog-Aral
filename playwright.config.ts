import { defineConfig } from "@playwright/test";

// e2e runs against a production build in a private dist dir so it never clobbers `.next`:
//   NEXT_DIST_DIR=.next-e2e npm run build
// Parallel agents/tools can run their own copy: E2E_PORT=3211 E2E_DIST_DIR=.next-v1 (build into that dir first).
// The proxy (/api/*) is always stubbed inside the tests; no GEMINI_API_KEY is needed.
const PORT = Number(process.env.E2E_PORT ?? 3200);
const DIST_DIR = process.env.E2E_DIST_DIR ?? ".next-e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // page.route() cannot see requests answered by a service worker; the PWA spec opts back in.
    serviceWorkers: "block",
    // Optional: point at an already-installed Chromium when the bundled revision is missing.
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  webServer: {
    command: `NEXT_DIST_DIR=${DIST_DIR} npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
