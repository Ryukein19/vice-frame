# Vice Frame

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Frame turns your photo and a caption into GTA-style multi-panel cover art: a Vice City sunset or neon colour grade, bold poster lettering, and a PNG export to share. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

Five layouts (Vice Grid, Sunset Split, Neon Strip, Diagonal Trio, Hero Mosaic), six grades, a role tag on every panel ("THE INSIDER", "THE BOSS", …), and poster furniture — press quote, volume badge, tagline, billing block, gold seal and barcode — over a striped 3D title with a script subtitle.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything runs offline from the static files under `app/` — photos are read on your own machine and never uploaded.

## How it works

1. Add your photos (or load the five samples) and put one in each panel — or fill every panel with the same photo.
2. Pick a layout: Vice Grid (four panels), Sunset Split (hero plus two), Neon Strip (three tall panels), Diagonal Trio (three slanted panels), or Hero Mosaic (hero plus four).
3. Click a panel to select it, then crop it with the zoom and pan sliders and give it a role tag.
4. Write the caption and subtitle, the press quote, volume badge, tagline and billing block — and switch the poster furniture off if you want a clean cover.
5. Pick a grade: Sunset, Neon, Palm, Neon Night, Golden Hour or Tropic Teal.
6. Choose an export size — 1080 × 1080, 1080 × 1350 or 1920 × 1080 — and export the PNG, or export all three sizes at once.

The caption is set in Anton and the script subtitle in Yellowtail (both SIL Open Font License, vendored under `app/fonts/`). The three extra sample photos (neon, courier, getaway) are original AI-generated art. All art, lettering and effects are original: no Rockstar Games logo, artwork or fonts.

---

Entered on [make.fun](https://make.fun/?ref=sage-badger-64&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards
