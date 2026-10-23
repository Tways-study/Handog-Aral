---
name: Handog Aral
description: An open, quiet warm-white page under a pale lilac confetti band, where text and lists sit straight on the ground and every printed word can be tapped and understood.
colors:
  paper: "#FFFDF9"
  paper-2: "#F3EEFD"
  card-surface: "#FFFFFF"
  ink: "#1D2340"
  ink-2: "#4A5070"
  rule: "#DDD3F3"
  line: "#DDD3F3"
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
  success: "#2A7450"
  warning-text: "#8A5A00"
  destructive-text: "#BE2D35"
  focus-ring: "#2B3A8C"
  band: "#E7DFFF"
  band-ink: "#1D2340"
  band-ink-2: "#3B4468"
  night-band: "#3A2E7A"
  night-band-ink: "#FFFFFF"
  night-band-ink-2: "#E4DDFB"
  confetti-violet: "#8A6FF0"
  confetti-gold: "#F5C53F"
  confetti-pink: "#E9577A"
  confetti-mint: "#4CC3A8"
  keyline: "#FFFFFF"
  night-paper: "#1B1633"
  night-paper-2: "#261F45"
  night-card-surface: "#2A2350"
  night-ink: "#EFE7D6"
  night-ink-2: "#B9B3A6"
  night-line: "#3B3260"
  night-line-strong: "#8A84AE"
  night-keyline: "#3B3260"
  night-sunrise: "#F39A3D"
  night-marker: "#6B4A1E"
  label-paper: "#FFFDF7"
  label-ink: "#1D2340"
  label-ink-2: "#4A5070"
  label-rule: "#C3D3EE"
  owl-body: "#A86B34"
  owl-wing: "#8A5A2B"
  owl-belly: "#F2D3A0"
  owl-chevron: "#C99A5E"
  owl-outline: "#3A2412"
  owl-outline-soft: "#7A4526"
  owl-cheek: "#F29A8A"
  owl-gold: "#F5C542"
  owl-cap: "#34409B"
  owl-bow: "#3F4FB8"
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
  helper:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  example:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  word-title-small:
    fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.15
  display-desktop:
    fontFamily: "Baloo 2, ui-rounded, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
  nav-label-large-text:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.1
  root-small:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  button: "14px"
  cta: "22px"
  mark: "6px"
  label-card: "9px"
  xxl: "28px"
  band: "32px"
spacing:
  pitch: "36px"
  pitch-desktop: "40px"
  pad-gutter: "20px"
  pad-gutter-desktop: "28px"
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
  notebook-label:
    backgroundColor: "{colors.label-paper}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.label-card}"
  word-mark-tapped:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
  word-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
---

# Design System: Handog Aral

## Overview

**Creative North Star: "The Sticker Sheet" (open-page edition)**

The page is a quiet, near-white warm sheet (#FFFDF9) and it is open: reading text, word lists and settings sit directly on the ground with no card around them. Lists are divided by dotted rules, section headings carry a wavy sunrise underline, and small things (owl tag, chips, quiz options, scan tiles, the recent-words nudge) are `paper-2` tinted shapes with no border or shadow. A real box appears only for a physical object: the notebook book cover and its label, and the memory-game cards. The white keyline sticker (`--sticker`) is kept only for special sticker moments. The one place the system gets playful is the page band: a full-width pale lilac block behind every screen title, curved at the bottom, carrying a quiet confetti tile (stars, squiggles, triangles, rounded squares, dots) that fades out under the title so no shape ever sits behind text. Deep navy ink, a sunrise orange primary, and saturated book-jacket cloth (indigo, mango, kangkong green, gumamela red) that owns whole regions. Rewards are rubber-stamp stars, teacher check marks and die-cut stickers in a sticker book. The owl (purple #8A6FF0 app-icon tile) is the single character, and it speaks through a small speech tag.

The system is calm and low-density in its controls: one thing burns brightest at a time, and nothing loops. The band confetti is a static 360px tile (about 0.7 opacity light, 0.2 dark), not animated and masked away from the title. It is cute through one drawn character family (flat SVG owl, toon-shaded 3D owl, covers, stickers, empty-state art, card back, scan doodles) sharing the dark brown outline, warm owl browns and rounded forms. It refuses candy-gradient cards, emoji chrome and stat tiles. Dark mode is a deep-violet night sheet with the same structure: dark violet ground (#1B1633), #2A2350 sticker cards, a dark keyline, and a deeper violet band (#3A2E7A) with white ink and faint confetti. Browser toolbar color (themeColor, ThemeSync, manifest) follows the band: #E7DFFF light, #3A2E7A dark. The app icon tile stays purple #8A6FF0.

**Key Characteristics:**
- One vertical rhythm: `--pitch` sets reading line-height and row height at every font-size setting, even though the sheet is no longer ruled.
- Quiet warm-white ground, a lilac confetti page band behind each title, an open ground with dotted rows and wavy headings, boxes only for physical objects, navy ink, flat cloth-colored jackets, one orange accent.
- One character family: owl (idle, cheer, think, wave, sleep; outfits none, glasses, cap, bow) across flat art, 3D, covers, stickers and empty states.
- State by shape first (circle/square/triangle difficulty stamps), color only reinforces.
- Offline-to-AI upgrades restyle in place with reserved space, no layout shift.
- Motion is transform and opacity, 140-300ms, once per flow, off under reduced motion; no looping decoration.
- Large targets (44px minimum, 48-60px for actions) for ages 6-12.

## Colors

Warm-white ground and navy ink carry nearly everything; the lilac band is the one tinted block; cloth jacket colors take whole regions; orange appears once per screen (plus the nav Scan).

### Primary
- **Sunrise Orange** (`sunrise`): the single in-page primary action, the active-tab pip, the tapped-word underline and the owl's beak. Text on it is ink navy (`sunrise-ink`), never white. Home's primary is "Padayon sa pagbasa" / "Umpisahan ta" / "Basaha liwat"; scan there is a paper secondary.

### Secondary
- **Jacket Indigo** (`indigo`), **Mango** (`mango`), **Kangkong Green** (`kangkong`), **Gumamela Red** (`gumamela`): notebook-cover fields owning a region (book cover, Home cover). Each pairs with its text color (white on indigo, kangkong, gumamela; ink on mango). Kangkong marks saved words and "easy" / success; indigo marks "medium" and the focus ring; gumamela marks "hard" and destructive.

### Tertiary: owl feathers
- **Owl Brown family** (`owl-body`, `owl-wing`, `owl-belly`, `owl-chevron`, `owl-cheek`, `owl-gold`, `owl-cap`, `owl-bow`) and **Owl Outline** (`owl-outline`, a dark warm brown; the 3D owl in `owlModel.ts` uses the softer `owl-outline-soft` #7A4526 because the reference has no hard outline): the character's palette, used by the flat Mascot, the 3D owl (`owlModel.ts`), stickers and art. Not UI chrome. Beak is `sunrise`, eye ink is `ink`. Outfits cap and bow use the indigo-blue `owl-cap` / `owl-bow`.

### Neutral
- **Warm Sheet** (`paper`, #FFFDF9; dark #1B1633): the quiet page ground. **Pale Lilac** (`paper-2`, #F3EEFD; dark #261F45): the tint for pills and chips (owl tag, Home chips, quiz options, scan tiles, recent-words nudge), answer wells, disabled buttons. **Sticker White** (`card-surface`, #FFFFFF; dark #2A2350): popovers, inputs, the quiz letter badge, memory cards and special sticker moments; no longer the ground of lists or reading text.
- **Page Band** (`band`, #E7DFFF; dark #3A2E7A) with `band-ink` (#1D2340; dark white) and `band-ink-2` (#3B4468; dark #E4DDFB): the full-width block behind every screen title (PageHeader), also drawn by the HomeSkeleton and ListSkeleton. Ink-on-band contrast is checked in `contrast.test.ts`.
- **Confetti** (`confetti-violet`, `confetti-gold`, `confetti-pink`, `confetti-mint`, plus sunrise orange; dark tile swaps to white, #F5A1B5 and #80E0C8): the colors of the band tile only (`--band-confetti`); decoration, not UI chrome.
- **Navy Ink** (`ink`) body text; **Soft Ink** (`ink-2`) secondary text and labels.
- **Lilac Line** (`line`, `rule`, #DDD3F3; dark #3B3260): card and control borders. **Strong Line** (`line-strong`, #7F849C; dark #8A84AE): input borders and scrollbar thumbs.
- **Success** (`success`, #2A7450) and **Destructive text** (`destructive-text`, #BE2D35) are darkened so text holds 4.5:1 on the ground; dark mode lifts them to #6CC596 and #F08A8F.
- **Marker Peach** (`marker`): the tapped-word highlight and text selection.
- **Notebook Label** (`label-paper`, `label-ink`, `label-ink-2`, `label-rule`): the label card stuck on a book cover. It is paper on cloth, so it stays light in dark mode and is deliberately not overridden under `.dark`.
- Night variants (`night-*`) are the `.dark` overrides (ink stays warm cream #EFE7D6); sunrise lifts to `night-sunrise`, stamps lighten to #6CC596, #8E9BEA, #F08A8F, indigo lifts to #3A4AA8.

### Named Rules
**The One Burner Rule.** Orange goes on the single in-page primary action and the tapped word. The raised Scan button in the nav is a deliberate, user-approved second occurrence because Scan is the product's primary action everywhere; do not extend that exception to other controls.

**The Mixed-Tint Rule.** Reading overlays (yellow, blue, pink) are mixed into the open ground (the `.pad` colour overlay, `--pad-bg`) at 12-16% and never laid over text, so ink contrast holds. Contrast pairs are asserted in `src/styles/contrast.test.ts`; change a token only with that test green.

**The Label-on-Cloth Rule.** The notebook label stuck on a book cover is paper on cloth and stays light in dark mode; only the surrounding sheet darkens. (Sticker cards themselves do darken to #2A2350.)

**The Plain-Sheet Rule.** Reading text sits directly on the near-white ground (`.pad` is transparent: no box, no shadow, `--pad-gutter` 0). Only the mixed colour overlay may tint it; never a card, border or shadow.

**The Open-Page Rule.** No cards for lists, reading text or settings. Lists are rows divided by `.row-line` (2px dotted `--line`, none after the last); settings groups are an open section (title plus dotted-divided rows); headings use `.section-title`. Tinted `paper-2` pills (no border, no shadow) are for chips, the owl tag, quiz options, scan tiles and nudges. Real box shapes are reserved for physical objects: the notebook cover, its label, the memory-game cards. Locked stickers keep a dashed empty-slot outline; earned sticker tiles are borderless.

**The Band-Only Confetti Rule.** Confetti lives only in the page band (`.page-band`), never on the page ground or a card, and never behind text: the tile is masked to be empty under the title (left ~62% of the band on phones, ~46% at lg). Static, no animation.

## Typography

**Display Font:** Baloo 2 (with ui-rounded, system-ui)
**Body Font:** Atkinson Hyperlegible (with system-ui)
**Option:** OpenDyslexic replaces both when `body.dyslexia-font` is on, with extra word (0.3em) and letter (0.05em) spacing; headings stop tightening letter-spacing.

**Character:** Round, friendly Baloo for names and titles over a highly legible, unambiguous-letterform body. Fonts are self-hosted so they work offline. Headings use `text-wrap: balance`, short copy `text-wrap: pretty`,.

### Hierarchy
- **Display** (800, 2.25rem, line-height 1; `display-desktop` 2.75rem at lg): the tapped word in the word panel. The mobile size is `min(2.25rem, 9.5vw)` so long words fit.
- **Headline** (700, 1.25rem+, 1.25): card and section titles, cover title (scales with container width, min 1rem).
- **Title** (800, 1.25rem, ~1.2): large-button label (xl size) and screen titles up to 2xl-4xl.
- **Word title small** (700, 1.1875rem, 1.15): a vocabulary word inside a list row or Home's recent-words line, in Baloo.
- **Body** (400, 1rem, 1.5): UI copy.
- **Helper** (400, 0.9375rem, ~1.45): descriptions, hints, helper and form-label text; the most used step after body.
- **Example** (400, 1.0625rem, 1.5): example sentences in the word panel.
- **Reading** (400, 1.25rem / 1.375rem at lg, line-height equals the pitch 2.25rem / 2.5rem): scanned and story text on the white sticker sheet.
- **Label** (700, 0.8125rem to 0.75rem, normal case): field labels, nav labels, source notes. The bottom-nav label drops to 0.5625rem only at Large text, clamped to two lines.
- **Root sizes:** the html class sets 14px (Small), 16px (Medium), 20px (Large); everything else is rem and scales with it.

### Named Rules
**The Pitch Rule.** Reading text uses `.pad-text`, whose line-height is `--pitch` (2.25rem, 2.5rem at lg). Sizes are rem-based and the html font-size class scales pitch and text together, so line and row heights stay one rhythm. There is no ruling to align to.

**The Sentence Case Rule.** Labels are sentence case, bold, small. No uppercase tracked labels, no kickers or eyebrows above titles.

**The Named Step Rule.** Off-scale sizes exist only as the named steps above (helper, example, word title small, display-desktop, nav label at Large text). Add a new literal size only by adding a step here.

## Layout

Mobile-first single column with a fixed bottom nav (5 slots, 58px tall, scaling 52/58/70px with font size, plus safe-area inset) holding the raised Scan; content pads bottom for it (`pb-nav`). At 1024px (lg) the bottom nav gives way to a 96px left rail with Scan as the same raised tile, content is capped near 64rem, the reader becomes two panes, and the word explanation docks at 400px on the right instead of a bottom drawer (vaul drawer ~60dvh on phones). The sticker sheet (`.pad`) has a 36px pitch (40px at lg) for line and row height, and no text gutter (`--pad-gutter` 0); there is no ruling, margin line or box. Spacing is Tailwind's 4px scale; action rows 10-12px gaps.

Screen structure:
- **Home:** hero with the owl stage and speech tag; the cover sits beside the progress bar with compact art on phones, and is hidden at Large text and in dyslexia mode. One primary action.
- **Books:** two columns of jackets.
- **Welcome:** a two-step flow ending in the "first superpower" step (tap a dotted-underlined word).
- **Play ("Pares"):** untimed memory-match board of real cards, 2 columns at the narrowest, 3 columns from 340px, 4 from sm, 2 again at Large text on phones; a two-column layout at lg with the owl beside the board.
- **Quiz:** options are `paper-2` pills with a white letter badge; a sticky feedback bar sits above the bottom nav; results show stars filling from the left and "Liwat naton ini" review cards.
- **Sticker book:** earned stickers first (borderless tiles), the locked ones nearest to earning next in a dashed empty-slot outline.
- Lists use a letter tile (first letter on cloth color) instead of emoji.

Page band: `.page-band` wraps the screen title via `PageHeader`; it bleeds to the viewport width (100vw), has a `2rem` bottom radius (`0 0 2rem 2rem`) and two layers (`::before` fill, `::after` masked confetti).

Known gaps: desktop Home, Scan and Reader leave empty ground below short content; the plain warm ground shows there, accepted rather than filled. Throttled-mobile Lighthouse performance is about 85 on Welcome, 78 on `/` and 83 in the reader; the 3D owl and new features cost a few points.

## Elevation & Depth

The page is flat: lists, reading text, settings and pills carry no shadow. Depth is soft, navy-tinted and sparse, kept for physical objects (jackets, memory cards), overlays and pressable actions, which physically sink.

### Shadow Vocabulary
- **Sticker** (`0 0 0 3px #FFFFFF, 0 5px 0 3px rgb(91 75 181 / 0.22)`; dark `0 0 0 3px #3B3260, 0 5px 0 3px rgb(0 0 0 / 0.35)`): the `--sticker` token, a white keyline ring with a flat lilac drop below it. Retained for special sticker moments only; not used on lists or reading text.
- **Small** (`0 1px 2px rgb(29 35 64 / 0.08), 0 4px 10px -6px rgb(29 35 64 / 0.18)`): cards.
- **Medium** (`0 1px 2px rgb(29 35 64 / 0.08), 0 8px 24px -12px rgb(29 35 64 / 0.25)`): raised panels.
- **Large** (`0 2px 4px rgb(29 35 64 / 0.08), 0 14px 32px -14px rgb(29 35 64 / 0.4)`): dialogs and jackets.
- **Sheet** (`0 -12px 40px -16px rgb(29 35 64 / 0.45)`): the bottom drawer.
- **CTA** (`0 1px 2px rgb(29 35 64 / 0.2), 0 10px 20px -10px rgb(29 35 64 / 0.55)`): sunrise buttons and the nav Scan button.
- **Pressed** (`0 1px 1px rgb(29 35 64 / 0.2), 0 2px 4px -2px rgb(29 35 64 / 0.35)`): the shadow a pressed button or tile sinks into.
- **Tile** (`0 1px 0 rgb(29 35 64 / 0.06), 0 2px 3px rgb(29 35 64 / 0.08), 0 8px 16px -10px rgb(29 35 64 / 0.28)`): pressable physical objects such as memory cards; scan tiles and quiz options are now flat tinted pills; in dark it adds a faint light top edge.
- **Scrim** (`rgb(29 35 64 / 0.28)`; 0.5 black in dark): behind overlays.

### Named Rules
**The Soft Navy Shadow Rule.** Shadows are blurred, offset-down, and navy-tinted (black in dark). The one exception is the sticker drop, a lilac, unblurred offset that is the sticker device itself; no other hard offset shadows or glow.

**The Sticker Rule.** The `--sticker` keyline and drop belong to special sticker moments (celebrations, die-cut stickers). The keyline is part of the sticker, not a second border. Do not put it on lists or reading text; see the Open-Page Rule.

**The Sink Rule.** The `pressable` utility gives every tappable thing a pointer cursor, `touch-action: manipulation`, a 140ms transition and a 2px downward press (motion-safe); pressed shadow tokens accompany it. Hover colors apply only on hover-capable pointers.

## Shapes

Friendly, rounded, never pill-everything: 8/12/16/24/28px scale (sm, md, lg, xl, xxl), plus the page band bottom corners at 32px (`2rem`, band only), buttons and inputs at 14px, the raised Scan button 22px. Two small named radii: word marks 6px (`mark`) and the notebook label card on a cover 9px (`label-card`). Borders are 1.5px in `line` (controls) or `line-strong` (inputs); list dividers are 2px dotted `line`, and pills have no border. Difficulty is geometry: concentric circle (easy), rounded square (medium), triangle (hard), 22px, 2.2 stroke, always with its label. Rewards are authored SVG: rubber-stamp StampStar and StampCheck that land with an ink-bleed scale and rotate settle, and 14 die-cut stickers with a white cut border. A locked sticker is its own art washed to grey with a small lock chip, so the collection shows what is left to find. Book covers are authored jackets with the owl perched on the top edge; the card back, empty-state scenes and scan doodles share the owl's outline weight and browns. The 3D owl is toon-shaded with a thin dark back-face outline to match the flat art.

## Components

### Buttons
- **Shape:** 14px radius; lg 16px; xl (Scan a page) 18px, Baloo 20px extrabold.
- **Primary:** sunrise fill, ink text, CTA shadow, 48px tall (44 sm, 56 lg, 60 xl). **Ink:** navy fill, paper text. **Secondary/outline:** paper fill, 1.5px line border. **Destructive:** gumamela.
- **Focus / Press:** 3px ring-colored outline offset 2px; `pressable` 2px press. Disabled is a neutral pale-lilac button with a line border, never sunrise.
- Accessible names come from the visible text (WCAG 2.5.3), enforced by the axe gate; icon-only controls do not hide a different label.

### Cards / Containers
- Cards are for physical objects only: the notebook cover and its label, and memory-game cards. Lists, reading text and settings are not cards. The reading sheet is the `.pad` class (legacy name): transparent, no shadow. Skeletons are static lilac shapes with one fade-in, never a shimmer loop.

### Dotted Rows (list pattern)
- `.row-line`: a list row with a 2px dotted `--line` bottom border, none on the last child. Used for word lists, settings rows and other lists; rows stay at least 44px and use `pressable` when tappable.

### Wavy Section Title
- `.section-title`: inline-block heading in Baloo with a repeating 24x6 wavy sunrise-orange underline (`background-repeat: repeat-x`, bottom left). Replaces boxed headers; decoration only, so state never depends on it.

### Tinted Pills
- `paper-2` fill, no border, no shadow: owl `OwlTag` and `SpeechTag`, Home chips, quiz options (with a white letter badge), scan tiles, the recent-words quiz nudge.

### Inputs / Fields
- 48px, 14px radius, white fill, 1.5px strong border; focus is the 3px indigo outline; invalid switches the border to gumamela. Focused fields stay at least 16px to avoid iOS zoom.

### Navigation
- Bottom bar below lg: icon (22px) over a 12px bold label, active ink with a 3px sunrise pip. The center Scan is a 64px raised sunrise tile (22px radius, CTA shadow). At lg: 96px left rail with the owl on top, Scan as the same tile, Settings pinned to the bottom.

### Word Panel (signature)
- Mobile: vaul drawer about 60dvh. Desktop: docked 400px panel. Shows the word (display), phonetic, difficulty stamp, a star stamp, a Listen button, a deeper-lilac (`paper-2`) well for the home-language meaning, English meaning, source note, and a sticky Listen/Save row. Offline entries reserve the space the AI upgrade will fill so nothing shifts.

### Tapped Word
- A peach marker sweeps in behind the word (scaleX from the left) with a sunrise underline; saved words keep a 2px kangkong underline, independent of the tap state. In the Welcome superpower step every tappable word wears a dotted underline and the first unknown one nudges once.

### Owl (character)
- `Owl` renders the flat SVG `Mascot` first; a procedural three.js 3D owl loads lazily only when allowed. Moods: idle, cheer, think, wave, sleep. Outfits: none, glasses, cap, bow (saved in settings, worn from the sticker-book wardrobe). Only one 3D owl per page (`priority="hero"` wins the slot); others stay flat. Rendering is demand-driven (no idle frame loop) with fallbacks to the flat owl on any failure.
- **3D load policy:** window load, then idle, then a calm main thread; never on slow connections (2g/3g), save-data, very low-end devices (about 1 GB RAM or 2 cores or fewer), software WebGL, or reduced motion.
- **Motion:** the only ambient movement is an occasional blink and glance and a capped sleep bob (3D only). Reduced motion means no 3D, no confetti, instant states.
- **Speech tag** (`SpeechTag`): a small `paper-2` tinted pill with a tail, no border or shadow; it is the owl's voice for hints and capability moments.

### Rewards and Delight
- **Stickers:** 14 die-cut stickers (first word, 5/10/25 words, hard word, first scan, first listen, first quiz, perfect quiz, first match, 3 and 7 day streak, first book, all books). Sticker book shows earned first, nearest-to-earn locked next.
- **Stamps:** StampStar and StampCheck; the first save gets a big stamp.
- **Celebration dialog:** queued (`queue.ts`); capability moments (first tap, save, scan, quiz via `useMoments`) mark first-time actions.
- **Pares:** untimed memory match with the card back art.
- **Sound and haptics:** short synthesized sounds, off by default (shared classroom devices); haptics where supported.

### Mascot and Covers
- BookCover draws a jacket in one of four cloth colors with title in Baloo and a notebook label card (`label-*` tokens) that stays light in dark mode.

## Do's and Don'ts

### Do:
- **Do** read tokens only from the CSS custom properties / Tailwind utilities (`bg-paper`, `text-ink`, `bg-sunrise`, `shadow-cta`, `shadow-tile`).
- **Do** put a page band behind every screen title (PageHeader, skeletons included).
- **Do** lay reading text on `.pad` / `.pad-text` (directly on the ground, no box) so line-height equals the pitch.
- **Do** build lists and settings as open sections: `.row-line` dotted rows under a `.section-title`.
- **Do** use a box only for a physical object (cover, label, memory card).
- **Do** pair every difficulty color with its shape (circle, square, triangle) and label.
- **Do** use ink navy text on sunrise and mango, white on indigo, kangkong, and gumamela.
- **Do** gate every GSAP helper (enterPanel, markWord, stampIn, fadeRoute) and every celebration on reduced motion and animate only transform and opacity.
- **Do** reserve space for content that upgrades in place.
- **Do** use `pressable` on every tappable thing, and letter tiles instead of emoji in lists.
- **Do** load optional heavy pieces (3D owl, rewards, celebration) through `softDynamic` so a failure falls back silently.
- **Do** show locked stickers as washed art with a lock chip.
- **Do** keep owl-voice and sticker copy short; it awaits native-speaker review in Filipino.

### Don't:
- **Don't** add a second sunrise action on a screen beyond the nav Scan button.
- **Don't** put a loop on decoration; the only ambient motion is the owl's occasional blink and glance and the capped 3D sleep bob.
- **Don't** use candy gradients, stacked stat tiles, or emoji as chrome.
- **Don't** convey state by color alone.
- **Don't** put a color overlay over text; mix it into the ground with `--pad-bg`.
- **Don't** wrap lists, reading text or settings groups in cards, or give them borders or shadows; use tinted pills or dotted rows.
- **Don't** use the white `--sticker` keyline card on lists or reading text.
- **Don't** put confetti anywhere but the page band, behind any text, or animate it.
- **Don't** use hard offset shadows or glow.
- **Don't** load the 3D owl on slow, save-data, very low-end or software-WebGL devices, or under reduced motion.
- **Don't** name a control differently from its visible text.
- **Don't** put a timer on the Pares game.
