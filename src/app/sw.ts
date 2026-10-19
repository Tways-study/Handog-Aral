/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, CacheableResponsePlugin, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Must match TESSERACT_CACHE in src/lib/ocr/tesseract.ts (warmOfflinePack writes into it).
const TESSERACT_CACHE = "tesseract-assets";

const tesseractAssets: RuntimeCaching = {
  matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/tesseract/"),
  handler: new CacheFirst({
    cacheName: TESSERACT_CACHE,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // A new worker waits until the page asks it to take over (see the "update available" toast in Providers).
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [tesseractAssets, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

serwist.addEventListeners();
