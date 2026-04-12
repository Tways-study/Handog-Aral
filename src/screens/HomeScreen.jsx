import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useTranslations } from "../hooks/useTranslations";
import Mascot from "../components/Mascot";
import StarProgress from "../components/StarProgress";
import { Camera, Lightbulb, Brain, BookOpen } from "lucide-react";
import { sampleBooks } from "../data/books";

export default function HomeScreen({ onNavigate }) {
  const { state, dispatch } = useApp();
  const t = useTranslations();
  const name = state.childName || "Abyan";
  const learnedCount = state.wordsLearned.length;
  const canQuiz = learnedCount >= 4;

  useEffect(() => {
    dispatch({ type: "UPDATE_STREAK" });
  }, [dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.greetingMorning;
    if (hour < 18) return t.home.greetingAfternoon;
    return t.home.greetingEvening;
  };

  return (
    <div className="min-h-screen bg-cream pb-nav">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[36px]"
        style={{
          background: "linear-gradient(150deg, #0D3D56 0%, #0EA5A0 65%, #34D399 100%)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-white/70 text-sm font-medium">{getGreeting()}</p>
            <h1 className="font-heading text-2xl font-bold text-white mt-0.5 leading-tight">
              {t.home.readyPrompt}<br />{name}?
            </h1>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Mascot size={46} />
            {state.streak > 0 && (
              <div className="flex items-center gap-1 bg-sun-yellow rounded-full px-2.5 py-0.5 shadow-sm">
                <span className="text-xs">🔥</span>
                <span className="text-deep-teal text-xs font-extrabold">{state.streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-white font-extrabold text-xl font-heading leading-none">{learnedCount}</p>
            <p className="text-white/70 text-xs font-semibold mt-0.5">{t.home.statWords}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-white font-extrabold text-xl font-heading leading-none">{state.streak || 0}</p>
            <p className="text-white/70 text-xs font-semibold mt-0.5">{t.home.statStreak}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center justify-center">
            <StarProgress stars={state.stars} max={5} compact />
            <p className="text-white/70 text-xs font-semibold mt-1">{t.home.statStars}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3 animate-fadeUp">
        {/* Main CTA - Scan */}
        <button
          onClick={() => onNavigate("scan")}
          className="w-full text-white rounded-2xl py-4 px-5 flex items-center gap-4 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #F4614A 0%, #F97316 100%)",
            boxShadow: "0 8px 24px rgba(244,97,74,0.25)",
          }}
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Camera size={24} />
          </div>
          <div className="text-left flex-1">
            <p className="font-heading font-bold text-lg leading-tight">{t.home.ctaScanTitle}</p>
            <p className="text-white/80 text-xs">{t.home.ctaScanSubtitle}</p>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">›</span>
          </div>
        </button>

        {/* Quick access grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("books")}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left tappable"
            style={{ borderTop: "3px solid #F97316" }}
          >
            <BookOpen size={22} className="text-soft-orange mb-2" />
            <p className="font-heading font-bold text-sm text-dark-text">{t.home.quickBooks}</p>
            <p className="text-muted-text text-xs mt-0.5">
              {Object.values(state.bookProgress).filter((p) => p >= 100).length > 0
                ? t.home.quickBooksSubContinue
                : t.home.quickBooksSubNew(sampleBooks.length)}
            </p>
          </button>

          <button
            onClick={() => onNavigate(canQuiz ? "quiz" : "vocabulary")}
            className={`rounded-2xl p-4 shadow-sm text-left tappable ${
              canQuiz
                ? "bg-lavender/10 border border-lavender/30"
                : "bg-white border border-gray-100"
            }`}
            style={{ borderTop: `3px solid ${canQuiz ? "#38BDF8" : "#0EA5A0"}` }}
          >
            <Brain
              size={22}
              className={`mb-2 ${canQuiz ? "text-lavender" : "text-teal"}`}
            />
            <p className="font-heading font-bold text-sm text-dark-text">
              {canQuiz ? t.home.quickQuiz : t.home.quickVocab}
            </p>
            <p className="text-muted-text text-xs mt-0.5">
              {canQuiz
                ? t.home.quickQuizSub(learnedCount)
                : learnedCount === 0
                ? t.home.quickVocabSub(learnedCount)
                : `Save ${4 - learnedCount} more word${4 - learnedCount === 1 ? "" : "s"} to unlock`}
            </p>
          </button>
        </div>

        {/* Encouragement / Tip card */}
        {learnedCount === 0 ? (
          <div className="bg-sun-yellow/15 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-sun-yellow/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb size={20} className="text-soft-orange" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-dark-text mb-1">
                {t.home.tipTitle}
              </p>
              <p className="text-muted-text text-xs leading-relaxed">
                {t.home.tipBody}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-leaf-green/15 rounded-2xl p-4 flex items-center gap-3 border border-leaf-green/20">
            <span className="text-3xl flex-shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-leaf-green">
                {t.home.praiseTitle(name)}
              </p>
              <p className="text-muted-text text-xs mt-0.5">
                {t.home.praiseSub(learnedCount)} {canQuiz ? t.home.praiseQuiz : t.home.praiseContinue}
              </p>
            </div>
            {canQuiz && (
              <button
                onClick={() => onNavigate("quiz")}
                className="bg-leaf-green text-white text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
              >
                {t.home.praiseQuizBtn}
              </button>
            )}
          </div>
        )}

        {/* Recently learned words */}
        {learnedCount > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-bold text-sm text-dark-text">
                {t.home.recentTitle}
              </p>
              <button
                onClick={() => onNavigate("vocabulary")}
                className="text-teal text-xs font-bold"
              >
                {t.home.recentViewAll}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.wordsLearned.slice(-4).reverse().map((w) => (
                <div
                  key={w.word}
                  className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2"
                >
                  <span className="text-lg leading-none">{w.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-dark-text truncate capitalize">{w.word}</p>
                    <p className="text-muted-text text-[0.65rem] truncate leading-tight">{w.english}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mascot footer quote */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          <Mascot size={22} />
          <p className="text-muted-text text-xs italic">
            "{t.home.mascotQuote(name)}"
          </p>
        </div>
      </div>
    </div>
  );
}
