import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useTranslations } from "../hooks/useTranslations";
import { hasApiKey, setApiKey, clearApiKey } from "../services/geminiService";
import Mascot from "../components/Mascot";
import { AlertTriangle, Eye, EyeOff, X } from "lucide-react";

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const t = useTranslations();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keyIsSet, setKeyIsSet] = useState(() => hasApiKey());
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyInput("");
      setKeySaved(true);
      setKeyIsSet(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  const handleClearKey = () => {
    clearApiKey();
    setKeyIsSet(false);
    setApiKeyInput("");
  };

  const handleReset = () => {
    dispatch({ type: "RESET_PROGRESS" });
    setShowReset(false);
  };

  return (
    <div className="min-h-screen bg-cream pb-nav">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <Mascot size={32} />
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark-text">
            {t.settings.title}
          </h1>
          <p className="text-muted-text text-xs">{t.settings.subtitle}</p>
        </div>
      </div>

      <div className="px-5 space-y-4 animate-fadeUp">
        {/* Child's name */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-2">
            {t.settings.nameLabel}
          </label>
          <input
            type="text"
            value={state.childName}
            onChange={(e) =>
              dispatch({ type: "SET_NAME", payload: e.target.value })
            }
            placeholder={t.settings.namePlaceholder}
            className="w-full bg-cream rounded-xl px-4 py-3 text-sm text-dark-text outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-2">
            {t.settings.languageLabel}
          </label>
          <div className="flex gap-2">
            {[
              { id: "hiligaynon", label: "🗣 Hiligaynon" },
              { id: "tagalog", label: "� Filipino" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() =>
                  dispatch({ type: "SET_LANGUAGE", payload: lang.id })
                }
                aria-pressed={state.language === lang.id}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  state.language === lang.id
                    ? "bg-teal text-white"
                    : "bg-gray-100 text-muted-text"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-2">
            {t.settings.fontSizeLabel}
          </label>
          <div className="flex gap-2">
            {[
              { id: "small", previewClass: "text-sm" },
              { id: "medium", previewClass: "text-base" },
              { id: "large", previewClass: "text-xl" },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() =>
                  dispatch({ type: "SET_FONT_SIZE", payload: size.id })
                }
                aria-pressed={state.fontSize === size.id}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors flex flex-col items-center gap-0.5 ${
                  state.fontSize === size.id
                    ? "bg-teal text-white"
                    : "bg-gray-100 text-muted-text"
                }`}
              >
                <span className={`${size.previewClass} font-bold leading-none`}>A</span>
                <span className="text-xs">
                  {size.id === "small" ? t.settings.fontSmall : size.id === "medium" ? t.settings.fontMedium : t.settings.fontLarge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dyslexia font */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm text-dark-text">
                {t.settings.dyslexiaLabel}
              </p>
              <p className="text-muted-text text-xs">
                {t.settings.dyslexiaSub}
              </p>
            </div>
            <button
              onClick={() =>
                dispatch({
                  type: "SET_DYSLEXIA_FONT",
                  payload: !state.dyslexiaFont,
                })
              }
              role="switch"
              aria-checked={state.dyslexiaFont}
              className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors relative overflow-hidden ${
                state.dyslexiaFont ? "bg-teal" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  state.dyslexiaFont ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* TTS Speed */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-2">
            {t.settings.ttsLabel(state.ttsSpeed)}
          </label>
          <div className="flex gap-2">
            {[
              { val: 0.5, key: "ttsSlow" },
              { val: 0.8, key: "ttsNormal" },
              { val: 1.2, key: "ttsFast" },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() =>
                  dispatch({ type: "SET_TTS_SPEED", payload: s.val })
                }
                aria-pressed={state.ttsSpeed === s.val}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  state.ttsSpeed === s.val
                    ? "bg-lavender text-white"
                    : "bg-gray-100 text-muted-text"
                }`}
              >
                {t.settings[s.key]}
              </button>
            ))}
          </div>
        </div>

        {/* Color overlay */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-2">
            {t.settings.overlayLabel}
          </label>
          <div className="flex gap-2">
            {[
              { id: "none", labelKey: "overlayNone", color: "bg-gray-100" },
              { id: "yellow", labelKey: "overlayYellow", color: "bg-sun-yellow/40" },
              { id: "blue", labelKey: "overlayBlue", color: "bg-sky-blue/40" },
              { id: "pink", labelKey: "overlayPink", color: "bg-coral/30" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() =>
                  dispatch({ type: "SET_COLOR_OVERLAY", payload: o.id })
                }
                aria-pressed={state.colorOverlay === o.id}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  o.color
                } ${
                  state.colorOverlay === o.id
                    ? "ring-2 ring-teal ring-offset-2"
                    : ""
                }`}
              >
                {t.settings[o.labelKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="font-heading font-bold text-sm text-dark-text block mb-1">
            {t.settings.apiLabel}
          </label>
          <p className={`text-xs mb-3 font-semibold ${keyIsSet ? "text-leaf-green" : "text-muted-text"}`}>
            {keyIsSet
              ? t.settings.apiKeySet
              : t.settings.apiKeyUnset}
          </p>
          {keyIsSet ? (
            <button
              onClick={handleClearKey}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-coral/10 text-coral text-sm font-semibold border border-coral/20"
            >
              <X size={14} />
              {t.settings.apiRemove}
            </button>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                  placeholder={t.settings.apiPlaceholder}
                  className="w-full bg-cream rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-teal/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Itago ang API key" : "Ipakita ang API key"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!apiKeyInput.trim()}
                className="bg-teal text-white text-sm font-bold px-4 rounded-xl disabled:opacity-40"
              >
                {keySaved ? t.settings.apiSaved : t.settings.apiSave}
              </button>
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-coral/20">
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full text-coral font-semibold text-sm flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} />
              {t.settings.resetBtn}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-dark-text mb-3 font-semibold">
                {t.settings.resetConfirm}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-muted-text text-sm font-semibold"
                >
                  {t.settings.resetCancel}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold"
                >
                  {t.settings.resetConfirmBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Mascot size={28} />
          <p className="font-heading font-bold text-sm text-dark-text mt-1">
            {t.settings.version}
          </p>
          <p className="text-muted-text text-xs">
            {t.settings.tagline}
          </p>
          <p className="text-muted-text text-xs mt-1">
            {t.settings.credit}
          </p>
        </div>
      </div>
    </div>
  );
}
