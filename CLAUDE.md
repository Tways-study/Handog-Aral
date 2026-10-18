# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Handog Aral is a reading companion for Filipino children (ages 6–12, including children with dyslexia). A child scans a book page, taps a word, and gets a definition explained in Hiligaynon or Filipino/Tagalog. It is a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 PWA, wrapped for Android with Capacitor. The v3 overhaul is in progress on the `v3-overhaul` branch (see `PRODUCT.md`); the current UI is still the pre-redesign look.

## Commands

```bash
npm install
npm run dev          # next dev (http://localhost:3000)
npm run build        # web build (Vercel target), Serwist service worker enabled
npm start            # serve the production web build
npm run build:android  # BUILD_TARGET=capacitor next build && npx cap sync android
npm run typecheck    # tsc --noEmit
npm run lint         # eslint . (eslint-config-next)
npm test             # vitest run (jsdom)
npm run e2e          # playwright test (starts next dev; mobile 375x812 + desktop 1280x800)
```

**Two build targets, one codebase.** `next build` is the web target. `BUILD_TARGET=capacitor next build` is the Android target: `output: 'export'`, `trailingSlash`, unoptimized images, `pageExtensions: ['tsx']` (so `route.ts` handlers such as the Serwist route and future `/api/*` are left out), no service worker. It writes to `out/`, which `capacitor.config.json` serves (`webDir: "out"`). Run `npx cap open android` afterward.

Optional env: `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local` (temporary client-side path; the user can also enter a key in Settings, stored in `localStorage` as `handog-gemini-key`). The app must keep working with no key. This moves behind a server proxy in a later phase.

## Architecture

**State.** All state is one `useReducer` in `src/context/AppContext.tsx`, persisted to `localStorage` (`handog-aral-state`) and merged over `initialState` on load. `AppProvider` is a client component that loads persisted state in an effect and renders children only after mount, so nothing reads `localStorage` during SSR. Shared types (`AppState`, `Action`, `WordEntry`, `Book`) are in `src/shared/types.ts`. Screens read it through `useApp()` and dispatch typed actions (`LEARN_WORD`, `CACHE_WORD`, `UPDATE_STREAK`, …). `stars` and per-book `bookProgress` are derived inside the `LEARN_WORD` reducer case (stars = `floor(words/3)`, capped at 5; book progress = learned words for that book / 6). Do not set them separately.

**Navigation.** App Router, one thin server `page.tsx` per route rendering a `"use client"` screen from `src/features/<name>/`. Routes: `/` (Home), `/scan`, `/books`, `/words` (vocabulary), `/quiz`, `/settings`, `/welcome` (splash). `BottomNav` is rendered once in `src/app/layout.tsx` and hidden on `/welcome`. Home redirects to `/welcome` on first run (no saved progress and no `handog-aral-welcomed` in sessionStorage). Choosing a book sets `currentBook` and goes to `/scan`; `/read/[bookId]` comes later. Use `next/link` / `useRouter`, and keep `window`/`localStorage` access out of module scope and server render.

**Layout.** `src/app` (routes, `globals.css`, `sw.ts`, `serwist/[path]/route.ts`), `src/features` (screens), `src/components` (shared UI; `ui/` is shadcn), `src/context`, `src/hooks`, `src/lib` (services, `fonts.ts`, `utils.ts` with `cn`), `src/data`, `src/shared`. Alias `@/*` -> `src/*`. Fonts (Baloo 2, Nunito, Atkinson Hyperlegible) come from `next/font/google` in `src/lib/fonts.ts`.

**Localization.** Child-facing strings live in `src/data/translations.ts`, keyed by `hiligaynon` / `tagalog`, and are read through the `useTranslations()` hook. Settings labels are English because parents and teachers use them. New UI text needs entries in both languages.

**Word-definition pipeline** (`src/lib/geminiService.ts`, `explainWord`). Order of resolution:
1. `state.wordCache` check in `ScanScreen`
2. `src/data/fallbackWords.ts` (curated entries, no network)
3. Gemini (`gemini-2.0-flash`), if a key exists, with the surrounding sentence passed as context
4. `dictionaryapi.dev`, with `generateLocalTranslation()` building a templated Hiligaynon/Tagalog gloss
5. A generic placeholder

`ScanScreen` builds the cache key as `` `${word}_${language}` `` so a language switch refetches. The `CACHE_WORD` reducer only lowercases the key, so the caller owns the key format. The README says "250 curated entries"; trust the file, not the README, for specifics.

**OCR** (`src/lib/ocrService.ts`). It tries Gemini Vision first, then falls back to `tesseract.js`, which is dynamically imported to keep the initial bundle small. `CameraScanner` handles `getUserMedia` capture and gallery pick and passes a `File` to this service.

**Accessibility settings.** These are applied as CSS classes rather than props: font size as `html.font-{small,medium,large}` (with a `--nav-h` variable so `.pb-nav` clears the nav bar), dyslexia mode as `body.dyslexia-font`, and the color overlay as `overlay-{yellow,blue,pink}` on the scan viewport. Layout uses `rem` so everything scales with font size; avoid `px` for text and spacing.

**PWA.** Serwist via `@serwist/turbopack`: `next.config.ts` wraps the config with `withSerwist` (web target only), `src/app/serwist/[path]/route.ts` builds `/serwist/sw.js` from `src/app/sw.ts` (precache manifest + `defaultCache`), and `SerwistProvider` in `src/components/Providers.tsx` registers it in production only. There is no web app manifest and `public/` has only `favicon.svg` yet (icons and manifest come in a later phase).

## Repo notes

- `.agent.md` is a read-only "Senior Code Reviewer" agent profile. It says to use camelCase for variables and PascalCase for components, and to validate external input with Zod. Zod is installed but not used yet.
- `README.md` is long and partly duplicated (it has two tech-stack and two architecture sections, and several version changelogs). Prefer the code when they disagree.
- ESLint (flat config, `eslint-config-next`) ignores unused variables that start with an uppercase letter or `_`.
