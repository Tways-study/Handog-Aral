# Handog Aral 🦉📖

**"Ang Imo Gabay sa Pagbasa"** — AI-powered literacy companion for Filipino children in rural areas and children with dyslexia.

## Features

- **Tap any word** — Get instant child-friendly explanations in Hiligaynon or Filipino
- **Camera OCR** — Scan physical books using your phone camera (Tesseract.js)
- **Text-to-Speech** — Hear words pronounced aloud
- **Dyslexia support** — OpenDyslexic font, adjustable text size, color overlays
- **Offline-capable** — PWA with cached word definitions
- **AI-powered** — Google Gemini API for smart, context-aware definitions

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

Or enter it in the app's Settings screen.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add `VITE_GEMINI_API_KEY` as an environment variable in Vercel project settings
4. Click Deploy — done!

## Tech Stack

- React 18 + Vite
- Tailwind CSS v4
- Google Gemini API (gemini-2.0-flash)
- Tesseract.js (OCR)
- Web Speech API (TTS)
- PWA (vite-plugin-pwa)

## For Parents & Teachers

The app is designed for Filipino children aged 6–12. All child-facing text is in **Hiligaynon** or **Filipino/Tagalog**. Settings labels are in English for parent/teacher use.

---

Built with ❤️ for Filipino children
