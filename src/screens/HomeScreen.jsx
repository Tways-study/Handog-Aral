import { useApp } from "../context/AppContext";
import Mascot from "../components/Mascot";
import StarProgress from "../components/StarProgress";
import { BookOpen, Camera, Lightbulb } from "lucide-react";

export default function HomeScreen({ onNavigate }) {
  const { state } = useApp();
  const name = state.childName || "Abyan";
  const learnedCount = state.wordsLearned.length;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div
        className="px-5 pt-8 pb-6 rounded-b-3xl"
        style={{
          background: "linear-gradient(135deg, #2EC4B6 0%, #1A3C40 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/80 text-sm">Maayong adlaw! 👋</p>
            <h1 className="font-heading text-2xl font-bold text-white">
              Handa ka na, {name}?
            </h1>
          </div>
          <Mascot size={44} />
        </div>

        {/* Stars */}
        <div className="bg-white/15 rounded-2xl p-3 flex items-center justify-between">
          <StarProgress stars={state.stars} />
          <span className="bg-sun-yellow text-deep-teal text-xs font-bold px-3 py-1 rounded-full">
            {learnedCount} pulong natuon!
          </span>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4 animate-fadeUp">
        {/* Main CTA */}
        <button
          onClick={() => onNavigate("scan")}
          className="w-full bg-coral text-white rounded-2xl py-4 px-5 flex items-center gap-4 shadow-lg shadow-coral/25"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Camera size={24} />
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-lg">I-scan ang Libro</p>
            <p className="text-white/80 text-xs">Magsugod Pagbasa!</p>
          </div>
        </button>

        {/* Quick access grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("books")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left tappable"
          >
            <span className="text-2xl mb-2 block">📚</span>
            <p className="font-heading font-bold text-sm text-dark-text">
              Ang Akon Mga Libro
            </p>
            <p className="text-muted-text text-xs mt-0.5">3 ka libro</p>
          </button>

          <button
            onClick={() => onNavigate("vocabulary")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left tappable"
          >
            <span className="text-2xl mb-2 block">🌟</span>
            <p className="font-heading font-bold text-sm text-dark-text">
              Mga Natuon nga Pulong
            </p>
            <p className="text-muted-text text-xs mt-0.5">
              {learnedCount} ka pulong
            </p>
          </button>
        </div>

        {/* Tip card */}
        <div className="bg-sun-yellow/15 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-sun-yellow/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-soft-orange" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm text-dark-text mb-1">
              Paano gamiton? 💡
            </p>
            <p className="text-muted-text text-xs leading-relaxed">
              I-scan ang libro gamit ang camera o i-type ang teksto. Tap-a ang
              bisan ano nga pulong para mahibal-an ang kahulugan sa Hiligaynon!
            </p>
          </div>
        </div>

        {/* Mascot greeting */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Mascot size={28} />
          <p className="text-muted-text text-xs italic">
            "Padayon lang sa pagbasa, {name}!"
          </p>
        </div>
      </div>
    </div>
  );
}
