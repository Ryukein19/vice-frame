// Pop-out hero: the cover's biggest panel breaks its frame. It is drawn a
// touch larger than its slot, tilted a fraction, and lifted with a soft drop
// shadow, so the hero photo floats above the neighbouring panels instead of
// sitting flush inside the grid.

// The index of the panel with the largest area — the cover's hero.
export function heroIndex(rects) {
  let best = 0;
  let bestArea = -1;
  for (let i = 0; i < rects.length; i++) {
    const area = rects[i].w * rects[i].h;
    if (area > bestArea) {
      bestArea = area;
      best = i;
    }
  }
  return best;
}

// Grow a panel rect around its centre by a factor, keeping a slanted quad
// slanted (its corners scale out from the centre) and a rectangle a
// rectangle.
function enlargeRect(rect, factor) {
  const cx = rect.cx ?? rect.x + rect.w / 2;
  const cy = rect.cy ?? rect.y + rect.h / 2;
  if (rect.poly) {
    const poly = rect.poly.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {
      x,
      y,
      w: Math.max(...xs) - x,
      h: Math.max(...ys) - y,
      poly,
      cx,
      cy,
    };
  }
  return {
    x: cx - (rect.w * factor) / 2,
    y: cy - (rect.h * factor) / 2,
    w: rect.w * factor,
    h: rect.h * factor,
    poly: null,
    cx,
    cy,
  };
}

// Trace a panel's outline (a rectangle, or a slanted quad) as the current
// path, without filling or clipping it.
function tracePanel(ctx, rect) {
  ctx.beginPath();
  if (rect.poly) {
    ctx.moveTo(rect.poly[0][0], rect.poly[0][1]);
    for (let i = 1; i < rect.poly.length; i++) ctx.lineTo(rect.poly[i][0], rect.poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
}

// Draw the hero panel popped out of the cover: enlarged by a twentieth,
// tilted by about a degree, and lifted on a soft shadow. paintPanel is the
// panel painter (passed in so this module stays decoupled from cover.js);
// the caller draws every other panel first, then the hero on top.
//
// The shadow is painted first, as the panel's own shape with no clip: a
// shadow set inside paintPanel would be clipped away by the panel's own
// clip path, and the part inside would hide behind the panel's fill. This
// shape lands exactly under the panel paintPanel draws next, so only its
// soft shadow shows, spilling past the frame.
export function drawPopoutHero(ctx, rect, panel, grade, paintPanel) {
  const big = enlargeRect(rect, 1.05);
  const cx = big.cx;
  const cy = big.cy;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.018);
  ctx.translate(-cx, -cy);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#241534';
  tracePanel(ctx, big);
  ctx.fill();
  ctx.restore();
  paintPanel(ctx, big, panel, grade);
  ctx.restore();
}
