import { Atkinson_Hyperlegible, Baloo_2 } from "next/font/google";
import localFont from "next/font/local";

// All three are self-hosted by next/font at build time, so they work offline.
export const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

// Real OpenDyslexic (SIL OFL, see src/fonts/LICENSE.txt). Only used when body.dyslexia-font is on.
export const openDyslexic = localFont({
  src: [
    { path: "../fonts/OpenDyslexic-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/OpenDyslexic-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-opendyslexic",
  display: "swap",
  preload: false,
});
