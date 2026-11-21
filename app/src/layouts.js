// Panel layouts. Every panel is a fraction of the cover (x, y, w, h in 0..1) and
// names the photo it shows and the role tag printed on it. A layout with a hero
// panel puts the title inside that panel; the others take a single centred line.
export const LAYOUTS = [
  {
    key: 'mosaic', name: 'Hero Mosaic',
    panels: [
      { photo: 'face', tag: 'THE FIXER', x: 0.30, y: 0.085, w: 0.40, h: 0.53, hero: true },
      { photo: 'courier', tag: 'THE DRIVER', x: 0.02, y: 0.63, w: 0.2325, h: 0.225 },
      { photo: 'street', tag: 'THE HIDEOUT', x: 0.2625, y: 0.63, w: 0.2325, h: 0.225 },
      { photo: 'car', tag: 'THE GETAWAY', x: 0.505, y: 0.63, w: 0.2325, h: 0.225 },
      { photo: 'pier', tag: 'THE INSIDER', x: 0.7475, y: 0.63, w: 0.2325, h: 0.225 },
    ],
  },
  {
    key: 'grid', name: 'Vice Grid',
    panels: [
      { photo: 'face', tag: 'THE FIXER', x: 0.02, y: 0.085, w: 0.48, h: 0.38 },
      { photo: 'courier', tag: 'THE DRIVER', x: 0.51, y: 0.085, w: 0.48, h: 0.38 },
      { photo: 'street', tag: 'THE HIDEOUT', x: 0.02, y: 0.475, w: 0.48, h: 0.38 },
      { photo: 'car', tag: 'THE GETAWAY', x: 0.51, y: 0.475, w: 0.48, h: 0.38 },
    ],
  },
  {
    key: 'split', name: 'Sunset Split',
    panels: [
      { photo: 'face', tag: 'THE FIXER', x: 0.02, y: 0.085, w: 0.56, h: 0.77, hero: true },
      { photo: 'courier', tag: 'THE DRIVER', x: 0.59, y: 0.085, w: 0.39, h: 0.38 },
      { photo: 'street', tag: 'THE HIDEOUT', x: 0.59, y: 0.475, w: 0.39, h: 0.38 },
    ],
  },
  {
    key: 'strip', name: 'Neon Strip',
    panels: [
      { photo: 'courier', tag: 'THE DRIVER', x: 0.02, y: 0.085, w: 0.315, h: 0.77 },
      { photo: 'face', tag: 'THE FIXER', x: 0.345, y: 0.085, w: 0.31, h: 0.77 },
      { photo: 'car', tag: 'THE GETAWAY', x: 0.665, y: 0.085, w: 0.315, h: 0.77 },
    ],
  },
  {
    key: 'trio', name: 'Diagonal Trio',
    panels: [
      { photo: 'pier', tag: 'THE INSIDER', x: 0.05, y: 0.085, w: 0.29, h: 0.77, slant: 0.03 },
      { photo: 'face', tag: 'THE FIXER', x: 0.36, y: 0.085, w: 0.29, h: 0.77, slant: 0.03 },
      { photo: 'street', tag: 'THE HIDEOUT', x: 0.67, y: 0.085, w: 0.29, h: 0.77, slant: 0.03 },
    ],
  },
];

/** Looks a layout up by its key, falling back to Hero Mosaic. */
export function layoutByKey(key) {
  return LAYOUTS.find((l) => l.key === key) || LAYOUTS[0];
}
