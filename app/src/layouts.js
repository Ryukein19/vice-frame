// Panel layouts for Vice Frame. A layout is a list of panels plus where the
// caption band sits. Panel coordinates are fractions of the cover (0..1), so a
// layout works at any export size. Panels are drawn edge to edge with a neon
// gap between them; the caption band is painted over the panels afterwards.
export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    caption: 'bottom',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  'sunset-split': {
    label: 'Sunset Split',
    caption: 'bottom',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  'neon-strip': {
    label: 'Neon Strip',
    caption: 'top',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
};

/** The caption band for a layout: its edge ('top' or 'bottom') and its height as a fraction of the cover. */
export function captionBand(layout) {
  return layout.caption === 'top'
    ? { edge: 'top', h: 0.2 }
    : { edge: 'bottom', h: 0.22 };
}
