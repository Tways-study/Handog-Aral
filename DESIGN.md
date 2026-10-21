---
name: Handog Aral
description: A child's own pad paper, ruled in blue with a red margin, where every printed word can be tapped and understood.
colors:
  paper: "#FBF7EE"
  paper-2: "#F2EBDC"
  card-surface: "#FFFDF7"
  ink: "#1D2340"
  ink-2: "#4A5070"
  rule: "#C3D3EE"
  margin: "#E0756C"
  line: "#E3DACA"
  line-strong: "#7F849C"
  sunrise: "#F08A24"
  sunrise-ink: "#1D2340"
  marker: "#FFD49A"
  indigo: "#2B3A8C"
  kangkong: "#2E7D55"
  mango: "#F2B233"
  mango-ink: "#1D2340"
  gumamela: "#C8323A"
  on-jacket: "#FFFFFF"
  stamp-easy: "#2E7D55"
  stamp-medium: "#2B3A8C"
  stamp-hard: "#C8323A"
  warning-text: "#8A5A00"
  focus-ring: "#2B3A8C"
  night-paper: "#1A1D2A"
  night-paper-2: "#222636"
  night-ink: "#EFE7D6"
  night-ink-2: "#B9B3A6"
  night-rule: "#2F3A57"
  night-margin: "#8F3E3A"
  night-sunrise: "#F39A3D"
  night-marker: "#6B4A1E"
typography:
  display:
    fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  reading:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: "2.25rem"
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  button: "14px"
  cta: "22px"
spacing:
  pitch: "36px"
  pitch-desktop: "40px"
  margin-offset: "44px"
  margin-offset-desktop: "66px"
  nav-height: "58px"
  rail-width: "96px"
  content-max: "1024px"
components:
  button-primary:
    backgroundColor: "{colors.sunrise}"
    textColor: "{colors.sunrise-ink}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 20px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 20px"
  button-disabled:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.button}"
  input:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  jacket-indigo:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.on-jacket}"
    rounded: "{rounded.xl}"
  jacket-mango:
    backgroundColor: "{colors.mango}"
    textColor: "{colors.mango-ink}"
    rounded: "{rounded.xl}"
  scan-fab:
    backgroundColor: "{colors.sunrise}"
    textColor: "{colors.sunrise-ink}"
    rounded: "{rounded.cta}"
    size: "64px"
  word-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
---

# Design System: Handog Aral

## Overview

**Creative North Star: "The Pad Paper Storybook"**

The child's page becomes their own pad paper. Reading text sits on quiet blue rules with one red margin line, warm off-white paper, deep navy ink, and every word can be tapped. Saturated book-jacket cloth (indigo, mango, kangkong green, gumamela red) acts as the notebook cover and owns whole regions. Rewards are rubber-stamp stars and teacher check marks, never confetti. The owl mascot is the only character.

The system is calm and low-density: one thing burns brightest at a time. Sunrise orange marks the single primary action and the tapped word. It refuses the category default of candy-gradient cards, emoji chrome and stacked stat tiles. Dark mode is a night pad under one bulb, same structure with lowered paper.

**Key Characteristics:**
- Real baseline grid: the rule pitch equals the reading line-height at every font-size setting.
- Warm paper neutrals, navy ink, flat cloth-colored jackets, one orange accent.
- State by shape first (circle/square/triangle difficulty stamps), color only reinforces.
- Offline-to-AI upgrades restyle in place with reserved space, no layout shift.
- Motion is transform and opacity only, 150-300ms, once per flow, off under reduced motion.
- Large targets (44px minimum, 48-60px for actions) for ages 6-12.

## Colors

Warm paper and navy ink carry nearly everything; cloth jacket colors take whole regions; orange appears once.

### Primary
- **Sunrise Orange** (`sunrise`): the single primary action (Scan a page, Save, check), the active-tab pip, and the tapped-word underline. Text on it is ink navy (`sunrise-ink`), never white.

### Secondary
- **Jacket Indigo** (`indigo`), **Mango** (`mango`), **Kangkong Green** (`kangkong`), **Gumamela Red** (`gumamela`): notebook-cover fields owning a region (book cover, Home cover). Each pairs with its text color (white on indigo, kangkong, gumamela; ink on mango). Kangkong also marks saved words and "easy" / success; indigo marks "medium" and the focus ring; gumamela marks "hard" and destructive.

### Neutral
- **Pad Paper** (`paper`): page background. **Second Paper** (`paper-2`): quiet fills, answer wells, disabled buttons. **Card Cream** (`card-surface`): cards, popovers, inputs.
- **Navy Ink** (`ink`) body text; **Soft Ink** (`ink-2`) secondary text and labels.
- **Blue Rule** (`rule`) ruled lines; **Margin Red** (`margin`) the single margin line; **Fine Line** (`line`) borders; **Strong Line** (`line-strong`) input borders and scrollbar thumbs.
- **Marker Peach** (`marker`): the tapped-word highlight and text selection.
- Night variants (`night-*`) are the `.dark` overrides; sunrise lifts to `night-sunrise`, stamps lighten to #6CC596, #8E9BEA, #F08A8F.

### Named Rules
**The One Burner Rule.** Orange goes on the single primary action per screen and the tapped word. The raised Scan button in the nav is a deliberate, user-approved second occurrence because Scan is the product's primary action everywhere; do not extend that exception to other controls.

**The Mixed-Tint Rule.** Reading overlays (yellow, blue, pink) are mixed into the paper at 12-16% and never laid over text, so ink contrast holds. Contrast pairs are asserted in `src/styles/contrast.test.ts`; change a token only with that test green.

## Typography

**Display Font:** Baloo 2 (with ui-rounded, system-ui)
**Body Font:** Atkinson Hyperlegible (with system-ui)
**Option:** OpenDyslexic replaces both when `body.dyslexia-font` is on, with extra word (0.3em) and letter (0.05em) spacing.

**Character:** Round, friendly Baloo for names and titles over a highly legible, unambiguous-letterform body. Fonts are self-hosted so they work offline.

### Hierarchy
- **Display** (800, 2.25rem / 2.75rem at lg, line-height 1): the tapped word in the word panel.
- **Headline** (700, 1.25rem+, 1.25): card and section titles, cover title (scales with container width, min 1rem).
- **Title** (800, 1.25rem, ~1.2): large-button label (xl size) and screen titles up to 2xl-4xl.
- **Body** (400, 1rem, 1.5): UI copy; 0.9375rem for descriptions; 1.0625rem for example sentences.
- **Reading** (400, 1.25rem / 1.375rem at lg, line-height equals the pitch 2.25rem / 2.5rem): scanned and story text on the pad.
- **Label** (700, 0.8125rem to 0.75rem, normal case): field labels, nav labels, source notes.

### Named Rules
**The Baseline Rule.** Reading text uses `.pad-text`, whose line-height is the rule pitch. Sizes are rem-based and the html font-size class (14/16/20px) scales pitch and text together, so words always sit on the rules.

**The Sentence Case Rule.** Labels are sentence case, bold, small. No uppercase tracked labels.

## Layout

Mobile-first single column with a fixed bottom nav (5 slots, 58px tall, scaling 52/58/70px with font size, plus safe-area inset); content pads bottom for it (`pb-nav`). At 1024px (lg) the bottom nav gives way to a 96px left rail, content is capped near 64rem, the reader becomes two panes, and the word explanation docks at 400px on the right instead of a bottom drawer. The pad has a 36px pitch (40px at lg), a margin line at 44px (66px at lg), and text gutters just beyond it. Spacing is Tailwind's 4px scale; cards use 20px padding, action rows 10-12px gaps. Known gaps: desktop Home ends early with blank lower space.

## Elevation & Depth

Mostly flat paper with 1.5px borders; depth is soft, navy-tinted, and sparse. Surfaces rest on borders, jackets and sheets lift with shadow.

### Shadow Vocabulary
- **Small** (`0 1px 2px rgb(29 35 64 / 0.08), 0 4px 10px -6px rgb(29 35 64 / 0.18)`): cards.
- **Medium** (`0 1px 2px rgb(29 35 64 / 0.08), 0 8px 24px -12px rgb(29 35 64 / 0.25)`): raised panels.
- **Large** (`0 2px 4px rgb(29 35 64 / 0.08), 0 14px 32px -14px rgb(29 35 64 / 0.4)`): dialogs and jackets.
- **Sheet** (`0 -12px 40px -16px rgb(29 35 64 / 0.45)`): the bottom drawer.
- **CTA** (`0 1px 2px rgb(29 35 64 / 0.2), 0 10px 20px -10px rgb(29 35 64 / 0.55)`): sunrise buttons and the nav Scan button.
- **Scrim** (`rgb(29 35 64 / 0.28)`; 0.5 black in dark): behind overlays.

### Named Rules
**The Soft Navy Shadow Rule.** Shadows are blurred, offset-down, and navy-tinted (black in dark). No hard offset shadows.

## Shapes

Friendly, rounded, never pill-everything: 8/12/16/24px scale (sm, md, lg, xl), buttons and inputs at 14px, the raised Scan button 22px, word marks 6px. Borders are 1.5px in `line` (cards) or `line-strong` (inputs). Difficulty is geometry: concentric circle (easy), rounded square (medium), triangle (hard), 22px, 2.2 stroke, always with its label. Rewards are authored SVG rubber stamps (StampStar, StampCheck) that land with a scale and rotate settle. Book covers are authored SVG jackets with the owl perched on the top edge.

## Components

### Buttons
- **Shape:** 14px radius; lg 16px; xl (Scan a page) 18px, Baloo 20px extrabold.
- **Primary:** sunrise fill, ink text, CTA shadow, 48px tall (44 sm, 56 lg, 60 xl). **Ink:** navy fill, paper text. **Secondary/outline:** paper fill, 1.5px line border. **Destructive:** gumamela.
- **Focus / Press:** 3px ring-colored outline offset 2px; press scales to 0.98 (motion-safe). Disabled is a neutral paper button with a line border, never sunrise.

### Cards / Containers
- 16px radius, card cream, 1.5px line border, small shadow, 20px padding. Ruled areas use the pad background instead of a card.

### Inputs / Fields
- 48px, 14px radius, card-cream fill, 1.5px strong border; focus is the 3px indigo outline; invalid switches the border to gumamela.

### Navigation
- Bottom bar below lg: icon (22px) over a 12px bold label, active ink with a 3px sunrise pip. The center Scan is a 64px raised sunrise tile (22px radius, CTA shadow). At lg: 96px left rail with the owl on top, Scan as the same tile, Settings pinned to the bottom.

### Word Panel (signature)
- Mobile: vaul drawer about 60dvh. Desktop: docked 400px panel. Shows the word (display), phonetic, difficulty stamp, a star stamp, a Listen button, a paper-2 well for the home-language meaning, English meaning, source note, and a sticky Listen/Save row. Offline entries reserve the space the AI upgrade will fill so nothing shifts.

### Tapped Word
- A peach marker sweeps in behind the word (scaleX from the left) with a sunrise underline; saved words keep a 2px kangkong underline, independent of the tap state.

### Mascot and Covers
- Owl in idle, cheer, and think moods, flat SVG. BookCover draws a jacket in one of four cloth colors with title in Baloo.

## Do's and Don'ts

### Do:
- **Do** read tokens only from the CSS custom properties / Tailwind utilities (`bg-paper`, `text-ink`, `bg-sunrise`, `shadow-cta`).
- **Do** lay reading text on `.pad` / `.pad-text` so line-height equals the rule pitch.
- **Do** pair every difficulty color with its shape and label.
- **Do** use ink navy text on sunrise and mango, white on indigo, kangkong, and gumamela.
- **Do** gate every GSAP helper (enterPanel, markWord, stampIn, fadeRoute) on reduced motion and animate only transform and opacity.
- **Do** reserve space for content that upgrades in place.

### Don't:
- **Don't** add a second sunrise action on a screen beyond the nav Scan button.
- **Don't** use candy gradients, stacked stat tiles, or emoji as chrome.
- **Don't** convey state by color alone.
- **Don't** put a color overlay over text; mix it into the paper.
- **Don't** use hard offset shadows or glow.
