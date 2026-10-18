# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Handog Aral is a reading companion for Filipino children (ages 6–12, including children with dyslexia). A child scans a book page, taps a word, and gets a definition explained in Hiligaynon or Filipino/Tagalog. It is a React 19 + Vite 7 + Tailwind v4 PWA, wrapped for Android with Capacitor. It is plain JavaScript (JSX), not TypeScript.

## Commands

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # outputs dist/
npm run preview    # serve the production build
npm run lint       # eslint .
```

Android: `npm run build && npx cap sync android && npx cap open android`. Capacitor serves `dist/` (see `capacitor.config.json`), so rebuild before every sync.

There is no test runner configured.

Optional env: `VITE_GEMINI_API_KEY` in `.env`. The user can also enter a key at runtime in Settings, which stores it in `localStorage` under `handog-gemini-key`. The app must keep working with no key.

## Architecture

**State.** All state is one `useReducer` in `src/context/AppContext.jsx`, persisted to `localStorage` (`handog-aral-state`) and merged over `initialState` on load. Screens read it through `useApp()` and dispatch typed actions (`LEARN_WORD`, `CACHE_WORD`, `UPDATE_STREAK`, …). `stars` and per-book `bookProgress` are derived inside the `LEARN_WORD` reducer case (stars = `floor(words/3)`, capped at 5; book progress = learned words for that book / 6). Do not set them separately.

**Navigation.** There is no router. `src/App.jsx` holds a `screen` string and renders the matching screen in `src/screens/`, and `BottomNav` calls `onNavigate`. Keep it this way; it avoids URL routing in the Capacitor wrapper.

**Localization.** Child-facing strings live in `src/data/translations.js`, keyed by `hiligaynon` / `tagalog`, and are read through the `useTranslations()` hook. Settings labels are English because parents and teachers use them. New UI text needs entries in both languages.

**Word-definition pipeline** (`src/services/geminiService.js`, `explainWord`). Order of resolution:
1. `state.wordCache` check in `ScanScreen`
2. `src/data/fallbackWords.js` (curated entries, no network)
3. Gemini (`gemini-2.0-flash`), if a key exists, with the surrounding sentence passed as context
4. `dictionaryapi.dev`, with `generateLocalTranslation()` building a templated Hiligaynon/Tagalog gloss
5. A generic placeholder

`ScanScreen` builds the cache key as `` `${word}_${language}` `` so a language switch refetches. The `CACHE_WORD` reducer only lowercases the key, so the caller owns the key format. The README says "250 curated entries"; trust the file, not the README, for specifics.

**OCR** (`src/services/ocrService.js`). It tries Gemini Vision first, then falls back to `tesseract.js`, which is dynamically imported to keep the initial bundle small. `CameraScanner` handles `getUserMedia` capture and gallery pick and passes a `File` to this service.

**Accessibility settings.** These are applied as CSS classes rather than props: font size as `html.font-{small,medium,large}` (with a `--nav-h` variable so `.pb-nav` clears the nav bar), dyslexia mode as `body.dyslexia-font`, and the color overlay as `overlay-{yellow,blue,pink}` on the scan viewport. Layout uses `rem` so everything scales with font size; avoid `px` for text and spacing.

**PWA.** `vite.config.js` uses `vite-plugin-pwa` (`autoUpdate`, Workbox `generateSW`). The manifest references `/icon-192.png` and `/icon-512.png`, but `public/` currently only contains `favicon.svg`.

## Repo notes

- `.agent.md` is a read-only "Senior Code Reviewer" agent profile. It says to use camelCase for variables and PascalCase for components, and to validate external input with Zod. Zod is not a dependency and the code does not use it.
- `README.md` is long and partly duplicated (it has two tech-stack and two architecture sections, and several version changelogs). Prefer the code when they disagree.
- ESLint ignores unused variables that start with an uppercase letter or `_`.
