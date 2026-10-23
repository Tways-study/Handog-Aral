# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(A PWA, mobile-first, with a real desktop layout. It is also wrapped for Android with Capacitor; the wrapper does not make the design language native.)

## Users

- **Primary:** Filipino children aged 6–12 learning to read English, including children with dyslexia, mostly in rural areas.
- **Usage scenes, all of which are real:**
  - a child reading alone on a family phone
  - a child co-reading with a parent or older sibling
  - a teacher-led session on a shared device in a classroom or reading center
- **Secondary:** parents and teachers. They set the app up (name, language, accessibility settings), supervise, and use desktop more often than children do.

## Product Purpose

A child points the camera at a printed page (or opens a built-in story). The app turns the page into text, and the child taps any word they don't know. In Filipino mode they read English and get the meaning in Filipino; in English mode they read Filipino and get the meaning in English, with pronunciation and an example. The child can save words to a personal vocabulary and practice them in a short quiz.

Success means a child reads a real page they couldn't read before, without an adult translating every word.

## Positioning

The app explains words in context and in the child's mother tongue, from their own physical books, not from a fixed in-app catalogue. Explanations are tuned for a 6–12-year-old and use local context. It keeps working with poor or no connectivity.

## Operating Context

- Physical books, school readers and worksheets, scanned with the phone camera, often in uneven or bright light.
- Low-end Android phones (about 2–3GB RAM, 720p screens) on prepaid, spotty mobile data. Offline use is normal, not an edge case.
- Shared devices are passed between children; settings are managed by an adult.
- Word explanations come from Gemini through a server proxy when online, and from a curated offline dictionary or templates when offline. Offline lookups are upgraded later.

## Capabilities and Constraints

- Camera or gallery capture of a page; OCR by Gemini Vision online and Tesseract offline.
- A tap-a-word explanation showing the word, phonetic spelling, English meaning, home-language explanation, an example and a difficulty level, plus text-to-speech.
- Saved vocabulary, a quiz unlocked after enough saved words, stars, a daily streak, and a small built-in story library (6 English and 4 Filipino stories).
- Accessibility settings: font size, a dyslexia font mode, TTS speed, reading color overlays.
- Child-facing text is in Filipino or English (the two reading directions: English→Filipino and Filipino→English); settings labels are in English for adults. Hiligaynon was removed because the translations were not accurate enough.
- No accounts or login for children. Progress stays on the device.
- Machine-generated Filipino and the bundled Filipino stories and word list are not yet reviewed by a native speaker.

## Brand Commitments

- Name: **Handog Aral**.
- Tagline: **"Ang Iyong Gabay sa Pagbasa"** ("Your guide to reading", Filipino).
- An **owl** is the companion mascot. It will be redrawn; the species is binding, not the current emoji form.
- The current teal color is **not** binding.

## Evidence on Hand

- 6 built-in English stories in `src/data/books.js`.
- About 281 curated word entries in `src/data/fallbackWords.js`.
- Translations for UI copy in `src/data/translations.js`.
- There are no testimonials, usage numbers, school partners or press. Do not invent them.

## Product Principles

1. **The page is the hero.** The child's own book text matters more than app chrome; explanations serve reading and never interrupt it longer than needed.
2. **Offline is a first-class state.** Every core flow must degrade gracefully and say honestly what quality the child is getting.
3. **Readable before delightful.** Legibility, touch size and dyslexia support outrank decoration; delight is earned in small moments.
4. **Home language first.** Explanations lead with the child's mother tongue; English is the thing being learned.
5. **Built for shared, low-end devices.** The app stays light, fast and robust on a 2GB phone passed between children.

## Accessibility & Inclusion

- Dyslexia support is a core requirement, not an option: spacing, an alternate font, overlays, and TTS everywhere.
- Large touch targets for small hands; no reliance on hover.
- Pinch-zoom must stay available. Respect reduced-motion settings.
- Content must be understandable by early readers: short words, icons paired with text labels.
