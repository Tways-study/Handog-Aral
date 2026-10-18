"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Star, Settings, BookOpen, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useApp } from "@/context/AppContext";

interface Tab {
  id: "home" | "books" | "scan" | "vocabulary" | "settings";
  href: string;
  icon: LucideIcon;
  isFab?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const { state } = useApp();
  const wordsNeededForQuiz = Math.max(0, 4 - state.wordsLearned.length);
  const canQuiz = wordsNeededForQuiz === 0;

  // The welcome screen is full-bleed with no navigation.
  if (pathname.startsWith("/welcome")) return null;

  const tabs: Tab[] = [
    { id: "home", href: "/", icon: Home },
    { id: "books", href: "/books", icon: BookOpen },
    { id: "scan", href: "/scan", icon: Camera, isFab: true },
    { id: "vocabulary", href: "/words", icon: Star },
    { id: "settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-[390px] mx-auto bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-end">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

            if (tab.isFab) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-label={t.nav[tab.id]}
                  aria-current={active ? "page" : undefined}
                  className="tappable flex-1 flex flex-col items-center"
                  style={{ paddingBottom: '8px' }}
                >
                  <div
                    className={`-translate-y-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      active ? "scale-105" : ""
                    }`}
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #0D3D56, #0EA5A0)"
                        : "linear-gradient(135deg, #0EA5A0, #34D399)",
                      boxShadow: "0 4px 16px rgba(14,165,160,0.35)",
                    }}
                  >
                    <Icon size={26} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span
                    className={`-mt-3 font-semibold ${
                      active ? "text-teal" : "text-muted-text"
                    }`}
                    style={{ fontSize: '0.625rem' }}
                  >
                    {t.nav[tab.id]}
                  </span>
                </Link>
              );
            }

            const isQuizLocked = tab.id === "vocabulary" && !canQuiz && state.wordsLearned.length > 0;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-label={t.nav[tab.id]}
                aria-current={active ? "page" : undefined}
                className={`tappable flex-1 flex flex-col items-center transition-colors ${
                  active ? "text-teal" : "text-muted-text"
                }`}
                style={{ paddingTop: '10px', paddingBottom: '8px', gap: '2px' }}
              >
                <div className="relative">
                  <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal block" />
                  )}
                  {isQuizLocked && (
                    <span
                      className="absolute -top-1 -right-2 bg-sun-yellow text-deep-teal font-extrabold rounded-full flex items-center justify-center"
                      style={{ fontSize: '0.5rem', minWidth: '14px', height: '14px', padding: '0 2px' }}
                    >
                      {wordsNeededForQuiz}
                    </span>
                  )}
                </div>
                <span className="font-semibold" style={{ fontSize: '0.625rem' }}>{t.nav[tab.id]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
