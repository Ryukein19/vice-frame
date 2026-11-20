// Panel layouts for Vice Frame. A layout is a list of panels. Panel
// coordinates are fractions of the cover (0..1), so a layout works at any
// export size. Panels are drawn edge to edge with a neon gap between them;
// the poster title and furniture are painted over the panels afterwards.
// A panel may carry `slant`: the fraction of the cover width its top edge
// shifts right (positive) or left (negative), for diagonal GTA-style
// dividers between panels.
export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  'sunset-split': {
    label: 'Sunset Split',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  'neon-strip': {
    label: 'Neon Strip',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  'diagonal-trio': {
    label: 'Diagonal Trio',
    panels: [
      { x: 0, y: 0, w: 0.37, h: 1, slant: 0.05 },
      { x: 0.335, y: 0, w: 0.37, h: 1, slant: 0.05 },
      { x: 0.67, y: 0, w: 0.33, h: 1, slant: 0.05 },
    ],
  },
  'hero-mosaic': {
    label: 'Hero Mosaic',
    panels: [
      { x: 0, y: 0, w: 0.42, h: 1 },
      { x: 0.42, y: 0, w: 0.29, h: 0.5 },
      { x: 0.71, y: 0, w: 0.29, h: 0.5 },
      { x: 0.42, y: 0.5, w: 0.29, h: 0.5 },
      { x: 0.71, y: 0.5, w: 0.29, h: 0.5 },
    ],
  },
};

/** Is the point (x, y) in canvas pixels inside this panel (slant aware)? */
export function panelHit(panel, x, y, w, h) {
  const px = panel.x * w;
  const py = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  if (y < py || y >= py + ph) return false;
  // The panel's left edge slides right as y rises to the top (slant).
  const shift = (panel.slant || 0) * w;
  const left = px + shift * (1 - (y - py) / ph);
  return x >= left && x < left + pw;
}
