# Vice Frame

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Frame turns a photo and a caption into GTA-style multi-panel cover art: a Vice City sunset or neon colour grade, bold poster lettering, and a PNG export to share. It was built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Five layouts** — Vice Grid (2×2), Sunset Split (hero + two), Neon Strip (three tall), Diagonal Trio (slanted), Hero Mosaic (hero + four). Pick one and the panels rearrange.
- **Six grades** — Sunset, Neon, Palm, Neon Night, Golden Hour, Tropic Teal. Each re-colours the whole cover.
- **A role tag on every panel** — "THE INSIDER", "THE BOSS", "THE DRIVER" and more. Click a panel to select it, then set its tag and crop it with zoom and pan sliders.
- **Poster furniture** — a striped 3D title in Anton with a Yellowtail script subtitle, a press quote bar, a volume badge, a tagline, a billing block, a gold seal, a barcode and a COMING SOON stamp. One switch turns it all off for a clean cover.
- **Export** — PNG at 1080×1080, 1080×1350 or 1920×1080, or all three at once.
- **Samples** — five photos ship with the app (boulevard, pier, neon street, courier, getaway car) so it works out of the box; or load your own photo into any panel.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything runs offline from the static files under `app/` — photos are read on your own machine and never uploaded. The fonts (Anton and Yellowtail, SIL Open Font License) are vendored under `app/fonts/`.

## How it works

`app/src/layouts.js` defines the five panel arrangements, `app/src/grade.js` the six colour grades, and `app/src/cover.js` paints the whole poster (panels, grade tint, role tags, title and furniture) onto a canvas. `app/src/main.js` wires the editor and the PNG export. `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

No Rockstar Games logo, artwork or font is used anywhere — all art, lettering and effects are original.
