// Vice Frame — panel layouts.
// Each layout is a function of the cover size (W, H in pixels) that returns
// the panels that fill the art area. A panel is { x, y, w, h } in fractions
// of the cover, plus optional hero (the big panel) and slant (a diagonal
// shear in fractions of the panel width, applied to the top edge).
// The art area is the whole cover; the title band and the furniture strip
// overlay it, GTA-poster style, so panels run edge to edge.

export const LAYOUTS = {
  grid: {
    name: 'Vice Grid',
    blurb: 'Four equal panels, 2 by 2.',
    panels(W, H) {
      const g = 0.012;
      const hw = 0.5 - g;
      const hh = 0.5 - g;
      return [
        { id: 'p0', x: g, y: g, w: hw, h: hh, hero: false },
        { id: 'p1', x: 0.5 + g, y: g, w: hw, h: hh, hero: false },
        { id: 'p2', x: g, y: 0.5 + g, w: hw, h: hh, hero: false },
        { id: 'p3', x: 0.5 + g, y: 0.5 + g, w: hw, h: hh, hero: false },
      ];
    },
  },

  split: {
    name: 'Sunset Split',
    blurb: 'One hero panel with two small panels stacked beside it.',
    panels(W, H) {
      const g = 0.012;
      const heroW = 0.62 - g;
      const sideX = 0.62 + g;
      const sideW = 1 - sideX - g;
      const halfH = 0.5 - g;
      return [
        { id: 'p0', x: g, y: g, w: heroW, h: 1 - 2 * g, hero: true },
        { id: 'p1', x: sideX, y: g, w: sideW, h: halfH, hero: false },
        { id: 'p2', x: sideX, y: 0.5 + g, w: sideW, h: halfH, hero: false },
      ];
    },
  },

  strip: {
    name: 'Neon Strip',
    blurb: 'Three tall vertical panels.',
    panels(W, H) {
      const g = 0.012;
      const w = (1 - 4 * g) / 3;
      return [
        { id: 'p0', x: g, y: g, w, h: 1 - 2 * g, hero: false },
        { id: 'p1', x: g * 2 + w, y: g, w, h: 1 - 2 * g, hero: true },
        { id: 'p2', x: g * 3 + 2 * w, y: g, w, h: 1 - 2 * g, hero: false },
      ];
    },
  },

  diagonal: {
    name: 'Diagonal Trio',
    blurb: 'Three slanted panels, like a comic slash.',
    panels(W, H) {
      const g = 0.012;
      const w = (1 - 4 * g) / 3;
      const slant = 0.16;
      return [
        { id: 'p0', x: g, y: g, w, h: 1 - 2 * g, hero: false, slant },
        { id: 'p1', x: g * 2 + w, y: g, w, h: 1 - 2 * g, hero: true, slant },
        { id: 'p2', x: g * 3 + 2 * w, y: g, w, h: 1 - 2 * g, hero: false, slant },
      ];
    },
  },

  mosaic: {
    name: 'Hero Mosaic',
    blurb: 'One big hero with four small panels around it.',
    panels(W, H) {
      const g = 0.012;
      const heroW = 0.58 - g;
      const heroH = 0.62 - g;
      const sideX = 0.58 + g;
      const sideW = 1 - sideX - g;
      const smallH = (1 - 3 * g) / 2;
      const botY = 0.62 + g;
      const botW = (1 - 3 * g) / 2;
      return [
        { id: 'p0', x: g, y: g, w: heroW, h: heroH, hero: true },
        { id: 'p1', x: sideX, y: g, w: sideW, h: smallH, hero: false },
        { id: 'p2', x: sideX, y: g * 2 + smallH, w: sideW, h: smallH, hero: false },
        { id: 'p3', x: g, y: botY, w: botW, h: 1 - botY - g, hero: false },
        { id: 'p4', x: g * 2 + botW, y: botY, w: botW, h: 1 - botY - g, hero: false },
      ];
    },
  },
};

export const LAYOUT_ORDER = ['grid', 'split', 'strip', 'diagonal', 'mosaic'];

// The panel rectangles for a layout, in pixels, given the cover size.
export function layoutPanels(layoutId, W, H) {
  const def = LAYOUTS[layoutId] ?? LAYOUTS.grid;
  return def.panels(W, H).map((p) => ({
    ...p,
    px: p.x * W,
    py: p.y * H,
    pw: p.w * W,
    ph: p.h * H,
  }));
}
