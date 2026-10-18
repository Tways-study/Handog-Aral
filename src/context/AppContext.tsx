"use client";

import { createContext, useContext, useReducer, useEffect, useState, type Dispatch, type ReactNode } from "react";
import type { Action, AppState } from "@/shared/types";

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const STORAGE_KEY = "handog-aral-state";
/** sessionStorage flag set once the welcome screen has been shown. */
export const WELCOMED_KEY = "handog-aral-welcomed";

export const initialState: AppState = {
  childName: "",
  language: "hiligaynon",
  fontSize: "medium",
  dyslexiaFont: false,
  ttsSpeed: 0.8,
  colorOverlay: "none",
  stars: 0,
  wordsLearned: [],
  currentBook: null,
  wordCache: {},
  bookProgress: {},
  streak: 0,
  lastActiveDate: null,
  quizHighScore: 0,
};

function loadState(): AppState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      return { ...initialState, ...parsed };
    }
  } catch {
    // ignore
  }
  return null;
}

/** True when the device has saved progress (used to skip the welcome screen). */
export function hasSavedProgress(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Boolean(parsed?.wordsLearned?.length > 0 || parsed?.childName || parsed?.streak > 0);
    }
  } catch {
    // ignore
  }
  return false;
}

function reducer(state: AppState, action: Action | { type: "HYDRATE"; payload: AppState }): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "SET_NAME":
      return { ...state, childName: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.payload };
    case "SET_DYSLEXIA_FONT":
      return { ...state, dyslexiaFont: action.payload };
    case "SET_TTS_SPEED":
      return { ...state, ttsSpeed: action.payload };
    case "SET_COLOR_OVERLAY":
      return { ...state, colorOverlay: action.payload };
    case "ADD_STAR":
      return { ...state, stars: Math.min(5, state.stars + 1) };
    case "LEARN_WORD": {
      const word = action.payload;
      if (state.wordsLearned.find((w) => w.word === word.word)) return state;
      const newWords = [...state.wordsLearned, word];
      const newStars = Math.min(5, Math.floor(newWords.length / 3));
      let newBookProgress = state.bookProgress;
      if (word.bookId) {
        const count = newWords.filter((w) => w.bookId === word.bookId).length;
        const pct = Math.min(100, Math.round((count / 6) * 100));
        newBookProgress = { ...state.bookProgress, [word.bookId]: pct };
      }
      return { ...state, wordsLearned: newWords, stars: newStars, bookProgress: newBookProgress };
    }
    case "CACHE_WORD":
      return {
        ...state,
        wordCache: { ...state.wordCache, [action.payload.word.toLowerCase()]: action.payload.data },
      };
    case "SET_CURRENT_BOOK":
      return { ...state, currentBook: action.payload };
    case "SET_BOOK_PROGRESS":
      return {
        ...state,
        bookProgress: { ...state.bookProgress, [action.payload.id]: action.payload.progress },
      };
    case "UPDATE_STREAK": {
      const today = new Date().toISOString().split("T")[0];
      if (state.lastActiveDate === today) return state;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
      return { ...state, streak: newStreak, lastActiveDate: today };
    }
    case "SET_QUIZ_HIGH_SCORE":
      return { ...state, quizHighScore: Math.max(state.quizHighScore || 0, action.payload) };
    case "REMOVE_WORD": {
      const removed = state.wordsLearned.filter(
        (w) => w.word.toLowerCase() === action.payload.toLowerCase()
      );
      const newWords = state.wordsLearned.filter(
        (w) => w.word.toLowerCase() !== action.payload.toLowerCase()
      );
      const newStars = Math.min(5, Math.floor(newWords.length / 3));
      const newBookProgress = { ...state.bookProgress };
      removed.forEach((rw) => {
        if (rw.bookId) {
          const count = newWords.filter((w) => w.bookId === rw.bookId).length;
          newBookProgress[rw.bookId] = Math.min(100, Math.round((count / 6) * 100));
        }
      });
      return { ...state, wordsLearned: newWords, stars: newStars, bookProgress: newBookProgress };
    }
    case "RESET_PROGRESS":
      return { ...initialState, childName: state.childName, language: state.language };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  // Persisted state is read after mount so server HTML and the first client render match.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) rawDispatch({ type: "HYDRATE", payload: saved });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration flag
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  useEffect(() => {
    document.body.className = "";
    if (state.dyslexiaFont) document.body.classList.add("dyslexia-font");
    document.documentElement.classList.remove("font-small", "font-medium", "font-large");
    document.documentElement.classList.add(`font-${state.fontSize}`);
  }, [state.dyslexiaFont, state.fontSize]);

  // Children render only after hydration so screens never see (and persist) default state.
  return (
    <AppContext.Provider value={{ state, dispatch: rawDispatch as Dispatch<Action> }}>
      {hydrated ? children : null}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
