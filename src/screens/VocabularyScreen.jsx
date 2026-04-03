import { useState } from "react";
import { useApp } from "../context/AppContext";
import WordPopup from "../components/WordPopup";
import Mascot from "../components/Mascot";

export default function VocabularyScreen() {
  const { state } = useApp();
  const [selectedWord, setSelectedWord] = useState(null);
  const words = state.wordsLearned;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Mascot size={32} />
          <div>
            <h1 className="font-heading text-2xl font-bold text-dark-text">
              Mga Pulong 🌟
            </h1>
            <p className="text-muted-text text-xs">
              {words.length} pulong natuon mo na!
            </p>
          </div>
        </div>
      </div>

      <div className="px-5">
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Mascot size={56} />
            <p className="text-muted-text text-sm text-center">
              Wala pa sang natuon nga pulong.
              <br />
              Mag-scan sang libro para magsugod! 📖
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fadeUp">
            {words.map((w, i) => (
              <button
                key={`${w.word}-${i}`}
                onClick={() => setSelectedWord(w)}
                className="tappable bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left"
              >
                <span className="text-2xl block mb-1">{w.emoji}</span>
                <p className="font-heading font-bold text-sm text-dark-text truncate">
                  {w.word}
                </p>
                <p className="text-muted-text text-[10px]">{w.phonetic}</p>
                <span className="inline-block mt-1 text-[9px] bg-leaf-green/15 text-leaf-green font-bold px-2 py-0.5 rounded-full">
                  Natuon na! ✓
                </span>
              </button>
            ))}

            {/* Mystery cards for encouragement */}
            {words.length < 6 &&
              Array.from({ length: 6 - words.length }).map((_, i) => (
                <div
                  key={`mystery-${i}`}
                  className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[120px]"
                >
                  <span className="text-2xl mb-1 grayscale opacity-30">❓</span>
                  <p className="text-muted-text/40 text-xs font-bold">???</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedWord && (
        <WordPopup
          wordData={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
