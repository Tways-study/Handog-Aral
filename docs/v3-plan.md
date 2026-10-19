# Handog Aral v3: stack upgrade, UI overhaul, AI/OCR and offline hardening

## Status and how to resume (updated 2026-10-18)

Branch: **`v3-overhaul`** (not pushed).

| Phase | State | Commit |
|---|---|---|
| 0. Design direction | Done. `PRODUCT.md`, the direction contract in `.impeccable/surfaces/src-app-jsx.md` and the approved comp `.impeccable/mocks/home-reader-comp.html` are committed | `907598f` |
| 1. Next.js 16 foundation | Done. typecheck, lint, test, build and the Capacitor export all pass (verified) | `440f69b` |
| Phase 2 prep | Done. Shared contracts `src/shared/schemas.ts` and `src/lib/api.ts` (stub) committed; all Phase 2 dependencies installed | `08c34d6`, `89f9319` |
| 2. Parallel core (A/B/C) | Done (rerun in the main checkout, no worktrees). Data layer, Gemini proxy and OCR/TTS are committed; typecheck, lint, 76 tests, the web build and the Android export all pass (verified). Proxy guard rails checked against a production build. Not yet wired into any screen. | `508a5dc`, `5887a14`, `399f3cc`, `d59b325` |
| 3. Design system + shell | Done and verified (159 tests, both builds, screenshots reviewed). Token-driven pad-paper design system, shadcn components, AppShell (bottom nav / rail), SVG owl + covers, GSAP helpers, PWA manifest/icons/update prompt/offline page, dev-only `/design` showcase. Old screens still run on a LEGACY token block. | `34de880`..`b9d37c1` |
| Phase 4 prep | Done: translations split per feature (`src/data/strings/*`), reading settings applied from the settings store, shared `src/lib/vocabulary.ts` (learnWord/forgetWord keep progress in sync) and `useSavedWords` hook | `d03aa20`, `2ccf128`, `499dd86` |
| 4. Screens (D/E/F) | Done and integrated. Reader (`/scan`, `/read/[bookId]`, WordPanel, camera), Home/Books/Welcome (first-run onboarding), Words/Quiz/Settings (offline pack control, no API-key card). Legacy `AppContext`, Gemini client, old services and legacy CSS removed; hydration gate added. typecheck, lint, 227 tests, web and Capacitor builds pass (verified); mechanical design detector: no findings | `5cb721d`..`9ee1604` |
| 5. Offline dictionary build | **Blocked on a `GEMINI_API_KEY` on the dev machine** (script not written yet) | none |
| 6. Audit + polish | In progress: Playwright e2e (agent), then Impeccable audit/critique, `/qa`, README + CLAUDE.md update, DESIGN.md | none |

### Before resuming
Check `df -h /` (keep at least 5 GB free). Then tell Claude: "resume the v3 plan from docs/v3-plan.md".

### Lessons from the Phase 2 attempt
- **Run parallel agents in the main checkout, not worktrees** (what worked for the rerun): give each agent disjoint file paths and have it commit only those paths. Never `npm install` in extra copies of the repo.
- (Original note) **Don't `npm install` in worktrees.** Running three full installs at once is what filled the disk. Every Phase 2 dependency is already in `v3-overhaul`. In each worktree, symlink the main repo's `node_modules` (`ln -s ../../../node_modules node_modules`) and forbid installs in the agent brief.
- **Worktree base:** isolated worktrees start from `main`. Each agent's first step must be `git reset --hard v3-overhaul` (or check out a branch from it), then confirm that `src/shared/schemas.ts` exists.
- **Gemini model:** the installed `@google/genai` (2.30.0) README uses `gemini-flash-latest`. Default `GEMINI_MODEL` to that, never `gemini-2.0-flash`.
- **Zod v4:** use `z.toJSONSchema(WordExplanationSchema)` for Gemini's `responseJsonSchema`.
- **Vitest uses jsdom by default:** server and route-handler tests need `// @vitest-environment node`.
- Tesseract traineddata isn't in node_modules (`@tesseract.js-data` is absent). `scripts/copy-tesseract.mjs` must download `eng` once. Read tesseract.js 7's default `langPath` for the URL.
- Phase 1 follow-ups for Phase 3:
  - `AppProvider` renders nothing until mount, so the server HTML is empty. Add a pad-paper loading frame.
  - `sw.ts` uses `skipWaiting: true`. Switch to the prompt-to-update flow.
  - No web manifest or icons yet.
  - Old keyframes and the global `button:hover` transform are still in `globals.css`.
  - `sonner` and `vaul` are installed but not wired up.

---

## Context

Handog Aral was a React 19 + Vite 7 + Tailwind v4 PWA (Capacitor for Android). It helps Filipino children aged 6–12, including children with dyslexia, read English. A child scans a page, taps a word, and gets an explanation in Hiligaynon or Tagalog.

The old UI looked vibecoded:
- inline gradients and hex colors everywhere
- emoji used as icons and as the mascot
- duplicated card markup
- a fixed 390px column on every screen size
- no design tokens and no dark mode

The AI and offline layers were fragile:
- The Gemini key shipped in the bundle or sat in localStorage.
- Gemini responses were parsed as JSON with no schema or validation.
- Tesseract loaded its files from a CDN, so OCR failed on a cold cache offline.
- Offline placeholder definitions were cached permanently.
- localStorage could hit its quota and fail silently.

There were also real bugs:
- The quiz results screen dispatched during render, which looped. Phase 1 fixed this.
- Quiz stars got overwritten when words changed.
- Android was missing the CAMERA permission.
- TTS didn't work in Android WebView.
- Async OCR and word lookups raced each other.

**Goal:** a mobile-first PWA with a real desktop layout, the "Pad Paper Storybook" design system built on shadcn/ui, restrained GSAP motion, TypeScript, Gemini behind a server proxy, and offline behavior that degrades gracefully and recovers on its own.

### Decisions (confirmed with the user)
| Topic | Choice |
|---|---|
| Framework | **Next.js 16 (App Router) + React 19** (changed from Vite mid-planning) |
| Visual direction | Warm storybook rendered as **Pad Paper Storybook** (approved comp): pad-paper reading surface with blue rules and a red margin, saturated book-jacket notebook covers, a sunrise-orange primary accent, an SVG owl, Baloo 2 + Atkinson Hyperlegible, a real OpenDyslexic option |
| Language | TypeScript |
| AI | Gemini through a server proxy (Next Route Handlers on Vercel); the key is server-side only; no in-app key entry |
| Abuse guard | Per-IP rate limit (Upstash Redis), origin allowlist, payload caps |
| Offline | Self-hosted Tesseract, a large offline dictionary, a queue that upgrades offline lookups, IndexedDB storage |
| Desktop | Left nav rail at `lg`, two-pane reader with the word panel docked on the right |
| Themes | Light + dark ("night pad") |
| Brand (binding) | Name "Handog Aral", the tagline "Ang Imo Gabay sa Pagbasa", an owl mascot. Teal is **not** binding. |

## Target stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript. This replaces Vite, `vite-plugin-pwa` and `react-router`.
- **Kept:** Tailwind v4 (via `@tailwindcss/postcss`), lucide-react, Capacitor 8
- **UI:** shadcn/ui (`components.json`, `@/` alias, `cn`), `gsap` + `@gsap/react`, `vaul` (shadcn Drawer), `sonner`
- **Fonts:** Baloo 2 and Atkinson Hyperlegible through `next/font/google`, self-hosted at build time. OpenDyslexic through `next/font/local` from `src/fonts/`.
- **PWA:** Serwist (`@serwist/turbopack`), `app/manifest.ts`, service worker at `src/app/sw.ts`, served by the `src/app/serwist/[path]/route.ts` route
- **App:** `zustand` with persist on `idb-keyval` for settings and progress, `dexie` for wordCache, the dictionary, the lookup queue and saved words, `zod` (shared client/server schemas)
- **Server/tests:** `@google/genai`, `@upstash/ratelimit` + `@upstash/redis`, `server-only`, Vitest + Testing Library + `fake-indexeddb`, Playwright
- **Native:** `@capacitor-community/text-to-speech` 8, `@capacitor/app` 8
- **Removed:** Vite and its plugins, `autoprefixer`, and later the client-side `@google/generative-ai`, all custom keyframes and the global `button:hover` transform

### Two build targets from one codebase
- **Web (Vercel):** a normal `next build`. The pages are static/client components, and the Gemini proxy runs as Route Handlers under `src/app/api/*/route.ts` on the same deployment.
- **Android (Capacitor):** `BUILD_TARGET=capacitor next build` with `output: 'export'`, `images.unoptimized` and `trailingSlash: true`, writing to `out/`. Capacitor's `webDir` is `out`.
  - `pageExtensions` is set to `['tsx']` in this mode, so the `route.ts` API handlers (and the Serwist route) are left out of the export.
  - The app calls the deployed proxy through `NEXT_PUBLIC_API_BASE`.
- Every page is a thin server shell wrapping one `"use client"` screen. There's no SSR data fetching, so both targets behave the same.
- `/read/[bookId]` uses `generateStaticParams` over the 6 bundled books.

## Architecture

### 1. Project structure
```
src/
  app/
    layout.tsx        fonts, theme, <Providers>, <AppShell>
    page.tsx          Home                     welcome/page.tsx
    scan/  read/[bookId]/  books/  words/  quiz/  settings/   (page.tsx each)
    api/explain/route.ts  api/ocr/route.ts  api/health/route.ts   (excluded from the Capacitor export)
    serwist/[path]/route.ts   manifest.ts   sw.ts
  components/ui/      shadcn-generated (never hand-edited beyond tokens)
  components/         AppShell.tsx (bottom nav < lg, rail ≥ lg), Mascot.tsx, BookCover.tsx, WordPanel.tsx, ReaderText.tsx, OfflineBanner.tsx …
  features/           home/ scan/ reader/ books/ vocabulary/ quiz/ settings/ welcome/  ("use client" screens + hooks)
  lib/                api.ts (proxy client), ocr/, dictionary/, queue/, tts/, motion.ts, tokenize.ts, utils.ts
  server/             gemini.ts, ratelimit.ts, cors.ts   (route handlers only; `server-only`)
  stores/             db.ts (dexie), settings.ts, progress.ts (zustand), migrate.ts
  shared/             schemas.ts (zod contract, committed), types.ts
scripts/              copy-tesseract.mjs, build-dictionary.ts, gen-pwa-assets
```

### 2. Design system (Pad Paper Storybook)
The approved comp is `.impeccable/mocks/home-reader-comp.html`, and the direction contract is in `.impeccable/surfaces/src-app-jsx.md`. DESIGN.md is written at the end, from the finished build (Phase 6).

- Tokens are shadcn CSS variables in `src/app/globals.css`, under `:root` and `.dark`. Every component color comes from a token. Starting values come from the comp:

  | Token | Light | Dark |
  |---|---|---|
  | paper | `#FBF7EE` | `#1A1D2A` |
  | paper-2 | `#F2EBDC` | |
  | ink | `#1D2340` | `#EFE7D6` |
  | ink-2 | `#4A5070` | |
  | rule (pad lines) | `#C3D3EE` | `#2F3A57` |
  | margin | `#E0756C` | `#8F3E3A` |
  | sunrise (the one primary accent, ink text on it) | `#F08A24` | `#F39A3D` |
  | marker (tapped word) | `#FFD49A` | |

  Book-jacket colors: indigo `#2B3A8C`, kangkong `#2E7D55`, mango `#F2B233` (ink text), gumamela `#C8323A`.
- **Pad paper as a real baseline grid:** reading line height equals rule pitch at every font size (about 2.25rem on mobile, 2.5rem on desktop), with a red margin line.
- **One highlight at a time:** only the tapped word and the primary action use sunrise.
- **Shape encodes state:** difficulty stamps are circle = easy, square = medium, triangle = hard, never color alone. Rewards are rubber-stamp stars and teacher check marks.
- **Upgrades restyle in place:** when an offline result is upgraded by AI, the word restyles without any layout shift.
- **Typography:**
  - Baloo 2 for headings and Atkinson Hyperlegible for body text, at least 16px; reading text 20–22px.
  - `html.font-{small,medium,large}` scales everything in rem.
  - `body.dyslexia-font` switches to the real OpenDyslexic and adds spacing.
  - Pinch-zoom stays enabled.
- **No emoji as UI:** lucide icons, an SVG owl (idle/cheer/think) and SVG book covers. `books.ts` gets `coverId` and a `jacket` token instead of emoji + hex.
- Touch targets are at least 44px, and every icon-only button has an `aria-label`. The mascot is `aria-hidden`. Focus rings, text selection, the caret and scrollbars are themed.
- shadcn components: button, card, drawer, sheet, dialog, tabs, toggle-group, switch, slider, input, label, badge, progress, skeleton, sonner, tooltip, scroll-area, alert.
- **Copy:**
  - Child-facing text is in Hiligaynon or Tagalog. Comp nav labels: Balay (home), Libro (books), I-scan, Pulong (words), Pasulit (quiz).
  - Settings labels are in English.
  - All strings live in `translations.ts`, typed with `satisfies`.

### 3. Layout and navigation
- Routes: `/`, `/scan`, `/read/[bookId]`, `/books`, `/words`, `/quiz`, `/settings`, `/welcome` (first run; no blocking timer). Navigation uses `next/link` and `useRouter`. The Android back button calls `router.back()` through `@capacitor/app`.
- Below `lg`: a bottom nav (Balay, Libro, raised Scan, Pulong, Pasulit), with settings as a gear in the header.
- At `lg` and above: a left nav rail plus a content max width.
- **Home:** a notebook cover in the current book's jacket color takes about 45% of the height, with the owl perched on its top edge, a notebook label box (title, progress) and a large sunrise "I-scan ang pahina" button. Below it, a pad strip lists the latest saved words.
- **Reader:** the word explanation is a vaul Drawer on mobile and a docked right `WordPanel` on desktop, with the same content. The home-language explanation comes first, then the English meaning, then an example sentence with the word marked, then Listen and Save buttons, then a source line (AI, dictionary, or offline).

### 4. Motion (GSAP, restrained)
- `src/lib/motion.ts`: `gsap.matchMedia()`, with everything gated on `(prefers-reduced-motion: no-preference)`. Durations are 150–300ms with exponential ease-out, starting from an already-visible default.
- One authored moment per flow:
  - the word panel/drawer entrance
  - the tapped-word marker sweep
  - quiz check-mark stamp feedback
  - the star-stamp celebration (once, never looped)
  - the scan progress sweep
  - a subtle route fade
- No infinite decorative loops.

### 5. AI proxy (Next Route Handlers, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`)
- `POST /api/explain {word, sentence, language}` calls Gemini (`GEMINI_MODEL`, default `gemini-flash-latest`) with `responseMimeType: application/json` and `responseJsonSchema = z.toJSONSchema(WordExplanationSchema)`.
  - The result is validated with zod; if invalid, one repair retry, otherwise 502.
  - Word and sentence are passed as delimited data, not instructions.
  - The prompt keeps the old child-tutor intent (see git history of `src/geminiService.js`).
- `POST /api/ocr {imageBase64, mime}` uses Gemini Vision with the old strict-transcription prompt and returns `{text}`.
- `GET /api/health` returns `{ok:true}` and is used by `isReachable()`.
- `src/server/`:
  - `ratelimit.ts`: Upstash sliding window per IP, 30 explains/min and 6 OCR/min. Fail-open with a warning in dev when the env vars are missing; fail-closed (503) in production.
  - `cors.ts`: `ALLOWED_ORIGINS` plus `https://localhost` and `capacitor://localhost`, plus same-origin requests. Disallowed origins get 403.
  - Body caps of 8KB for explain and about 4MB for OCR. 15s upstream timeout.
  - Status codes: 400 invalid, 413 too large, 429 rate limited with `Retry-After`, 502 upstream, 504 timeout. All responses are `no-store`.
- Client `src/lib/api.ts`: the signatures are already committed as a stub.
  - Timeouts combined with the caller's `AbortSignal`, defaulting to 12s for explain, 25s for OCR and 4s for health.
  - When `navigator.onLine` is false, return `'offline'` without fetching. A network error also maps to `'offline'`.
  - 429 maps to `'rate_limited'` with no retry. 5xx and timeouts get one retry with jitter, then `'error'`.
  - Success bodies are validated with zod. Blob → base64 uses FileReader.
- Env vars (`.env.example`): `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_BASE`.
- Remove the Settings API-key card, `setApiKey`/`clearApiKey`/`hasApiKey`, the `handog-gemini-key` storage key and `NEXT_PUBLIC_GEMINI_API_KEY`.

### 6. OCR pipeline (`src/lib/ocr/`)
- `preprocess.ts`:
  - `createImageBitmap(file, {imageOrientation:'from-image'})` fixes EXIF rotation.
  - For AI: long edge at most 2000px, JPEG at 0.85.
  - For Tesseract: long edge 1200–2400px, grayscale + percentile contrast stretch, PNG.
  - Keep the crop-to-guide math in `CameraScanner`.
- `engine.ts`: `recognizePage(file, {signal, onProgress}) → {text, source:'ai'|'offline'}`. Use the proxy when online and reachable, otherwise local Tesseract.
  - Throws a typed `OcrError` with codes `no_text`, `offline_pack_missing`, `aborted` or `failed`.
  - A stale scan never resolves after it's aborted.
- `tesseract.ts`:
  - Self-hosted assets under `public/tesseract/` (gitignored), produced by `scripts/copy-tesseract.mjs` on `postinstall`/`prebuild`. The script writes `manifest.json` listing the files.
  - One warm worker as a singleton, terminated after 60s idle. Aborting terminates the worker.
  - Monotonic progress: loading maps to 0–15% and recognition to 15–100%.
  - `warmOfflinePack()` and `offlinePackStatus()` use the `tesseract-assets` cache.
- `postprocess.ts`: join hyphenated line breaks, collapse single newlines inside paragraphs, normalize quotes to straight `'` and `"`, drop junk lines, collapse spaces.

### 7. Offline storage, dictionary and queue
- **`stores/db.ts` (Dexie `handog-aral`):**
  - `wordCache`: key `word_lang`, holding a `ResolvedExplanation` plus `updatedAt`/`lastUsedAt`, with an LRU cap of 2000.
  - `dictionary`: curated entries with both languages and a `reviewed` flag, plus `meta.dictionaryVersion`.
  - `lookupQueue`.
  - `words`: saved vocabulary.
  - The Dexie instance is created lazily and is SSR-safe.
- **Stores:** settings and progress live in zustand persisted to idb-keyval, SSR-safe with a hydration flag. Progress keeps `quizStars` and derived `wordStars` separate, so stars are never overwritten. The streak uses local dates, not UTC.
- **Migration:** `migrate.ts` is idempotent. It imports `localStorage['handog-aral-state']` (words deduped case-insensitively, generic placeholders skipped), then removes the key.
- **Lookup pipeline** (`src/lib/dictionary/explain.ts`), with an AbortSignal so a newer tap aborts an older lookup:
  1. `wordCache`, unless the entry is `offline`.
  2. The curated dictionary.
  3. `explainRemote`.
  4. dictionaryapi.dev + the local translation templates.
  5. An honest offline placeholder, which is enqueued.
- **Queue** (`src/lib/queue/processor.ts`): runs at start, on `online` and on visibility change. Concurrency 2, backoff, max 5 attempts. It upgrades both the cache and saved words, then calls `onUpgraded(count)`, which the UI shows as a sonner toast.
- **Bigger dictionary:**
  - `scripts/build-dictionary.ts` generates `src/data/dictionary.v1.json` from about 2,000 child-frequency words (Dolch + Fry + every book word) via Gemini + zod, with `reviewed:false`.
  - It's lazy-loaded into Dexie. Curated entries (the 281 existing ones) win over generated ones.
- **PWA:**
  - Precache the app shell, fonts and the dictionary chunk.
  - CacheFirst for `/tesseract/*` (cache `tesseract-assets`, about 10MB, not precached).
  - Auto-warm the offline pack on unmetered connections, plus a Settings "Download offline pack" control.
  - Prompt-to-update toast. Real and maskable icons via `@vite-pwa/assets-generator`.
  - `OfflineBanner` driven by `useOnlineStatus`.
  - The service worker is disabled in the Capacitor build.

### 8. TTS (`src/lib/tts/`)
- `speak(text, {rate, lang, onSentence})`, `stop()`, `isSpeaking()` and `isTtsAvailable()`.
- Native: `@capacitor-community/text-to-speech`.
- Web: `speechSynthesis` with an explicit voice (en-PH, then en-US/en-GB), speaking sentence by sentence so the reader can highlight the current sentence.
- The user's `ttsSpeed` applies everywhere.

### 9. Bug fixes folded in
- Quiz stars separated from word stars. The quiz results effect is already moved (Phase 1).
- Case-insensitive dedupe of saved words. "New text" clears the current book.
- Fisher–Yates shuffle with a reshuffle on retry. Distractors must have distinct translations.
- Cancel in-flight lookups when a new word is tapped. Stop a camera stream that resolves after the scanner unmounts.
- Garbled glyphs in the Vocabulary and Settings screens.
- `AndroidManifest.xml`: add the `CAMERA` permission and `<uses-feature camera required=false>`.

## Execution plan (Sonnet subagents)

Work happens on branch `v3-overhaul`. Phases run in order. Tasks within a phase run as parallel Sonnet subagents in isolated worktrees, following the lessons above: symlinked node_modules and a reset to `v3-overhaul`. Claude reviews, merges and re-runs the gate after every phase.

- **Phase 0:** design direction. ✅
- **Phase 1:** Next.js foundation. ✅
- **Phase 2:** parallel core (3 agents):
  - A. Data layer: `src/stores/**`, `src/lib/dictionary/**`, `src/lib/queue/**`, `src/hooks/useOnlineStatus.ts`, `src/lib/tokenize.ts`, plus tests. Don't touch the UI; build alongside `AppContext`.
  - B. Proxy: `src/app/api/**`, `src/server/**`, the `src/lib/api.ts` implementation, `.env.example`, plus tests. Verify the Capacitor export still builds.
  - C. OCR + TTS: `src/lib/ocr/**`, `src/lib/tts/**`, `scripts/copy-tesseract.mjs` (+ `postinstall`/`prebuild` scripts, `.gitignore`), `AndroidManifest.xml`, plus tests.
  - Contract: no agent edits `src/shared/schemas.ts` or the signatures in `src/lib/api.ts`, and no agent installs packages.
- **Phase 3:** design system + shell (1 agent):
  - tokens (light/dark) and shadcn components
  - AppShell (bottom nav / rail), Mascot and BookCover SVGs, `motion.ts`, OfflineBanner
  - PWA: manifest, icons, prompt-to-update, `/tesseract` runtime cache
  - a loading frame
  - remove the old keyframes and the global button transform
- **Phase 4:** screens (3 agents):
  - D. Reader/Scan + CameraScanner + WordPanel, with the drawer on mobile and the docked panel on desktop. Wire in `recognizePage`, `explain` and `tts`, and add `/read/[bookId]`.
  - E. Home + Books + Welcome.
  - F. Vocabulary + Quiz + Settings, including the offline pack control and removing the API-key card.
  - Then delete `AppContext`, `geminiService.ts`, `ocrService.ts`, `useTextToSpeech.ts` and `@google/generative-ai`.
- **Phase 5:** dictionary build. Can overlap with Phase 4, and needs `GEMINI_API_KEY` locally.
- **Phase 6:** audit + polish:
  - `/impeccable` audit and critique at 375 / 768 / 1024 / 1440, in light and dark, with dyslexia mode and the large font. Run `impeccable detect`, then the finish reviewer, then the documenter (writes DESIGN.md + `.impeccable/design.json`).
  - ui-ux-pro-max checklist.
  - `/qa` via `/browse`.
  - Update CLAUDE.md and the README.

## Verification
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `BUILD_TARGET=capacitor npx next build` must pass at every gate.
- Unit tests cover:
  - OCR postprocess
  - tokenizer (apostrophes, accented letters, hyphens)
  - explain pipeline order and the offline → queue → upgrade path
  - migration
  - stars and streak
  - LRU eviction
  - quiz shuffle and distractors
  - proxy validation, 413, 429, CORS
  - the api client's retry and offline behavior
- Playwright at 375×812 and 1280×800:
  - welcome → name → book → tap a word → save → quiz → results
  - offline: after warming the offline pack, a Tesseract scan works and a word lookup returns a curated or offline entry; back online, the queued word is upgraded with a toast
  - reduced motion: no tweens run
- Local proxy: `next dev` with `.env.local`. Curl the endpoints, including a burst that triggers 429 and a disallowed `Origin`.
- Lighthouse PWA and accessibility ≥ 95 on the preview deploy.
- Android: `npm run build:android`, then on a device: camera permission, capture, native TTS, back button.

## Risks / open items
- **Translation quality:** the generated Hiligaynon/Tagalog entries need a native-speaker review; they keep the `reviewed:false` flag until then.
- **Accounts needed:** a Vercel project with `GEMINI_API_KEY` and an Upstash Redis database (free tier). Phase 2B can be built with mocks before these exist.
- **Asset weight:** the offline pack is about 10MB, so it's opt-in or auto-warmed rather than precached.
- **Disk space:** the dev machine ran out of space during Phase 2. Keep at least 5 GB free, and avoid duplicate `node_modules`.
