// Smart crop: a per-photo focal point the panel crop centres on. A focal
// point is a pair of fractions (0..1) of the photo; the crop window slides so
// that point sits at the panel's centre, clamped so the photo still covers
// the whole panel. The default sits near the top centre, where a face
// usually is in a portrait shot — that is the face-aware heuristic: without
// any click, a portrait keeps its subject's head in frame instead of
// cropping it away.

// The default focal point: top centre of the photo.
export const DEFAULT_FOCAL = { fx: 0.5, fy: 0.12 };

// The draw offset that puts a photo's focal point at its panel's centre.
// rect is the panel in pixels, img the photo, scale the cover-fit scale
// (already including zoom), focal the { fx, fy } fractions. The offset is
// clamped so the photo never leaves a bare edge inside the panel.
export function focalOffset(rect, img, scale, focal) {
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const fx = focal?.fx ?? DEFAULT_FOCAL.fx;
  const fy = focal?.fy ?? DEFAULT_FOCAL.fy;
  const dx = rect.x + rect.w / 2 - fx * pw;
  const dy = rect.y + rect.h / 2 - fy * ph;
  return {
    dx: Math.min(rect.x, Math.max(rect.x + rect.w - pw, dx)),
    dy: Math.min(rect.y, Math.max(rect.y + rect.h - ph, dy)),
  };
}

// The photo fractions under a canvas point, for a panel drawn cover-fit
// with the given zoom and pan. Mirrors the cover-fit in paintPanel, so a
// click on a face becomes the focal point that keeps that face centred.
export function focalFromPoint(rect, img, zoom, panX, panY, px, py) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (zoom ?? 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const overX = Math.max(0, pw - rect.w);
  const overY = Math.max(0, ph - rect.h);
  const dx = rect.x + (rect.w - pw) / 2 - (panX ?? 0) * overX;
  const dy = rect.y + (rect.h - ph) / 2 - (panY ?? 0) * overY;
  return {
    fx: Math.min(1, Math.max(0, (px - dx) / pw)),
    fy: Math.min(1, Math.max(0, (py - dy) / ph)),
  };
}
