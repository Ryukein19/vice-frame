// Panel arrangements for the Vice Frame cover. A layout is a list of panels,
// each one a rectangle in unit coordinates (0..1 of the canvas), or a slanted
// quad given as a polygon when the seams run diagonally. panelRects scales
// them to pixels and insets rectangular panels by half the gutter so the gap
// between two neighbours reads as one gutter.

export const LAYOUTS = [
  { id: 'grid', name: 'Vice Grid', blurb: 'Four equal panels, two by two.' },
  { id: 'split', name: 'Sunset Split', blurb: 'One hero panel over two small ones.' },
  { id: 'strip', name: 'Neon Strip', blurb: 'Three tall vertical panels.' },
  { id: 'trio', name: 'Diagonal Trio', blurb: 'Three slanted panels, seams on the diagonal.' },
  { id: 'mosaic', name: 'Hero Mosaic', blurb: 'One hero panel beside four small ones.' },
  { id: 'sunset-strip', name: 'Sunset Strip', blurb: 'A wide hero band over a row of three.' },
  { id: 'palm-court', name: 'Palm Court', blurb: 'A hero on the left, two stacked on the right.' },
  { id: 'neon-alley', name: 'Neon Alley', blurb: 'Four tall panels, the middle two wider.' },
  { id: 'vice-strip', name: 'Vice Strip', blurb: 'A diagonal band cuts across the cover.' },
  { id: 'golden-hour', name: 'Golden Hour', blurb: 'A large hero with three small panels in an L.' },
  { id: 'tropicana', name: 'Tropicana', blurb: 'An asymmetric mosaic of five panels.' },
  { id: 'bayfront', name: 'Bayfront', blurb: 'A panoramic hero over two small panels.' },
];

// Unit-space panel shapes. A shape is { x, y, w, h } for a rectangle, or
// { poly: [[x, y], ...] } for a slanted quad. The trio's seams lean right as
// they run down: the top of a seam sits at a third of the width and its foot
// a further eighth to the right, so the three quads tile the whole cover.
const SHAPES = {
  grid: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  split: [
    { x: 0, y: 0, w: 1, h: 0.62 },
    { x: 0, y: 0.62, w: 0.5, h: 0.38 },
    { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
  ],
  strip: [
    { x: 0, y: 0, w: 1 / 3, h: 1 },
    { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
    { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
  ],
  trio: [
    { poly: [[0, 0], [1 / 3, 0], [1 / 3 + 0.125, 1], [0, 1]] },
    { poly: [[1 / 3, 0], [2 / 3, 0], [2 / 3 + 0.125, 1], [1 / 3 + 0.125, 1]] },
    { poly: [[2 / 3, 0], [1, 0], [1, 1], [2 / 3 + 0.125, 1]] },
  ],
  mosaic: [
    { x: 0, y: 0, w: 0.58, h: 1 },
    { x: 0.58, y: 0, w: 0.21, h: 0.5 },
    { x: 0.79, y: 0, w: 0.21, h: 0.5 },
    { x: 0.58, y: 0.5, w: 0.21, h: 0.5 },
    { x: 0.79, y: 0.5, w: 0.21, h: 0.5 },
  ],
  // A wide hero band over a row of three small panels.
  'sunset-strip': [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.58, w: 1 / 3, h: 0.42 },
    { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
    { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
  ],
  // A hero on the left with two stacked panels on the right.
  'palm-court': [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ],
  // Four tall panels; the middle two are wider than the outer two.
  'neon-alley': [
    { x: 0, y: 0, w: 0.22, h: 1 },
    { x: 0.22, y: 0, w: 0.28, h: 1 },
    { x: 0.5, y: 0, w: 0.28, h: 1 },
    { x: 0.78, y: 0, w: 0.22, h: 1 },
  ],
  // Three slanted quads that tile the cover: a top sliver, a wide diagonal
  // band, and a bottom sliver. The band's edges lean right as they run down.
  'vice-strip': [
    { poly: [[0, 0], [1, 0], [1, 0.16], [0, 0.28]] },
    { poly: [[0, 0.28], [1, 0.16], [1, 0.58], [0, 0.7]] },
    { poly: [[0, 0.7], [1, 0.58], [1, 1], [0, 1]] },
  ],
  // A large hero in the top-left corner, a full-height strip on the right
  // and two small panels along the foot: the three small panels wrap the
  // hero in an L.
  'golden-hour': [
    { x: 0, y: 0, w: 0.66, h: 0.66 },
    { x: 0.66, y: 0, w: 0.34, h: 1 },
    { x: 0, y: 0.66, w: 0.33, h: 0.34 },
    { x: 0.33, y: 0.66, w: 0.33, h: 0.34 },
  ],
  // An asymmetric mosaic: a hero and a mid panel up top, two small panels
  // stacked at the top-right, and one wide panel along the foot.
  tropicana: [
    { x: 0, y: 0, w: 0.45, h: 0.62 },
    { x: 0.45, y: 0, w: 0.3, h: 0.62 },
    { x: 0.75, y: 0, w: 0.25, h: 0.38 },
    { x: 0.75, y: 0.38, w: 0.25, h: 0.24 },
    { x: 0, y: 0.62, w: 1, h: 0.38 },
  ],
  // A panoramic hero over two small panels.
  bayfront: [
    { x: 0, y: 0, w: 1, h: 0.68 },
    { x: 0, y: 0.68, w: 0.5, h: 0.32 },
    { x: 0.5, y: 0.68, w: 0.5, h: 0.32 },
  ],
};

/** The layout record for an id, falling back to the grid when unknown. */
export function layoutById(id) {
  return LAYOUTS.find((entry) => entry.id === id) ?? LAYOUTS[0];
}

/** How many panels a layout shows. */
export function panelCount(id) {
  return (SHAPES[id] ?? SHAPES.grid).length;
}

// Turn a unit shape into a pixel panel: { x, y, w, h } plus, for a slanted
// panel, `poly` (the same corners in pixels) and `cx`, `cy` (its centre,
// where a role tag sits). Rectangular panels are inset by half the gutter.
function toPixels(shape, w, h, gutter) {
  if (shape.poly) {
    const pts = shape.poly.map(([px, py]) => [px * w, py * h]);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {
      x, y,
      w: Math.max(...xs) - x,
      h: Math.max(...ys) - y,
      poly: pts,
      cx: pts.reduce((sum, p) => sum + p[0], 0) / pts.length,
      cy: pts.reduce((sum, p) => sum + p[1], 0) / pts.length,
    };
  }
  const half = gutter / 2;
  return {
    x: shape.x * w + half,
    y: shape.y * h + half,
    w: shape.w * w - gutter,
    h: shape.h * h - gutter,
    poly: null,
    cx: (shape.x + shape.w / 2) * w,
    cy: (shape.y + shape.h / 2) * h,
  };
}

/** Pixel panels for a layout on a canvas of width w and height h. */
export function panelRects(id, w, h, gutter = 10) {
  const shapes = SHAPES[id] ?? SHAPES.grid;
  return shapes.map((shape) => toPixels(shape, w, h, gutter));
}

/** The index of the panel holding point (px, py), or -1 when it is in a gap. */
export function panelAt(id, w, h, px, py, gutter = 10) {
  const rects = panelRects(id, w, h, gutter);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r.poly) {
      if (pointInPoly(px, py, r.poly)) return i;
    } else if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

// Even-odd test for a point inside a polygon.
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const [ax, ay] = poly[a];
    const [bx, by] = poly[b];
    if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) {
      inside = !inside;
    }
  }
  return inside;
}
