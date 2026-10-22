import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { atkinson, baloo, openDyslexic } from "@/lib/fonts";
import Providers from "@/components/Providers";
import "./globals.css";
import "./native.css";

const DESCRIPTION = "A reading companion for Filipino children. Scan a page, tap a word, understand it in your own language.";

export const metadata: Metadata = {
  // Absolute base for the social-card images. Set NEXT_PUBLIC_SITE_URL to the deployed origin (see .env.example).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Handog Aral", template: "%s \u00b7 Handog Aral" },
  description: DESCRIPTION,
  applicationName: "Handog Aral",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Handog Aral", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Handog Aral",
    title: "Handog Aral",
    description: DESCRIPTION,
    locale: "en_PH",
  },
  twitter: { card: "summary_large_image", title: "Handog Aral", description: DESCRIPTION },
};

// Pinch-zoom stays enabled on purpose (no maximum-scale / user-scalable).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E7DFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#3A2E7A" },
  ],
};

// Runs before first paint: reads the theme mirrored by ThemeSync so the page never flashes the wrong scheme.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('handog-theme');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fil"
      suppressHydrationWarning
      className={`${baloo.variable} ${atkinson.variable} ${openDyslexic.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
