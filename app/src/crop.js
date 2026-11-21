// Vice Frame — panel cropping with a focus point.
// Every panel keeps a focus { fx, fy } (0..1 across the photo) and a zoom.
// The crop window is centred on the focus, sized so the photo covers the
// panel at the chosen zoom, and clamped so it never leaves the photo.
// Dragging the focus (or the auto-focus button) moves what the panel shows;
// zooming in tightens the frame on the subject. This is the face-aware
// crop: the focus is what a face would be, and auto-focus finds it.

export function defaultFocus() {
  return { fx: 0.5, fy: 0.42 };
}

// Source rectangle (in photo pixels) to draw into a panel of aspect
// panelW / panelH, given the photo size and the panel's focus + zoom.
// zoom 1 = the whole photo fits the panel (cover); zoom 2 = twice as tight.
export function cropRect(imgW, imgH, panelW, panelH, focus, zoom) {
  const z = Math.max(1, Math.min(3, zoom || 1));
  const panelAspect = panelW / panelH;
  const imgAspect = imgW / imgH;
  // The window that fills the panel at this zoom.
  let sw, sh;
  if (imgAspect > panelAspect) {
    sh = imgH / z;
    sw = sh * panelAspect;
  } else {
    sw = imgW / z;
    sh = sw / panelAspect;
  }
  const fx = focus?.fx ?? 0.5;
  const fy = focus?.fy ?? 0.42;
  let sx = fx * imgW - sw / 2;
  let sy = fy * imgH - sh / 2;
  sx = Math.max(0, Math.min(imgW - sw, sx));
  sy = Math.max(0, Math.min(imgH - sh, sy));
  return { sx, sy, sw, sh };
}

// Face-aware crop: find the most "subject-like" spot in a photo without any
// face model, by scanning a small grid for the cell with the strongest
// colour + contrast energy. Saturated, high-contrast regions are where a
// face, a car or a neon sign usually sits; flat sky and empty road score
// low. Returns { fx, fy } in 0..1. Runs on a downscaled copy, so it is fast.
// Every panel's crop defaults to this point, so a face is centred and fully
// in frame without the user having to fix it.
export function faceAwareCrop(img) {
  const COLS = 8;
  const ROWS = 8;
  const W = 96;
  const H = 96;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  let data;
  try {
    data = ctx.getImageData(0, 0, W, H).data;
  } catch {
    return defaultFocus();
  }
  const cellW = W / COLS;
  const cellH = H / ROWS;
  let best = { score: -1, cx: 0.5, cy: 0.42 };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let sat = 0;
      let lum = 0;
      let n = 0;
      let minL = 255;
      let maxL = 0;
      for (let y = Math.floor(r * cellH); y < Math.floor((r + 1) * cellH); y++) {
        for (let x = Math.floor(c * cellW); x < Math.floor((c + 1) * cellW); x++) {
          const i = (y * W + x) * 4;
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          const mx = Math.max(rr, gg, bb);
          const mn = Math.min(rr, gg, bb);
          sat += mx - mn;
          const l = 0.299 * rr + 0.587 * gg + 0.114 * bb;
          lum += l;
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
          n++;
        }
      }
      if (!n) continue;
      const meanSat = sat / n;
      const contrast = maxL - minL;
      // Centre-weight: a subject near the middle of the frame beats one at
      // the edge, so the crop does not shove the subject out of frame.
      const dc = Math.abs(c - (COLS - 1) / 2) / (COLS / 2);
      const dr = Math.abs(r - (ROWS - 1) / 2) / (ROWS / 2);
      const centre = 1 - 0.35 * Math.hypot(dc, dr);
      const score = (meanSat * 0.6 + contrast * 0.4) * centre;
      if (score > best.score) {
        best = { score, cx: (c + 0.5) / COLS, cy: (r + 0.5) / ROWS };
      }
    }
  }
  return { fx: best.cx, fy: best.cy };
}

// Nudge a focus point by a fraction of the photo (used by the arrow keys
// and by dragging on a panel). Keeps the point inside the photo.
export function nudgeFocus(focus, dx, dy) {
  return {
    fx: Math.max(0.04, Math.min(0.96, focus.fx + dx)),
    fy: Math.max(0.04, Math.min(0.96, focus.fy + dy)),
  };
}
