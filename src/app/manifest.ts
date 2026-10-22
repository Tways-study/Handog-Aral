import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Colours mirror --sunrise / --paper in globals.css (kept literal: the manifest cannot read CSS).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handog Aral",
    short_name: "Handog Aral",
    description: "A reading companion for Filipino children: scan a page, tap a word, and understand it in your own language.",
    lang: "en",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: "#8A6FF0",
    background_color: "#FBF7EE",
    categories: ["education", "kids"],
    shortcuts: [
      { name: "Scan a page", short_name: "Scan", url: "/scan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "My words", short_name: "Words", url: "/words", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Word quiz", short_name: "Quiz", url: "/quiz", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    screenshots: [
      { src: "/screenshots/wide.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "Reading a story and tapping a word" },
      { src: "/screenshots/narrow.png", sizes: "750x1624", type: "image/png", form_factor: "narrow", label: "Home: today's story and your stars" },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
