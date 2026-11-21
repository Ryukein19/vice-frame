# Vice Frame

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ryukein19/vice-frame/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Frame turns your photos into GTA-style multi-panel cover art: a giant hero face, a huge striped chrome title in the centre, one warm sunset grade, and a full set of poster furniture — then exports the PNG in the sizes you post. It was built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Five layouts** — Vice Grid (2×2), Sunset Split (hero + two), Neon Strip (three tall), Diagonal Trio (slanted), Hero Mosaic (hero + four). The hero panel pops out of the grid with a white frame and a shadow.
- **Six grades** — Sunset, Neon, Palm, Neon Night, Golden Hour, Tropic Teal. One grade re-colours the whole cover so it reads as one poster, not a collage.
- **Face-aware crop** — every panel's crop defaults to the subject's face (a saliency scan finds it), and you can drag the focus, nudge it with the arrow keys, or hit "Auto-focus on the subject". Zoom and pan per panel.
- **Role tags that match the photo** — "THE FIXER" on the hero face, "THE DRIVER" on the courier, "THE HIDEOUT" on the neon street, "THE GETAWAY" on the car. Click a panel to select it, then set its tag.
- **Poster furniture** — a 5-star press-quote bar across the top, a huge striped chrome 3D title in the centre with a Yellowtail script subtitle, and a bottom band with the tagline, the billing block, COMING SOON, a barcode and a gold rosette seal ("ORIGINAL COVER ART"). One switch turns it all off for a clean cover.
- **Export** — PNG at 1080×1080, 1080×1350 or 1920×1080, or all three at once, in one click.
- **Samples** — six photos ship with the app (a hero face, courier, neon street, getaway car, pier, boulevard) so it works out of the box; or load your own photo into any panel. Starring you — shot on your own camera.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything runs offline from the static files under `app/` — photos are read on your own machine and never uploaded. The fonts (Anton and Yellowtail, SIL Open Font License) are vendored under `app/fonts/`.

## How it works

`app/src/layouts.js` defines the five panel arrangements, `app/src/grades.js` the six colour grades, `app/src/crop.js` the face-aware crop (`faceAwareCrop`), and `app/src/render.js` paints the whole poster (panels, grade tint, role tags, the striped chrome title and the furniture) for the live preview and the canvas export. `app/src/main.js` wires the editor and the PNG export. `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

No Rockstar Games logo, artwork or font is used anywhere — all art, lettering and effects are original.
