---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/screens","src/components"]
---

# Surface brief: Handog Aral app (all screens)

Scope: the whole app shell + Home, Reader/Scan, Books, Words, Quiz, Settings, Welcome. Mode: Operate (Reader text is Read). Mobile-first PWA; desktop = left rail + two-pane reader at ≥1024px. Light + dark (dark = a night pad under one bulb).

Audience/job: children 6–12 (incl. dyslexia) reading their own printed English pages, alone, with a parent, or in teacher-led sessions on shared low-end Android phones with spotty data. The job is to tap an unknown word and understand it in Hiligaynon/Tagalog.

Unresolved: final owl illustration detail; whether jacket colors become user-pickable notebook covers.

## Direction contract

THESIS: The child's page becomes their own pad paper. Scanned or story text sits on quiet blue rules with a red margin, and every word can be tapped. It refuses the category's default: candy-gradient cards, emoji chrome and stacked stat tiles.

OWN-WORLD: Intermediate pad paper (warm off-white, faint blue rules, one red margin line) holds the reading. Saturated book-jacket cloth fields (indigo, mango, kangkong green, gumamela red) act as notebook covers that own whole regions. Ink is a deep navy. The sunrise orange accent goes only on the single primary action and the tapped word. Rewards are rubber-stamp stars and teacher check marks. Baloo 2 for headings, Atkinson Hyperlegible for body, OpenDyslexic as an option. Raises:
- Crouwel: the rules form a real baseline grid; line height equals rule pitch at every font size.
- Labanotation: state is shown by shape, not only color.
- Transit: one thing burns brightest at a time.
- Split-flap: offline→AI upgrades restyle the word in place, without layout shift.

STORY: The child sees their current book as a notebook cover, scans or opens a page, and taps a word. A card with the meaning in their own language slides up (mobile) or docks to the right (desktop). They hear it, save it, and earn a stamp.

FIRST VIEWPORT: Home on a phone.
- Top: greeting in the child's language and a stamp count.
- Center: a full-width notebook cover in the current book's jacket color, about 45% of the height, with the owl perched on its top edge, the title in Baloo, and a large sunrise "Scan a page" button inside the cover.
- Below: a pad-paper strip with the last saved words written on the rules.
- Bottom: the nav with a raised Scan button.
- Desktop: a left rail, the cover and the pad side by side.

FORM: Pad Paper Storybook, position 5 on the grounded list, seed key 190e51fe.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
