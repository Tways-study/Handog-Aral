import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Colours mirror --sunrise / --paper in globals.css (kept literal: the manifest cannot read CSS).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handog Aral",
    short_name: "Handog Aral",
    description: "A reading companion for Filipino children: scan a page, tap a word, and understand it in your own language.",
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: "#F08A24",
    background_color: "#FBF7EE",
    categories: ["education", "kids"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
