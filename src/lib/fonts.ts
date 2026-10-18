import { Atkinson_Hyperlegible, Baloo_2, Nunito } from "next/font/google";

// Self-hosted at build time by next/font, so they work offline.
export const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

// Kept as the body font for now to preserve the current look.
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

// Exported for the v3 redesign (reading text); exposed as --font-atkinson / --font-reading.
export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});
