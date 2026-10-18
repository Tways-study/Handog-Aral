import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { atkinson, baloo, nunito } from "@/lib/fonts";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handog Aral",
  description: "Handog Aral — AI Literacy App para sa mga Bata",
  applicationName: "Handog Aral",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#2EC4B6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fil" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable}`}>
      <body>
        <Providers>
          <div className="max-w-[390px] mx-auto min-h-screen relative bg-cream">
            {children}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
