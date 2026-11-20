import { panelRects } from './layouts.js';
import { gradeById } from './grade.js';
import { focalOffset } from './smartcrop.js';
import { heroIndex, drawPopoutHero } from './popout.js';

// Draws the cover: the photo filling the square, a sunset tint rising from the bottom, and the caption in bold
// white capitals along the foot.

/** Draws `photo` (an image, or null) and `caption` onto the canvas's 2D context, at the canvas's own size. */
export function drawCover(canvas, photo, caption) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.fillStyle = '#2b1838';
  ctx.fillRect(0, 0, w, h);
  if (photo) {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    ctx.drawImage(photo, (w - pw) / 2, (h - ph) / 2, pw, ph);
  }
  const tint = ctx.createLinearGradient(0, h * 0.35, 0, h);
  tint.addColorStop(0, 'rgba(255, 120, 80, 0)');
  tint.addColorStop(1, 'rgba(200, 40, 120, 0.65)');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  const text = caption.trim().toUpperCase();
  if (!text) return;
  let size = h * 0.12;
  ctx.font = `bold ${size}px sans-serif`;
  while (ctx.measureText(text).width > w * 0.9 && size > 12) {
    size -= 2;
    ctx.font = `bold ${size}px sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = size * 0.2;
  ctx.fillText(text, w / 2, h - h * 0.07);
  ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Vice Frame: the multi-panel cover. drawViceCover paints the whole poster
// from a state object:
//
//   { layout, grade, panels, caption, subtitle, quote, volume, tagline,
//     billing, furniture }
//
// panels is an array of { img, zoom, panX, panY, role }; img is an Image or
// null (an empty panel stays a dark placeholder). zoom is a multiplier on the
// cover fit, panX/panY shift the photo inside its panel as fractions of the
// overflow. furniture switches the poster dressing on or off: with it the
// cover gets the striped 3D title, the script subtitle and the press kit
// (quote bar, volume badge, tagline, billing, gold seal, barcode and the
// COMING SOON stamp); without it the cover is just the panels and a plain
// caption along the foot.

/** Paints the full Vice Frame cover onto the canvas from a state object. */
export function drawViceCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = gradeById(state.grade);
  // With the furniture on, the panels fill the top four-fifths and the
  // title band owns the foot; with it off, the panels take the whole cover.
  const panelH = state.furniture ? h * 0.80 : h;
  const rects = panelRects(state.layout, w, panelH);
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  const count = rects.length;
  // With the pop-out on, the hero panel (the largest) is held back and
  // painted last, lifted out of its frame above the other panels.
  let hero = -1;
  if (state.popout) hero = heroIndex(rects);
  for (let i = 0; i < count; i++) {
    if (i === hero) continue;
    paintPanel(ctx, rects[i], state.panels[i] ?? null, grade);
  }
  if (hero >= 0) drawPopoutHero(ctx, rects[hero], state.panels[hero] ?? null, grade, paintPanel);
  ctx.restore();
  if (state.furniture) {
    paintPosterTitle(ctx, w, h, state.caption, state.subtitle, grade.glow);
    paintPosterKit(ctx, w, h, state, grade.glow);
  } else {
    paintPlainCaption(ctx, w, h, state.caption);
  }
}

// Clip the context to one panel (a rectangle, or a slanted quad).
function clipPanel(ctx, rect) {
  ctx.beginPath();
  if (rect.poly) {
    ctx.moveTo(rect.poly[0][0], rect.poly[0][1]);
    for (let i = 1; i < rect.poly.length; i++) ctx.lineTo(rect.poly[i][0], rect.poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
}

// One panel: the photo cover-fit through the grade's filter, the grade tint
// washed over it, and the role tag. An empty panel keeps a dark fill with a
// faint frame so the layout still reads.
function paintPanel(ctx, rect, panel, grade) {
  ctx.save();
  clipPanel(ctx, rect);
  ctx.fillStyle = '#241534';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const img = panel?.img ?? null;
  if (img) {
    const zoom = panel.zoom ?? 1;
    const panX = panel.panX ?? 0;
    const panY = panel.panY ?? 0;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const scale = base * zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const overX = Math.max(0, pw - rect.w);
    const overY = Math.max(0, ph - rect.h);
    // A focal point overrides the pan: the crop centres on the point the
    // user picked (or the top-centre default), so a face stays in frame.
    let dx;
    let dy;
    if (panel.focal) {
      ({ dx, dy } = focalOffset(rect, img, scale, panel.focal));
    } else {
      dx = rect.x + (rect.w - pw) / 2 - panX * overX;
      dy = rect.y + (rect.h - ph) / 2 - panY * overY;
    }
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, pw, ph);
    ctx.filter = 'none';
    const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    tint.addColorStop(0, grade.tintTop);
    tint.addColorStop(1, grade.tintBottom);
    ctx.fillStyle = tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // A thin inner frame keeps neighbouring panels apart.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const role = (panel?.role ?? '').trim().toUpperCase();
  if (role) paintRoleTag(ctx, rect, role);
}

// The role tag: a small dark pill with the role in capitals, centred on the
// panel's foot (or its centre for a slanted panel).
function paintRoleTag(ctx, rect, role) {
  const size = Math.max(14, Math.min(rect.w, rect.h) * 0.085);
  ctx.save();
  ctx.font = `700 ${size}px Anton, 'Arial Narrow', sans-serif`;
  const padX = size * 0.7;
  const tw = ctx.measureText(role).width;
  const bw = tw + padX * 2;
  const bh = size * 1.7;
  const bx = rect.cx - bw / 2;
  const by = rect.y + rect.h - bh - size * 0.55;
  ctx.fillStyle = 'rgba(12, 4, 22, 0.82)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, rect.cx, by + bh / 2 + size * 0.04);
  ctx.restore();
}

// The striped 3D title: the caption drawn twice behind itself (a deep shade,
// then the grade's glow) for the extruded depth, then once more in a
// horizontally striped gradient. The script subtitle sits under it.
function paintPosterTitle(ctx, w, h, caption, subtitle, glow) {
  const text = (caption ?? '').trim().toUpperCase();
  if (!text) return;
  // The title band is the foot of the cover, below the panels: the title
  // sits in its upper half and the script subtitle just beneath it, leaving
  // the corners free for the barcode and the seal.
  const bandTop = h * 0.80;
  const bandH = h * 0.20;
  ctx.save();
  const wash = ctx.createLinearGradient(0, bandTop - h * 0.03, 0, h);
  wash.addColorStop(0, 'rgba(10, 3, 20, 0)');
  wash.addColorStop(0.35, 'rgba(10, 3, 20, 0.55)');
  wash.addColorStop(1, 'rgba(10, 3, 20, 0.78)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, bandTop - h * 0.03, w, h - bandTop + h * 0.03);
  let size = h * 0.085;
  const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  while (ctx.measureText(text).width > w * 0.70 && size > 18) {
    size -= 3;
    setFont(size);
  }
  const cx = w / 2;
  const baseline = bandTop + bandH * 0.52;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const depth = size * 0.075;
  ctx.fillStyle = '#150722';
  ctx.fillText(text, cx + depth, baseline + depth);
  ctx.fillStyle = glow;
  ctx.fillText(text, cx + depth * 0.45, baseline + depth * 0.45);
  const stripes = ctx.createLinearGradient(0, baseline - size, 0, baseline);
  const bands = 9;
  for (let i = 0; i <= bands; i++) {
    const stop = i / bands;
    stripes.addColorStop(stop, i % 2 === 0 ? '#ffffff' : '#ffd7ef');
  }
  ctx.fillStyle = stripes;
  ctx.fillText(text, cx, baseline);
  const sub = (subtitle ?? '').trim();
  if (sub) {
    const subSize = Math.max(18, size * 0.42);
    ctx.font = `${subSize}px Yellowtail, cursive`;
    ctx.fillStyle = glow;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(sub, cx, baseline + subSize * 1.15);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// The plain caption for a cover with the furniture off: bold white capitals
// along the foot, over a light wash.
function paintPlainCaption(ctx, w, h, caption) {
  const text = (caption ?? '').trim().toUpperCase();
  if (!text) return;
  ctx.save();
  const wash = ctx.createLinearGradient(0, h * 0.78, 0, h);
  wash.addColorStop(0, 'rgba(10, 3, 20, 0)');
  wash.addColorStop(1, 'rgba(10, 3, 20, 0.55)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  let size = h * 0.09;
  const setFont = (s) => { ctx.font = `bold ${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 2;
    setFont(size);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = size * 0.2;
  ctx.fillText(text, w / 2, h - h * 0.06);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// The press kit: quote bar, volume badge, tagline, billing block, gold seal,
// barcode and the COMING SOON stamp. All of it is drawn from the state, and
// the barcode's bars come from a hash of the caption, so a cover renders
// byte-identically every time.
function paintPosterKit(ctx, w, h, state, glow) {
  ctx.save();
  const quote = (state.quote ?? '').trim();
  if (quote) {
    const qSize = Math.max(15, h * 0.021);
    ctx.font = `italic 600 ${qSize}px Georgia, serif`;
    const tw = Math.min(w * 0.86, ctx.measureText(`\u201C${quote}\u201D`).width + qSize * 2.4);
    const qx = (w - tw) / 2;
    const qy = h * 0.045;
    ctx.fillStyle = 'rgba(12, 4, 22, 0.72)';
    ctx.beginPath();
    ctx.roundRect(qx, qy, tw, qSize * 2.1, qSize * 0.5);
    ctx.fill();
    ctx.fillStyle = '#ffe9f6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`\u201C${quote}\u201D`, w / 2, qy + qSize * 1.06);
  }
  const volume = (state.volume ?? '').trim().toUpperCase();
  if (volume) {
    const vSize = Math.max(14, h * 0.02);
    ctx.font = `700 ${vSize}px Anton, 'Arial Narrow', sans-serif`;
    const label = volume.startsWith('VOL') ? volume : `VOL. ${volume}`;
    const vw = ctx.measureText(label).width + vSize * 1.6;
    const vh = vSize * 2;
    const vx = w - vw - w * 0.03;
    const vy = h * 0.045;
    ctx.fillStyle = 'rgba(12, 4, 22, 0.78)';
    ctx.beginPath();
    ctx.roundRect(vx, vy, vw, vh, vh * 0.22);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = Math.max(1.5, vSize * 0.1);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, vx + vw / 2, vy + vh / 2 + vSize * 0.05);
  }
  const tagline = (state.tagline ?? '').trim();
  if (tagline) {
    const tSize = Math.max(14, h * 0.019);
    ctx.font = `600 ${tSize}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(tagline.toUpperCase(), w / 2, h - h * 0.028);
  }
  const billing = (state.billing ?? '').trim();
  if (billing) {
    const bSize = Math.max(9, h * 0.011);
    ctx.font = `${bSize}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.textAlign = 'center';
    ctx.fillText(billing.toUpperCase(), w / 2, h - h * 0.008);
  }
  paintGoldSeal(ctx, w, h, glow);
  paintBarcode(ctx, w, h, state.caption ?? '');
  paintSoonStamp(ctx, w, h);
  ctx.restore();
}

// A gold seal: a radial-gold disc with a star, in the title band's
// bottom-right corner, clear of the centred title.
function paintGoldSeal(ctx, w, h, glow) {
  const r = Math.max(26, h * 0.042);
  const cx = w - r - w * 0.02;
  const cy = h - r - 14;
  const gold = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  gold.addColorStop(0, '#ffe98a');
  gold.addColorStop(0.55, '#f5b90c');
  gold.addColorStop(1, '#9a6a00');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#4a2c00';
  ctx.font = `${r * 0.95}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2605', cx, cy + r * 0.06);
}

// A barcode whose bars are derived from a hash of the caption, so the same
// caption always draws the same bars.
function paintBarcode(ctx, w, h, caption) {
  let hash = 2166136261;
  for (const ch of String(caption)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const bw = Math.max(70, w * 0.13);
  const bh = Math.max(22, h * 0.032);
  const bx = w * 0.03;
  const by = h - bh - 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - 6, by - 5, bw + 12, bh + 10);
  ctx.fillStyle = '#111111';
  let x = bx;
  let n = 0;
  while (x < bx + bw - 2 && n < 42) {
    hash = Math.imul(hash ^ (hash >>> 13), 16777619);
    const bar = 1 + (Math.abs(hash) % 4);
    if (n % 3 !== 2) ctx.fillRect(x, by, bar, bh);
    x += bar + 1 + (Math.abs(hash >> 3) % 2);
    n++;
  }
}

// The COMING SOON stamp: a rotated, bordered shout in the top-left corner.
function paintSoonStamp(ctx, w, h) {
  const size = Math.max(16, h * 0.024);
  ctx.save();
  ctx.translate(w * 0.16, h * 0.16);
  ctx.rotate(-0.14);
  ctx.font = `700 ${size}px Anton, 'Arial Narrow', sans-serif`;
  const label = 'COMING SOON';
  const tw = ctx.measureText(label).width;
  const pad = size * 0.7;
  ctx.strokeStyle = '#ff4d6d';
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.strokeRect(-tw / 2 - pad, -size * 0.85, tw + pad * 2, size * 1.7);
  ctx.fillStyle = '#ff4d6d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, size * 0.06);
  ctx.restore();
}
