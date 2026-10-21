# Handog Aral: design audit, 2026-10-21

Scope: report-only run of the design-review workflow (phases 1-6) on the production build of branch `v3-overhaul`, served privately on :3231. Child "Ana" (Hiligaynon, fox 67%, 7 saved words, stars 3, streak 3). 375x812 and 1280x800, light and dark, plus 320x640, text size Large, dyslexia font and Tagalog on Home and Reader. Calibrated against DESIGN.md and PRODUCT.md. No source was changed.

Evidence lives in `.impeccable/review/audit/` (paths below are relative to the repo root). Dark mode was captured for every screen and I eyeballed Home, Words and Quiz in detail; the other dark captures are on disk but only skimmed. The API proxy has no Gemini key here, so word lookups come from the curated dictionary and an offline banner appears on some screens. That is a valid offline-first state, but AI-quality copy was not seen. The quiz results screenshot is from a 1/5 run.

## Headline

| | Grade |
|---|---|
| Design score | **B-** |
| AI slop score | **B** (not generic, but icon-in-circle tiles and a soft-card rhythm leak through) |
| Fun, cute and warm-welcome score (the lens for this audit) | **C+** |

One-line verdict: a disciplined, legible, very well-built reading tool that is **calm to the point of quiet**. The structure, type and contrast are better than most kids' apps. The delight, the owl and the "you can read this now" feeling are mostly missing. The app asks "where do you want to go?" when it should be saying "look what you can do."

## 1. First impression (narration)

I land on /welcome at 375x812. A big indigo book jacket fills the top. An owl is perched on its corner, looking straight at me. "Handog Aral" is huge in rounded Baloo, white on indigo. Under it, "Ang Imo Gabay sa Pagbasa" and a one-line hello, then a cream name field. My eye goes to: (1) the owl, (2) the white "Handog Aral" title, (3) the orange "Magsugod kita" at the bottom. That is the intended order, and it is a good first screen: the product is unmistakable, there is one clear action, and the jacket metaphor is charming.

What I notice next: the jacket looks like a form, not a gift. The owl is a flat clip-art sticker that never moves, blinks or says my name. The language choice is two coloured books, which is clever, and the check or dashed-circle badges are the right shape-before-colour idea. But when I tap "Magsugod kita" the next thing I see (`welcome-after-t400-m-light.png`, `home-firstrun-m-light.png`) is Home, with "0 ka bituon", 0% progress, and a disabled-feeling "Padayon sa pagbasa" on a book I have never opened. No hello, no first gift, no "I will help you read your own books." The welcome is pretty but there is no hand-off into delight.

Page area test (Home): greeting plus chips (named), cover card (named: "my current book"), "Bag-o nga pulong" list (named), "Iba pang libro" shelf (named). All four read in two seconds.

One word: **tidy**. The brief says it should be **cuddly**.

## 2. Inferred design system vs DESIGN.md

Extracted from the rendered DOM on Home, Reader and Words:

- Fonts: Baloo 2 and Atkinson Hyperlegible only (two families). Matches DESIGN.md. OpenDyslexic loads in dyslexia mode. No Inter/system-ui as primary.
- Headings: Home h1 24px, h2 18px and 20px (two different h2 sizes on one page, a small drift from "Headline 1.25rem"). h1-h2 order is clean.
- Body text 15px on Home paragraphs (DESIGN.md says 16px body, 15px for descriptions; acceptable but under the skill's 16px rule).
- Colour: paper, navy ink, indigo, mango, kangkong, gumamela and one orange. Warm neutrals consistently. Dark mode lifts the orange and keeps the structure, as documented.
- Spacing: Tailwind 4px scale, 36px pitch rules. Good.
- Radii: 14/16/24 scale, not uniform bubbly.
- Touch audit: only "Laktawan sa sulod" (skip link, 32x24, focus-only, fine) and two "Tanan" text links (42x44) fall under 44px on Home. The Reader word buttons are the real exception: 36px tall and as narrow as 18px ("It", "a"). This is a deliberate baseline-grid trade but it is a young-child targeting problem (see F-09).
- Performance: load 23ms, no layout shift seen across navigations.

Deviations from DESIGN.md:
1. **One Burner Rule is bent on several screens.** Orange appears on the nav Scan tile (approved) plus the in-page primary on every screen, so two oranges are always on screen. Scan screen has a third (big orange "Buksa ang camera" card). The user approved the nav exception, but "Sunod" in the quiz, "Pabalik sa Balay" on not-found and "Probahi liwat" on offline all sit directly above the nav tile and fight it.
2. **"The owl is the only character" and "owl in idle, cheer and think moods"**: cheer is not seen on any capability moment I triggered (save, correct answer). Think appears in quiz results. See section 7.
3. **"Rewards are rubber-stamp stars ... that land with a scale and rotate settle"**: the stamp exists and is correct in spirit, but it is about 50px and tucked beside the Listen button (`word-saved-t300-m-light.png`). The reward is real but whispered.
4. DESIGN.md "Known gaps: desktop Home ends early". Confirmed, and the same is true of Scan and Reader desktop (below).

## 3. Per-category grades

| Category | Grade | Why |
|---|---|---|
| Visual hierarchy | C | Home buries "continue reading" as a small underlined link under an orange Scan button; Scan and Quiz screens have competing oranges |
| Typography | B | Great pairing and legibility. Dyslexia header clips; 15px body; two h2 sizes |
| Colour and contrast | B+ | Coherent, warm, contrast tested. Orange count is the only blemish |
| Spacing and layout | B- | Strong pad grid. Mobile cover labels blank; desktop Home/Scan/Reader leave half the screen empty; wrong-answer feedback falls under nav |
| Interaction states | B- | Focus ring and nav active states good. Word targets 36px; quiz feedback cramped |
| Responsive | B+ | 320 holds. Large text wraps stat chips and squeezes the cover card |
| Motion | B | Motion is restrained as designed, but the moments where motion matters most are the quietest |
| Content and microcopy | B | Hiligaynon-first, short, honest source note. "Padayon" on an unread book; settings are English and adult-flat |
| AI slop | B+ | Not generic. Icon-in-beige-circle tiles on Scan |
| Performance feel | A | Instant |

Weighted Design Score = 2.9 / 4.0, **B-**.

## 4. Goodwill reservoir, first-run flow (starts at 70)

```
Goodwill: 75  (healthy, but flat: it is never filled up, only protected)
  Welcome            70 -> 80  (+10 one obvious primary action, owl looking at me)
  Home (first run)   80 -> 70  (-5 "Padayon sa pagbasa" on a book at 0%, -5 two Scan buttons compete)
  Scan start         70 -> 75  (+5 camera is obviously the first choice)
  Read + tap word    75 -> 85  (+5 instant explanation, +5 honest source note "Halin sa diksyunaryo sang app")
  Save word          85 -> 85  (stamp lands but is small; no reaction from the owl)
  Quiz, wrong answer 85 -> 75  (-10 feedback cramped; under the nav with the banner or long options)
  Quiz results       75 -> 80  (+5 owl thinking, kind copy "Sige pa, kaya mo ini")
  Offline banner     80 -> 75  (-5 honest but it pushes the whole screen down)
  FINAL 75/100: healthy.
```

Biggest drains: the cramped quiz wrong-answer state, the first-run Home ambiguity. Biggest fills: the tap-to-explain speed and the honest provenance line. Nothing in the flow adds a big positive jump. A child never gets a "wow."

## 5. Per-screen findings

Impact scale: high, medium, polish. Each finding has evidence and a concrete fix. Fixes respect Pad Paper Storybook, the one-burner exception and reduced motion.

### Welcome

- **F-01 (medium) The welcome ends in a form submit, not a greeting.** Evidence: `welcome-after-t400-m-light.png`, `home-firstrun-m-light.png`. After "Magsugod kita" the child is dropped on Home with zeros. Fix: a 2 to 3 second owl moment on the first arrival only: the owl hops onto the jacket, says "Kamusta, Ana! Basahon ta ang imo libro" and Home reveals with a staggered rise (owl, cover, list). One shot, GSAP timeline, skipped under reduced motion, never repeated.
- **F-02 (polish) Language picker uses book jackets (good) but each label is a small white pill with no flavour.** Evidence: `welcome-m-light.png`. Fix: let the chosen jacket tilt 2 degrees and let the owl glance toward it. Keep the check badge.
- **F-03 (polish) Desktop welcome is a 540px column on a wide empty canvas, CTA clipped at the fold.** Evidence: `welcome-d-light.png` (the orange button sits at y=757 of 800). Fix: reduce the vertical padding above the jacket or anchor the CTA.

### Home

- **F-04 (high) Hierarchy: the thing a returning child wants (keep reading the fox) is the weakest element.** Evidence: `home-m-light-fold.png`, `home-d-light.png`. A 56px orange "I-scan ang pahina" dominates; "Padayon sa pagbasa" is a small underlined text link under it, and the nav shows a second orange Scan right below. The book cover card also says "Libro: The Brave Little Fox, Natipon: 6 ka pulong" like a library record. Fix: make "Padayon sa pagbasa" the primary full-width action on the cover when progress is between 1 and 99 percent (ink or paper button on the indigo jacket, with a bookmark Lucide icon), and demote "I-scan ang pahina" to the nav tile only (which is already the approved exception). That also fixes the one-burner bleed and gives Home one job.
- **F-05 (high) Home has no "capability" voice.** The greeting is "Maayong hapon, Ana! Isa pa ka pahina?" and the chips read "3 ka bituon", "3 ka adlaw". It tells me counts, not what I can now do. Fix: replace the first chip row with one sentence about growth ("Mabasa mo na ang 6 ka bag-ong pulong!"), and let the owl carry the latest saved word on a speech tag that taps to Listen. See section 7.
- **F-06 (medium) First-run Home says "Padayon sa pagbasa" (continue) on a book at 0%.** Evidence: `home-firstrun-m-light.png`. Fix: label switches to "Umpisahan ta" until progress is above 0.
- **F-07 (medium) Large text.** Evidence: `home-m-large.png`. The two stat chips wrap to two lines inside fixed-width pills, the cover info card squeezes "Natipon: 6 ka pulong" into three lines, and the scan button label wraps and looks off-centre. Fix: stack the chips full width at Large, let the cover info card go single-column.
- **F-08 (polish) 320px.** Evidence: `home-320-light.png`. The "Bag-o nga pulong" header is overlapped by the raised nav tile when scrolled; fine in scroll, but the list header should keep 16px clearance above the tile. The scan label also wraps to two lines.
- **Desktop Home (medium).** Evidence: `home-d-light.png`. Known gap from DESIGN.md. The cover and word list sit at 520px tall and the shelf lists books as three tiny covers with caption rows. Fix: let the cover card grow to fill the left column and put the owl big at the left of the word list with a speech tag, so the empty lower right becomes the mascot's stage.

### Books

- **F-09 (medium) Mobile covers have a blank label card.** Evidence: `books-m-light.png`, `home-m-light.png` (covers on Home). The title sits below the cover on mobile but the white label on the cover itself shows only a faint rule, so the cover looks unfinished. On desktop the same label shows the title (`books-d-light.png`). Fix: show the title in the label at every width (let it scale), and drop the caption below, or keep the caption and fill the label with a small progress doodle.
- **(polish) Single column of 310px-tall covers on mobile** shows 1.2 books per screen. Two columns (as on Home's shelf) would show five.
- The "Padayon" and "Bag-o" status row with Lucide book and sparkle icons is a good small touch (`books-d-light.png`).

### Reader and word sheet (the signature screen)

- **F-10 (high) Word buttons are 36px tall and as narrow as 18px.** Evidence: measured on `read-m-light.png`. A 6-year-old tapping "a" or "It" will miss. Fix: keep the visual size but extend the hit area with 4px of vertical padding via a pseudo-element (line pitch is 36px, so overlap is the problem; use `touch-action` plus a nearest-word hit test on the pad instead).
- **F-11 (high) The reader is the product's heart and it is mute.** Evidence: `read-m-light.png`, `read-d-light.png`. On mobile there is no owl; half the page is blank ruled paper under seven lines of text; on desktop the right pane has an owl and "Pindota ang pulong" but it is static and the lower 60% of the paper is empty. Nothing tells the child "this page has 3 words you already saved". Fix: show a small owl peeking over the bottom nav on mobile when no sheet is open, speaking a one-line prompt that fades after 4 seconds. On desktop make the right-pane owl point a wing at the text and blink once per page load.
- **F-12 (high) The first tapped word is not celebrated.** Evidence: `word-sheet-m-light.png`. The sheet is well-built (word, phonetic, Dali stamp, Hiligaynon well, English, honest source line, Listen/Save). But the child has just gained a capability (understanding an English word on their own) and the app gives them a plain bottom sheet. Fix: one-time first-tap moment: the marker sweeps in, the sheet rises, the owl pops onto the sheet corner with "Nabasa mo na!" for 1.8s and the Hiligaynon well gets a one-time highlight pulse. Persist a `firstTapDone` flag. Do not repeat.
- **F-13 (high) The first saved word is under-celebrated.** Evidence: `word-saved-t300-m-light.png`, `word-saved-m-light.png`. Save toggles to a pale "Natipigan na" button and a ~50px star stamp appears beside the Listen button. A stamp is on-brand, but it should be the hero of the moment: scale it to about 96px, stamp it onto the paper over the saved word (the word gets its kangkong underline at the same time), then fly a small copy to the "Pulong" nav tab, which gets a 1.2x pop. Add the owl in cheer mood on the first ever save. Under reduced motion: stamp appears settled, no flight.
- **F-14 (medium) The sheet hides the second half of the story but not the first.** Dimmed text behind the sheet is readable, which is good, but the whole page is dimmed at the same level as an error dialog. Use a lighter scrim for the sheet (0.28 is documented; it looks heavier in the capture) so the child keeps the sense of "I am still on my page."
- **F-15 (medium) Dyslexia mode.** Evidence: `read-m-dyslexia.png`. Reading is workable but the header title is clipped to "The Brave Litt..." and the subtitle to "Pindota ang pulong ...", and letter and word spacing make lines break after two words so the text reads as a column rather than a sentence. Fix: let the header title wrap to two lines in dyslexia mode, and cap word spacing at 0.2em on narrow screens.
- **(polish) 320px reader holds** (`read-320-light.png`); the skip-to-content link works.
- **(polish)** Tagalog reader (`read-m-tagalog.png`) is consistent.

### Scan start

- **F-16 (medium) Icons in beige circles and three-tile rhythm.** Evidence: `scan-m-light.png`, `scan-d-light.png`. The big orange "Buksa ang camera" card is a clear hero, but "Pilia sa gallery" and "I-type o i-paste" are two identical white tiles with a Lucide icon in a beige circle each. That is the SaaS starter look the skill flags. Also the nav Scan tile has an extra ring on this screen (current-page ring) and sits two inches from a huge orange card, so two oranges merge. Fix: make the camera tile ink-navy with a sunrise lens graphic and the owl holding a magnifier; the nav tile stays the single orange. Replace the circles with hand-drawn pad-paper doodles (a tiny gallery photo with a folded corner, a pencil).
- **F-17 (high, capability moment) The first scan is the signature "I can read this!" moment and it has no ceremony visible at the start screen.** Fix: owl with a camera strap on the start screen; on successful OCR, the scanned text should "develop" onto the ruled paper line by line (stagger 60ms per line, transform and opacity only, capped at 12 lines) and the owl cheers, then shows "Pindota ang pulong nga indi mo kilala." That single sequence is the best place in the whole app to spend animation budget. I could not run a real camera scan here, so this is based on the start screen and the product description.
- **(medium) Desktop Scan** (`scan-d-light.png`) puts three tiles in a ruled box that ends at y=460 of 800, then a blank screen.

### Words

- **F-18 (medium) Empty state is warm and good** (`words-empty-m-light.png`: owl, Hiligaynon explanation, two actions) but the two actions are an orange pill and a paper pill that are nearly identical in weight to the nav Scan tile. Fix: "Mag-scan" becomes the paper button, since the tab bar already has Scan.
- **F-19 (medium) The populated list (`words-m-dark.png`) is a clean ruled list but flat.** Difficulty is communicated by shape (good) but there is no emoji or picture per word, no recency feel, and the owl is gone. A word the child saved is a small trophy and it is shown as a table row. Fix: add a small authored line drawing per word where possible (or a letter-tile fallback), let the newest word wiggle once on arrival, and add the owl in the header with "6 ka pulong na ang natipon mo!" in a speech tag.
- The segmented filter ("Tanan, Dali, Medyo budlay, Mabudlay") is neat and uses the stamp shapes. Good.

### Quiz

- **F-20 (medium) Wrong-answer feedback is cramped, and falls under the nav when anything adds height.** Evidence: `quiz-wrong-fold-m-light.png` (best case: "Indi pa tama" and "Sunod" fit, with the orange Sunod 10px above the raised Scan tile, so two oranges touch). With the offline banner showing (about 70px) and a two-line option such as "Niyebe - puti nga ice halin sa langit!" as the answer, the feedback text and "Sunod" were pushed behind the nav and the child must scroll; I saw this live on a 375x812 run but that frame was not kept on disk. The correct case is fine (`quiz-correct-m-light.png`). Fix: a sticky feedback bar above the nav with the feedback text plus "Sunod", and a compact question card while the banner is present.
- **F-21 (high, capability moment) The first quiz and the first correct answer are undramatic.** The correct state is a green option, a ~48px stamp and "Tama!" (`quiz-correct-m-light.png`). Fix: make the owl react (cheer on right, a gentle head tilt "think" on wrong, never a buzzer), let the stamp land with a 1.15 overshoot, and on the first ever quiz show "Pasulit na! 5 ka pulong, kaya mo ini" with the owl at the question card. Add a streak of 3 correct = owl does a one-time small hop.
- **F-22 (medium) Results.** Evidence: `quiz-results-m-light.png`. Owl thinking, score number, kind copy, star stamp row. But the one filled star sits in slot 4 of 5 for a 1/5 score, which reads as a bug: fill from the left. The answer review is a ruled list of red X marks and words, a pad-paper idea but red crosses stacked on a 6-year-old who scored low is harsh. Fix: lead with what they got right, show missed words as "Liwat naton ini" cards with a Listen button.
- **(polish) Desktop quiz** (`quiz-d-light.png`, `quiz-d-dark.png`): good width, no owl at all, wide empty right.
- **(medium) Option buttons look like a custom control** (rounded pill with a letter chip) rather than a shadcn ToggleGroup or RadioGroup item. They work, but they are not in the shared component set and have no radiogroup semantics visible from outside. Worth confirming in code.

### Settings

- **F-23 (medium) Settings is correct and adult: English labels, flat white cards, no owl.** Evidence: `settings-m-light.png`, `settings-d-light.png`. PRODUCT.md says this is an adults' screen, so English is by design. Still, it is the only screen with no personality and the Text size row is partially hidden under the nav tile on first view. Fix: give the cards a small owl-with-glasses in the header ("Para sa nanay, tatay, ug maestra"), keep English, and preview each setting with the real pad text so the dyslexia toggle shows the font live (it already has a sample line; good).
- Switch, toggle group and inputs are shadcn-style and consistent.

### Offline and not found

- **F-24 (medium) Both are the warmest screens in the app and still have the same two-button layout as every other empty state.** Evidence: `offline-m-light.png`, `notfound-m-light.png`. The owl is large, the copy is kind and in Hiligaynon. The offline owl looks the same as the not-found owl. Fix: offline owl wears a tiny cloud or holds a lantern, not-found owl looks around (head turned). Keep a single orange action and demote the second.
- The nav is shown on both, which is right (the app still works offline).

### Dark mode

- **Dark is strong.** Evidence: `home-m-dark.png`, `words-m-dark.png`, `quiz-d-dark.png`. The night pad keeps structure, orange lifts correctly, text is warm off-white. No pure-white text, no inverted-colour bug seen.
- **(polish)** The raised nav tile in dark and the quiz "Sunod" in dark (`quiz-d-dark.png`, disabled state) both read as very low contrast against the night paper; the disabled button is nearly invisible.

## 6. Cross-page consistency

- Component reuse is excellent (cards, stamps, nav, owl, jackets). Tone is consistent: calm, kind, short.
- Mascot presence is the inconsistency: strong on Welcome, Home (peeking), Scan (peeking), empty states, offline and not-found; absent on Reader mobile, Quiz questions, Words list and Settings.
- The primary orange action appears twice on almost every mobile screen (in-page plus nav tile).
- Icons are Lucide throughout, with Lucide at 22px in the nav; difficulty uses authored SVG stamps and the owl and covers are authored SVG. That is a defensible split, but the owl, the star stamp and the Lucide strokes have three different line weights.
- Emoji: the saved word rows carry an `emoji` field but no emoji chrome is shown, which matches the DESIGN.md rule.

## 7. Fun and cute opportunities (screen by screen)

Rules held: Pad Paper Storybook, one orange exception, no looping decoration, transform and opacity only, reduced motion respected, readable before delightful, low-end phones, offline-first.

### The owl, redrawn to feel 3D

The current owl is flat, front-facing, with six pose-less tummy lines. It is cute but is a sticker. To feel dimensional without three.js on a 2GB phone: redraw it in SVG with (1) a two-stop body gradient and a soft rim light on the left, (2) a separate head, body, wing-left, wing-right, eyes, brow, beak and feet layer so GSAP can move them independently, (3) a baked soft contact shadow ellipse under it, (4) a cream belly with a subtle inner shadow, (5) eyes with a highlight that can shift 2px toward the touch point. Poses to draw: idle, cheer (wings up, beak open), think (head tilt, wing to chin), wave (hello), peek (head only over an edge), sleepy (offline), curious (head turned, not-found), magnifier (scan). If the in-progress three.js `Owl` component lands, keep the SVG as the default and the fallback and only load the 3D one lazily on Home and Welcome, with a static first frame so there is no layout shift.

### Where the owl should appear and react

- Welcome: waves on arrival, glances at the picked language jacket, blinks once when the name field gets its first letter. Reacts to the name by saying it ("Kamusta, Ana!").
- Home: peeks over the book jacket (already), blinks every 6 to 10 seconds only while the page is idle (a single timer, not a loop animation), and holds a speech tag with the newest saved word that taps to Listen.
- Reader mobile: peeks over the nav bar when no word is selected, hides when the sheet opens.
- Word sheet: owl sits on the sheet's top-right corner in think mood while the word is loading, cheer on the first tap and the first save.
- Scan: magnifier pose. On OCR success, cheer.
- Words: header owl with a speech tag counting words.
- Quiz: owl tilts for wrong answers (never a cross), hops for a 3-in-a-row, and sits beside the results score (already in think mode, make it cheer on 4 or 5 of 5).
- Settings: owl with glasses, small.
- Offline: sleepy or holding a lantern. Not-found: curious.

### Celebrations (the capability moments)

1. First scan: text develops line by line, owl cheers, a one-time line "Nabasa mo na ang imo libro!".
2. First tapped word: marker sweep, sheet rise, owl pop, Hiligaynon well pulse.
3. First saved word: big stamp lands on the word, copy flies to the Pulong tab, tab pops, owl cheers. Seven or more saved words: unlock quiz with the Quiz tab getting a one-time sparkle dot.
4. First quiz: "Pasulit na!" with owl.
5. Quiz star earned: the star stamp lands in the Home chip and the chip number ticks up.
6. Streak 3, 5, 7: a small stamp "3 ka adlaw" on Home, one time per milestone.
7. First finished book: the jacket closes (a 300ms scale and tilt), a "Natapos mo na!" stamp.

Each one is one shot, flag-guarded by a persisted "seen" key, skipped in reduced motion, and uses transform and opacity only.

### GSAP moments to add (all via the existing `src/lib/motion.ts` helpers, gated)

- `pageIn`: Home sections rise 12px and fade, staggered 60ms, once per mount.
- `owlWave`, `owlCheer`, `owlTilt`: short timelines on the owl layers, 600 to 900ms, ease-out, never looping.
- `stampLand`: scale 1.35 to 1 with 8 degree settle and a 2px paper shadow collapse (this is the DESIGN.md rubber-stamp; make the existing one bigger and use it everywhere).
- `lineDevelop`: OCR text appearing per ruled line.
- `bookOpen`: tapping a jacket tilts 6 degrees and scales 1.03 as it navigates; the reader paper rises from the jacket.
- Button press: keep the existing 0.98 press; add a 1.04 overshoot return on the primary only.
- Word list: the newest item slides in from the right once.
- Nav tab pop: the tab that gets a new thing does a single 1.2x pop.

### Graphics to redraw

- Owl (above). Stamp star (bigger, with an inner shine line). Word illustrations: a small ink doodle per curated word (enormous elephant, whispered finger-to-lip, smooth stone) in the same navy ink with a marker-peach fill, drawn on the pad lines.
- Book jackets: the fox, star, rice field, rainbow, turtle and basket are good; add one tiny detail per cover that echoes the story and add a bookmark ribbon on the one the child is reading.
- Scan screen tiles: replace beige circles with doodled objects.
- The empty paper below short stories: a faint doodle in the corner (a leaf, a paw print) so unused rules feel intentional.

### Warm welcome script (Hiligaynon first)

Replace "Kamusta! Tabangan ta ikaw magbasa sang English." with something the owl says in a speech tag, in the child's voice level: "Kamusta! Ako si Kuwago. Basahon ta ang imo libro." Name the owl (a name is the cheapest warmth you can add) and check it with a native Hiligaynon speaker. The brief is clear that machine-generated Hiligaynon is not yet reviewed, so this copy should be reviewed before it ships.

### shadcn and Lucide

- Lucide is used consistently, with no emoji chrome. Good.
- shadcn primitives in use: button, card, dialog, drawer, input, label, progress, scroll-area, sheet, skeleton, slider, sonner, switch, tabs, toggle, toggle-group, tooltip, alert, badge. Gaps worth closing: quiz options (should be a RadioGroup or ToggleGroup item), the words filter (looks like a custom segmented control; Tabs or ToggleGroup), the language picker on Welcome (RadioGroup with custom jacket items, which keeps the shadcn semantics), the nav (custom, fine). Add the shadcn `avatar`-style wrapper for the owl, `hover-card` or `popover` for the owl speech tag, `progress` for the book bars (it exists; use it on Books too) and `sonner` toasts for the "word saved" confirmation as a secondary, non-blocking channel.

## 8. Quick wins (each under 30 minutes)

1. Fix the quiz fold: make the feedback and "Sunod" sticky above the nav (F-20).
2. Fill quiz result stars from the left (F-22).
3. Home: make "Padayon sa pagbasa" a real button and label it "Umpisahan ta" at 0% (F-04, F-06).
4. Show the book title in the label card on mobile covers (F-09).
5. Enlarge the saved-word star stamp to about 96px and let it land on the word (F-13).
6. Add 4px of invisible padding to reader word hit areas (F-10).
7. Let the dyslexia header title wrap (F-15).
8. Demote the in-page orange to paper on Words empty state, Offline and Not-found so only one orange is on screen (One Burner Rule).
9. Add a visible pressed or enabled state to the quiz "Sunod" in dark mode (disabled looks absent).
10. Set stat chips to stack at text size Large (F-07).

## 9. Findings index (for the baseline file)

High: F-04, F-05, F-10, F-11, F-12, F-13, F-17, F-21. Medium: F-01, F-20, F-06, F-07, F-09, F-14, F-15, F-16, F-18, F-19, F-22, F-23, F-24 plus desktop Home and Scan. Polish: F-02, F-03, F-08 and the dark and desktop notes.

Top 8 to do first: F-04, F-13, F-12, F-17, F-11, F-10, F-21, owl redraw plus mascot presence (F-20 is the best quick win).

## 10. What is already good (keep)

The jacket and pad paper identity is original and consistent. The type pair is right for the audience. Honest provenance ("Halin sa diksyunaryo sang app") is rare and good. Difficulty by shape plus label is correct. Offline states are kind and in the child's language. Dark mode is real design, not an inversion. Performance is instant. None of this should be traded for delight; the fixes above add warmth on top of it.
