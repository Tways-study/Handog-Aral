import { Home, Camera, Star, Settings, BookOpen } from "lucide-react";
import { useTranslations } from "../hooks/useTranslations";

export default function BottomNav({ current, onNavigate }) {
  const t = useTranslations();

  const tabs = [
    { id: "home", labelKey: "home", icon: Home },
    { id: "books", labelKey: "books", icon: BookOpen },
    { id: "scan", labelKey: "scan", icon: Camera, isFab: true },
    { id: "vocabulary", labelKey: "vocabulary", icon: Star },
    { id: "settings", labelKey: "settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-[390px] mx-auto bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-end">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = current === tab.id;

            if (tab.isFab) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  aria-label={t.nav[tab.labelKey]}
                  aria-current={active ? "page" : undefined}
                  className="flex-1 flex flex-col items-center"
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
                    {t.nav[tab.labelKey]}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                aria-label={t.nav[tab.labelKey]}
                aria-current={active ? "page" : undefined}
                className={`flex-1 flex flex-col items-center transition-colors ${
                  active ? "text-teal" : "text-muted-text"
                }`}
                style={{ paddingTop: '10px', paddingBottom: '8px', gap: '2px' }}
              >
                <div className="relative">
                  <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal block" />
                  )}
                </div>
                <span className="font-semibold" style={{ fontSize: '0.625rem' }}>{t.nav[tab.labelKey]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
