import { Home, Camera, Star, Settings } from "lucide-react";

const tabs = [
  { id: "home", label: "Balay", icon: Home },
  { id: "scan", label: "I-Scan", icon: Camera },
  { id: "vocabulary", label: "Bituon", icon: Star },
  { id: "settings", label: "Opsyon", icon: Settings },
];

export default function BottomNav({ current, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
      <div className="max-w-[390px] mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = current === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
                active ? "text-teal" : "text-muted-text"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
