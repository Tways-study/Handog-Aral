import { Home, Camera, Star, Settings, BookOpen } from "lucide-react";

const tabs = [
  { id: "home", label: "Balay", icon: Home },
  { id: "books", label: "Mga Libro", icon: BookOpen },
  { id: "scan", label: "I-Scan", icon: Camera, isFab: true },
  { id: "vocabulary", label: "Bituon", icon: Star },
  { id: "settings", label: "Opsyon", icon: Settings },
];

export default function BottomNav({ current, onNavigate }) {
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
                  className="flex-1 flex flex-col items-center pb-2"
                >
                  <div
                    className={`-translate-y-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      active ? "scale-105" : ""
                    }`}
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #1A3C40, #2EC4B6)"
                        : "linear-gradient(135deg, #2EC4B6, #56C596)",
                      boxShadow: "0 4px 16px rgba(46,196,182,0.35)",
                    }}
                  >
                    <Icon size={26} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span
                    className={`text-[10px] -mt-3 font-semibold ${
                      active ? "text-teal" : "text-muted-text"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex-1 flex flex-col items-center py-2 pt-3 gap-0.5 transition-colors ${
                  active ? "text-teal" : "text-muted-text"
                }`}
              >
                <div className="relative">
                  <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal block" />
                  )}
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
