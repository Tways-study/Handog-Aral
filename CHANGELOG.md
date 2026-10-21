# Changelog

Version history for Handog Aral, reconstructed from the git log. v2 was the Vite app; v3 is the Next.js overhaul, merged to `main` (see `docs/v3-plan.md` for status). `package.json` is `3.0.0-beta.1`.

## v3 (3.0.0-beta.1)

### 2026-10-22 · Fun and cute round
- Procedural three.js toon owl (lazy, with a flat SVG fallback and safe refusals on slow, low-end or reduced-motion devices), moods and a wardrobe (glasses, cap, bow).
- Rewards: 14 stickers, celebration dialog, "Pares" memory game, optional synthesized sounds and haptics, first-time moments.
- Redrawn art, shape-coded difficulty, GSAP motion gated on reduced motion.
- Fixes: offline crash from lazy chunks (`softDynamic`), settings mirror no longer rehydrates from an older copy.

### 2026-10-21 · Polish, production hardening, accessibility
- Pad Paper Storybook comp approved; `DESIGN.md` written from the finished build and the notebook label colours moved into tokens.
- Review fixes: authored rubber-stamp star and check, neutral disabled buttons, left-aligned Quiz and Settings columns, Home tally of two chips, a single percentage, taller cover and pad on desktop.
- Polish: tactile pressed states, notebook Welcome, Home shelf, Books counts, calmer Settings, scan tiles and processing moment, segmented Words filter with skeletons, quiz results stamps, empty progress at 0%.
- Production: in-world error pages, metadata and social previews, security headers, install button, manifest shortcuts and install screenshots, release checklist (`docs/release-checklist.md`).
- Performance (revertible): synchronous `localStorage` mirror for the stores and a deferred data-layer boot.
- Accessibility: Playwright axe suite for WCAG 2.1 AA; accessible names now come from visible text (WCAG 2.5.3); bottom nav labels survive Large font, dyslexia font and Tagalog.
- Rewrote `README.md` and `CLAUDE.md` for the v3 architecture.

### 2026-10-19 · Phases 2 to 4: data layer, design system, screens
- **Data layer:** Dexie database, persisted zustand stores, one-time import of the pre-v3 `localStorage` blob, word-explanation pipeline, offline lookup queue, tokenizer.
- **AI proxy:** `/api/explain`, `/api/ocr` and `/api/health` routes with a server-side Gemini module, per-IP Upstash rate limiting, origin allowlist and zod contracts. The Gemini key is no longer in the client.
- **Offline OCR and TTS:** self-hosted Tesseract assets and a text-to-speech wrapper (native on Android, Web Speech elsewhere).
- **Design system:** pad-paper tokens with a WCAG contrast test, shadcn components adapted to them, `DifficultyStamp`, GSAP motion helpers gated on `prefers-reduced-motion`, SVG owl mascot and book covers, dev-only `/design` showcase.
- **App shell and PWA:** bottom nav and left rail, `PageHeader`/`PageContainer`, theme sync, offline banner, manifest and icons, prompt-to-update service worker.
- **Screens:** Home, Books, Welcome, Reader (`/read/[bookId]`), Scan, word panel, Words, Quiz and Settings, with Hiligaynon and Tagalog strings split per feature.
- Removed the legacy `AppContext`, Gemini client, old services and legacy CSS.
- Fixed: keyboard focus ring (Tailwind v4 `outline-none` vs `focus-visible:outline-3`), focus moved into and trapped in the word drawer, the service worker no longer caches `/api/*`, precache glob follows `NEXT_DIST_DIR`.
- Added Playwright e2e specs for first run, reader, quiz, settings, offline lookup and upgrade, scan, reduced motion and keyboard use.

### 2026-10-18 · Phases 0 and 1: direction and foundation
- Product record, design direction contract and v3 comp; `CLAUDE.md` project guidance.
- Migrated from Vite to Next.js 16 + TypeScript (App Router, Tailwind v4, Serwist).
- Added the v3 overhaul plan.

## v2 (Vite, April 2026)

- **2026-04-19:** README update; toggle button fix.
- **2026-04-18:** Fixed the book progress bar.
- **2026-04-16:** Removed unused files.
- **2026-04-12:** UX improvements and README; fixes to the camera bracket guide area, translations and the toggle button.
- **2026-04-11:** Accessibility fixes and subtle hover animations.
- **2026-04-07:** Improved TTS reader; fixed language translation bugs; aligned books to the offline dictionary with language-aware fallbacks and a dynamic Home book count.
- **2026-04-06:** New palette, UI consistency fixes and a language option change.
- **2026-04-05:** New features and minor UI fixes.
- **2026-04-04:** Downgraded Vite for plugin compatibility.
- **2026-04-03:** Initial commit (Handog Aral v2); added camera scan using the device camera.
