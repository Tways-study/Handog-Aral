# Handog Aral 🦉📖

**"Ang Imo Gabay sa Pagbasa"** — AI-powered literacy companion for Filipino children in rural areas and children with dyslexia.

---

## Features

### Core Reading Tools
- **Tap any word** — Get instant child-friendly explanations in Hiligaynon or Filipino
- **Camera OCR** — Scan physical books using your phone camera (Tesseract.js)
- **Text-to-Speech** — Hear words pronounced aloud at adjustable speeds
- **Fallback dictionary** — 80+ pre-loaded word definitions work fully offline

### Accessibility
- **Dyslexia support** — OpenDyslexic font toggle with increased word/letter spacing
- **Adjustable font size** — Small, Medium, Large
- **Color overlays** — Yellow, Blue, or Pink reading tint to reduce visual stress

### Gamification & Progress
- **Star system** — Earn ⭐ stars as you learn more words (1 star per 3 words, max 5)
- **Daily streak tracker** — Tracks consecutive days of app use with a 🔥 badge
- **Vocabulary collection** — All tapped & saved words stored persistently
- **Vocabulary Quiz** — Multiple-choice quiz built from your saved words with high-score tracking

### Library
- **Books screen** — Browse sample stories with per-book progress tracking (% read)
- **Book levels** — Visual progress badges: Bag-o / Ginapadayon / Malapit na! / Natapos!

### AI & Personalization
- **Google Gemini API** — Context-aware definitions using the sentence around the tapped word
- **Language toggle** — Switch explanations between Hiligaynon and Filipino/Tagalog
- **Child name** — Personalized greetings and mascot messages
- **Offline-capable** — PWA with service worker caching

---

## What's New (v2.1)

- **Vocabulary Quiz** (`QuizScreen`) — Test knowledge of saved words with 4-choice questions, per-question feedback, score recap, and high-score badge. Unlocks after saving 4+ words.
- **Daily streak** — Opens the app daily to maintain a streak shown on the home screen
- **Redesigned navigation** — 5-tab bottom nav with a floating center Scan FAB button
- **Redesigned Home screen** — Stats row (words · streak · stars), time-aware greeting, and adaptive encouragement cards
- **Redesigned Books screen** — Gradient header with completion stats; BookCard redesigned with color accent bar and level badge
- **Vocabulary filtering & search** — Filter words by difficulty; search by word or translation
- **Improved WordPopup** — Rounded emoji cover tile, inline phonetic + difficulty badge, backdrop blur, and example sentence support
- **Star progress compact mode** — Stars display inline in the header stats row

---

## Setup

### 1. Get a free Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key

### 2. Configure the API Key

Create a `.env` file in the project root:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

Or enter it in the app's **Settings** screen at runtime.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build for Production

```bash
npm run build
```

Built files are output to `dist/`. The PWA service worker pre-caches all assets for offline use.

---

## Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add `VITE_GEMINI_API_KEY` as an environment variable in Vercel project settings
4. Click Deploy

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 |
| AI Definitions | Google Gemini API (`gemini-2.0-flash`) |
| OCR | Tesseract.js v7 |
| Text-to-Speech | Web Speech API |
| PWA | vite-plugin-pwa |
| Icons | lucide-react |
| State | React Context + localStorage |

---

## File Structure

```
handog-aral/
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
│
└── src/
    ├── main.jsx              # App entry point
    ├── App.jsx               # Root router (screen state machine)
    ├── index.css             # Global styles, Tailwind theme, animations
    │
    ├── assets/               # Static assets (images, fonts)
    │
    ├── context/
    │   └── AppContext.jsx    # Global state (words, progress, settings, streak, quiz score)
    │
    ├── components/
    │   ├── BottomNav.jsx     # 5-tab bottom navigation with floating Scan FAB
    │   ├── BookCard.jsx      # Book list item with progress bar and level badge
    │   ├── CameraScanner.jsx # Full-screen camera viewfinder with capture/flip/gallery
    │   ├── Mascot.jsx        # Animated owl emoji mascot
    │   ├── StarProgress.jsx  # Star row (normal + compact mode)
    │   └── WordPopup.jsx     # Bottom-sheet word definition card with TTS + save
    │
    ├── screens/
    │   ├── SplashScreen.jsx  # Animated app intro (2.8s)
    │   ├── HomeScreen.jsx    # Dashboard: greeting, streak, stats, quick actions
    │   ├── ScanScreen.jsx    # Camera / text-paste reader with word tap
    │   ├── BooksScreen.jsx   # Book library with completion stats
    │   ├── VocabularyScreen.jsx  # Saved words with search + difficulty filter
    │   ├── QuizScreen.jsx    # Multiple-choice vocabulary quiz with scoring
    │   └── SettingsScreen.jsx    # Name, language, font, accessibility, API key
    │
    ├── data/
    │   ├── books.js          # Sample book entries (title, emoji, color, text)
    │   ├── fallbackWords.js  # 80+ offline word definitions
    │   └── sightWords.js     # High-frequency words excluded from complex-word detection
    │
    ├── hooks/
    │   ├── useLocalStorage.js   # Generic localStorage read/write hook
    │   └── useTextToSpeech.js   # Web Speech API speak() wrapper
    │
    └── services/
        ├── geminiService.js  # Gemini API prompt, response parsing, fallback logic
        └── ocrService.js     # Tesseract.js image-to-text with progress callback
```

---

## For Parents & Teachers

The app is designed for Filipino children aged **6–12**. All child-facing text is in **Hiligaynon** or **Filipino/Tagalog**. Settings labels are in English for parent/teacher use.

The **Settings screen** lets you:
- Set the child's name for personalized greetings
- Toggle between Hiligaynon and Filipino explanations
- Adjust font size (Small / Medium / Large)
- Enable the OpenDyslexic font
- Set TTS playback speed (Hinay / Normal / Dasig)
- Apply a reading color overlay
- Enter or update the Gemini API key
- Reset all progress

---

Built with ❤️ for Filipino children

