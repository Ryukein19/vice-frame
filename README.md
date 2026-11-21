# Vice Frame

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into GTA-style cover art — a hero-face poster with a huge
striped chrome title, a five-star press quote, and the full cover furniture
(barcode, billing block, rosette seal, COMING SOON).

## How it works

1. Open `app/index.html` (or run `npx tsx serve.ts` and open the local URL).
2. Pick a **layout** (Hero Mosaic, Vice Grid, Sunset Split, Neon Strip,
   Diagonal Trio) and a **grade** (Sunset, Neon, Palm, Neon Night,
   Golden Hour, Tropic Teal).
3. Edit the caption and subtitle — the title is laid out by one shared
   helper, so the DOM preview and the exported PNG always agree.
4. Click any panel to select it, then zoom it, re-run **Auto-focus on the
   subject**, change its role tag, or replace its photo with one of yours.
   Face-aware cropping keeps every face centred in every panel shape.
5. Export a PNG in one click: **1080 × 1080**, **1080 × 1350**, or
   **1920 × 1080** — or all three at once.

## What is inside

- `app/index.html` — the editor (controls + live cover preview).
- `app/src/render.js` — the cover renderer and the shared `titleLayout`
  helper used by both the preview and the export.
- `app/src/layouts.js` — the five panel layouts.
- `app/src/grades.js` — the six colour grades.
- `app/src/crop.js` — face-aware cropping with per-photo pinned focus.
- `app/src/samples.js` — the five sample photos and their role tags.
- `app/src/shots.js` — the headless screenshot runner.
- `app/samples/` — five sample photos made for this entry (no Rockstar
  artwork, no borrowed images).
- `app/fonts/` — Anton and Yellowtail, bundled with the OFL licence text.

All art, lettering and effects are original. No Rockstar logos, artwork or
fonts are used anywhere.
