// Draws the Vice Frame cover: multi-panel photos with a role tag on each
// panel, a striped 3D poster title with a script subtitle over the art, and
// poster furniture (press quote, volume badge, tagline, billing block, gold
// seal, barcode). Everything is drawn on the canvas at its own (export)
// size, so the preview and the PNG are the same art.
//
// State shape:
//   photos: [{ img, scale, dx, dy }]        - uploaded photos, scale 1..2.5, dx/dy pan -0.4..0.4
//   slots:  [{ photo, scale, dx, dy, role }] - which photo fills each panel, its crop, its role tag
//   layout: a LAYOUTS entry                 - panels (a panel may carry `slant`)
//   grade:  a GRADES entry                  - colour wash over the cover
//   caption, subtitle: strings             - poster title + script subtitle
//   quote, quoteSource, volume, tagline, billing: strings (poster furniture)
//   furniture: boolean                      - poster furniture on/off
import { applyGrade } from './grade.js';

/** Default role tag for a panel, by panel index. */
export const ROLES = [
  'THE INSIDER', 'THE BOSS', 'THE RIDER', 'THE DRIVER', 'THE COURIER',
  'THE FIXER', 'THE GETAWAY', 'THE CREW', 'THE MECHANIC', 'THE LOOKOUT',
];

const GAP = 7; // neon gap between panels, in export pixels at 1080 wide (scaled below)

/** Draws the whole cover for `state` onto `canvas` (at the canvas's own size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const gap = Math.max(3, Math.round((GAP * w) / 1080));
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);

  const layout = state.layout;
  layout.panels.forEach((panel, i) => {
    drawPanel(ctx, w, h, panel, photoForSlot(state, i), i, gap);
  });

  applyGrade(ctx, w, h, state.grade);
  if (state.furniture) drawQuoteBar(ctx, w, h, state);
  drawTitleBlock(ctx, w, h, state);
  if (state.furniture) drawFooter(ctx, w, h, state);
  // Role tags last, so the title never hides one.
  layout.panels.forEach((panel, i) => {
    drawRoleTag(ctx, w, h, panel, state, i, gap);
  });
}

/** The photo assigned to a panel slot, with that panel's own crop, or null. */
function photoForSlot(state, slot) {
  const s = state.slots[slot];
  if (!s || s.photo === null || s.photo === undefined) return null;
  const photo = state.photos[s.photo];
  if (!photo) return null;
  return { img: photo.img, scale: s.scale, dx: s.dx, dy: s.dy };
}

/** The (possibly slanted) parallelogram a panel occupies, in pixels. */
function panelPath(ctx, x, y, w, h, shift) {
  ctx.beginPath();
  ctx.moveTo(x + shift, y);
  ctx.lineTo(x + w + shift, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/** One panel: its photo (or an empty wash), a dark divider and a neon edge. */
function drawPanel(ctx, w, h, panel, photo, i, gap) {
  const px = panel.x * w;
  const py = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  const shift = (panel.slant || 0) * w;
  ctx.save();
  panelPath(ctx, px, py, pw, ph, shift);
  ctx.clip();
  if (photo) {
    drawPhoto(ctx, photo, px, py, pw, ph);
  } else {
    drawEmptyPanel(ctx, px, py, pw, ph, i);
  }
  ctx.restore();
  // Dark divider, then a thin neon edge so the panels read as a poster grid.
  ctx.strokeStyle = 'rgba(8, 2, 16, 0.85)';
  ctx.lineWidth = gap;
  panelPath(ctx, px, py, pw, ph, shift);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 46, 136, 0.55)';
  ctx.lineWidth = Math.max(1, w / 900);
  panelPath(ctx, px, py, pw, ph, shift);
  ctx.stroke();
}

/** Draws one photo cover-fitting `rect`, with its zoom and pan applied. */
function drawPhoto(ctx, photo, x, y, w, h) {
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(w / iw, h / ih);
  const scale = base * (photo.scale || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2 + (photo.dx || 0) * w;
  const cy = y + h / 2 + (photo.dy || 0) * h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

/** An empty panel: a diagonal sunset wash so the grid still looks finished. */
function drawEmptyPanel(ctx, x, y, w, h, i) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  const hues = [
    ['#3a1c5e', '#1b0f33'],
    ['#5e1c4a', '#241031'],
    ['#1c3a5e', '#120f33'],
    ['#4a1c3a', '#1c1030'],
  ];
  const [a, b] = hues[i % hues.length];
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `bold ${Math.max(14, h * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('+ ADD PHOTO', x + w / 2, y + h / 2);
}

/** A slanted dark label with the panel's role tag, bottom-left of the panel. */
function drawRoleTag(ctx, w, h, panel, state, i, gap) {
  const slot = state.slots[i];
  const role = slot && typeof slot.role === 'string' ? slot.role.trim() : '';
  if (!role) return;
  const px = panel.x * w;
  const py = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  const shift = (panel.slant || 0) * w;
  const tagH = Math.max(18, h * 0.028);
  const inset = Math.max(6, gap);
  const footerTop = h * 0.9;
  // Bottom-left of the panel, clamped to sit just above the footer strip.
  let tagY = py + ph - tagH - inset;
  tagY = Math.min(tagY, footerTop - tagH - inset);
  tagY = Math.max(tagY, py + inset);
  // The panel's left edge slides right as y rises to the top (slant).
  const leftX = px + shift * (1 - (tagY - py) / ph) + inset;
  const fontSize = tagH * 0.52;
  ctx.save();
  ctx.font = `bold ${fontSize}px Anton, 'Arial Black', sans-serif`;
  const text = role.toUpperCase();
  const tw = ctx.measureText(text).width;
  const padX = tagH * 0.45;
  const labelW = tw + padX * 2;
  const skew = tagH * 0.35;
  ctx.beginPath();
  ctx.moveTo(leftX + skew, tagY);
  ctx.lineTo(leftX + labelW + skew, tagY);
  ctx.lineTo(leftX + labelW, tagY + tagH);
  ctx.lineTo(leftX, tagY + tagH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(16, 6, 28, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(1, tagH * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, leftX + padX + skew * 0.5, tagY + tagH / 2 + 1);
  ctx.restore();
}

/** The press quote bar across the top: five stars, a quote, its source. */
function drawQuoteBar(ctx, w, h, state) {
  const quote = (state.quote || '').trim();
  const source = (state.quoteSource || '').trim();
  if (!quote && !source) return;
  const y = h * 0.02;
  const size = Math.max(13, h * 0.022);
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const sx = w * 0.02;
  // Five gold stars.
  ctx.font = `${size * 1.15}px sans-serif`;
  ctx.fillStyle = '#ffd23e';
  const stars = '★★★★★';
  ctx.fillText(stars, sx, y + size * 0.5);
  let qx = sx + ctx.measureText(stars).width + size * 0.6;
  // Shrink the quote rather than let it run into the volume badge.
  let qSize = size;
  const limit = w * 0.78;
  const setQuoteFont = (s) => {
    ctx.font = `bold ${s}px Anton, 'Arial Black', sans-serif`;
  };
  if (quote) {
    setQuoteFont(qSize);
    const q = `"${quote.toUpperCase()}"`;
    while (qSize > size * 0.6 && qx + ctx.measureText(q).width > limit) {
      qSize *= 0.9;
      setQuoteFont(qSize);
    }
    ctx.fillStyle = '#ffe9f4';
    ctx.fillText(q, qx, y + size * 0.5);
    qx += ctx.measureText(q).width + size * 0.5;
  }
  if (source && qx < limit) {
    ctx.font = `${size * 0.85}px Anton, 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffb3d4';
    ctx.fillText(`— ${source.toUpperCase()}`, qx, y + size * 0.5);
  }
  ctx.restore();
  drawVolumeBadge(ctx, w, h, state);
}

/** A gold slanted badge top-right: the volume / issue label. */
function drawVolumeBadge(ctx, w, h, state) {
  const vol = (state.volume || '').trim();
  if (!vol) return;
  const size = Math.max(13, h * 0.022);
  ctx.save();
  ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
  const tw = ctx.measureText(vol.toUpperCase()).width;
  const padX = size * 0.9;
  const padY = size * 0.45;
  const bw = tw + padX * 2;
  const bh = size + padY * 2;
  const bx = w - w * 0.02 - bw;
  const by = h * 0.015;
  const skew = bh * 0.4;
  ctx.beginPath();
  ctx.moveTo(bx + skew, by);
  ctx.lineTo(bx + bw + skew, by);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx, by + bh);
  ctx.closePath();
  ctx.fillStyle = '#ffd23e';
  ctx.fill();
  ctx.fillStyle = '#160822';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(vol.toUpperCase(), bx + bw / 2 + skew * 0.5, by + bh / 2 + 1);
  ctx.restore();
}

/** The poster title block over the panels: striped 3D title, script
 *  subtitle overlapping it, and the tagline bar (furniture). */
function drawTitleBlock(ctx, w, h, state) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const tagline = state.furniture ? (state.tagline || '').trim() : '';
  if (!text && !sub) return;
  const maxW = w * 0.88;
  const { lines, size } = fitTitle(ctx, text, maxW, h * 0.15, h * 0.05);
  const step = size * 1.02;
  const titleH = lines.length * step;
  const subSize = Math.max(18, size * 0.42);
  const tagH = tagline ? Math.max(16, h * 0.028) : 0;
  const tagGap = tagH ? size * 0.16 : 0;
  // The block: title, then the script line overlapping its lower edge,
  // then the tagline bar. Centred on the lower-middle of the cover.
  const blockH = titleH + subSize * 0.55 + tagGap + tagH;
  const top = h * 0.64 - blockH / 2;
  const firstLineY = top + size * 0.5;

  // A soft dark scrim behind the words so they read over bright photos.
  const scrim = ctx.createLinearGradient(0, top - h * 0.03, 0, top + blockH + h * 0.03);
  scrim.addColorStop(0, 'rgba(10, 4, 20, 0)');
  scrim.addColorStop(0.5, 'rgba(10, 4, 20, 0.5)');
  scrim.addColorStop(1, 'rgba(10, 4, 20, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top - h * 0.03, w, blockH + h * 0.06);

  drawStripedTitle(ctx, lines, size, w / 2, firstLineY, step);
  if (sub) {
    const subY = top + titleH - size * 0.1;
    drawScriptSubtitle(ctx, sub, w / 2, subY, subSize);
  }
  if (tagline) {
    const tagY = top + titleH + subSize * 0.55 + tagGap + tagH / 2;
    drawTagline(ctx, tagline, w / 2, tagY, w, h, tagH);
  }
}

/** Fits the title to the width (at most two lines), shrinking as needed. */
function fitTitle(ctx, text, maxW, startSize, minSize) {
  let size = startSize;
  while (size > minSize) {
    const lines = wrapCaption(ctx, text, maxW, size);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxW) return { lines, size };
    size *= 0.9;
  }
  return { lines: wrapCaption(ctx, text, maxW, minSize), size: minSize };
}

/** Bold poster lettering: dark 3D extrusion, striped gradient fill, outline. */
function drawStripedTitle(ctx, lines, size, cx, firstLineY, step) {
  ctx.save();
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // 3D extrusion: the same words, dark, offset down-right.
  const off = size * 0.045;
  ctx.fillStyle = '#2a0a3d';
  lines.forEach((line, i) => ctx.fillText(line, cx + off, firstLineY + i * step + off));
  // Horizontal retro stripes baked into the fill gradient.
  const topY = firstLineY - size * 0.5;
  const botY = firstLineY + (lines.length - 1) * step + size * 0.5;
  const fill = ctx.createLinearGradient(0, topY, 0, botY);
  fill.addColorStop(0, '#fff7d6');
  fill.addColorStop(0.2, '#fff7d6');
  fill.addColorStop(0.2, '#ffd23e');
  fill.addColorStop(0.4, '#ffd23e');
  fill.addColorStop(0.4, '#ff7a3d');
  fill.addColorStop(0.6, '#ff7a3d');
  fill.addColorStop(0.6, '#ff2e88');
  fill.addColorStop(0.8, '#ff2e88');
  fill.addColorStop(0.8, '#b04dff');
  fill.addColorStop(1, '#b04dff');
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = '#160822';
  ctx.shadowColor = 'rgba(255, 0, 128, 0.55)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.04;
  lines.forEach((line, i) => {
    const y = firstLineY + i * step;
    ctx.strokeText(line, cx, y);
    ctx.fillStyle = fill;
    ctx.fillText(line, cx, y);
  });
  ctx.restore();
}

/** The script subtitle, slightly tilted, glowing pink over the title. */
function drawScriptSubtitle(ctx, sub, cx, y, size) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(-0.035);
  ctx.font = `${size}px Yellowtail, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeStyle = 'rgba(22, 8, 34, 0.9)';
  ctx.shadowColor = 'rgba(255, 122, 217, 0.9)';
  ctx.shadowBlur = size * 0.35;
  ctx.fillStyle = '#ff9de2';
  ctx.strokeText(sub, 0, 0);
  ctx.fillText(sub, 0, 0);
  ctx.restore();
}

/** The tagline bar: a dark pill with pink chevrons at each end. */
function drawTagline(ctx, tagline, cx, y, w, h, tagH) {
  const size = Math.max(12, tagH * 0.55);
  ctx.save();
  ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
  const text = tagline.toUpperCase();
  const tw = ctx.measureText(text).width;
  const padX = size * 1.2;
  const bw = Math.min(w * 0.86, tw + padX * 2 + size * 2.6);
  const bh = tagH;
  roundRect(ctx, cx - bw / 2, y - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(16, 6, 28, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.stroke();
  // Chevrons pointing outwards at each end of the pill.
  ctx.fillStyle = '#ff2e88';
  const ch = size * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + size * 0.55 + ch, y);
  ctx.lineTo(cx - bw / 2 + size * 0.55, y - ch);
  ctx.lineTo(cx - bw / 2 + size * 0.55, y + ch);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + bw / 2 - size * 0.55 - ch, y);
  ctx.lineTo(cx + bw / 2 - size * 0.55, y - ch);
  ctx.lineTo(cx + bw / 2 - size * 0.55, y + ch);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9f4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1);
  ctx.restore();
}

/** The footer strip: COMING SOON, billing block, barcode, gold seal. */
function drawFooter(ctx, w, h, state) {
  const fh = h * 0.1;
  const fy = h - fh;
  ctx.fillStyle = 'rgba(16, 6, 28, 0.94)';
  ctx.fillRect(0, fy, w, fh);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, fy, w, Math.max(2, h * 0.003));

  ctx.save();
  const size = Math.max(12, fh * 0.3);
  ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
  try { ctx.letterSpacing = `${size * 0.18}px`; } catch { /* older canvas */ }
  ctx.fillStyle = '#ff7ab8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', w * 0.02, fy + fh / 2);
  const soonRight = w * 0.02 + ctx.measureText('COMING SOON').width + size * 0.5;
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

  // Billing block, centred between COMING SOON and the barcode, at most two
  // lines, shrunk to fit that space (a portrait cover is narrow).
  const barcodeLeft = w - w * 0.02 - w * 0.095;
  const billingCx = soonRight + (barcodeLeft - soonRight) / 2;
  const lines = (state.billing || '')
    .split('\n')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 2);
  if (lines.length) {
    let bs = Math.max(10, fh * 0.2);
    ctx.font = `${bs}px Anton, 'Arial Black', sans-serif`;
    const limit = (barcodeLeft - soonRight) * 0.96;
    while (bs > 8 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > limit) {
      bs *= 0.9;
      ctx.font = `${bs}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.fillStyle = '#f2ecf7';
    ctx.textAlign = 'center';
    const lh = bs * 1.5;
    const y0 = fy + fh / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => ctx.fillText(line, billingCx, y0 + i * lh));
  }
  ctx.restore();

  drawBarcode(ctx, w, h, fy, fh);
  drawSeal(ctx, w, h, fy, fh);
}

/** A decorative fake barcode, bottom-right of the footer. */
function drawBarcode(ctx, w, h, fy, fh) {
  const bw = w * 0.095;
  const bh = fh * 0.62;
  const bx = w - w * 0.02 - bw;
  const by = fy + fh * 0.16;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx, by, bw, bh);
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
  const total = bars.reduce((a, b) => a + b, 0);
  const unit = (bw * 0.92) / total;
  let x = bx + bw * 0.04;
  ctx.fillStyle = '#111111';
  for (const b of bars) {
    ctx.fillRect(x, by + bh * 0.06, b * unit * 0.7, bh * 0.72);
    x += b * unit;
  }
  ctx.font = `${Math.max(8, bh * 0.14)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('002113 122020', bx + bw / 2, by + bh * 0.9);
  ctx.restore();
}

/** A gold rosette seal: "ORIGINAL COVER ART", overlapping the footer. */
function drawSeal(ctx, w, h, fy, fh) {
  const cx = w * 0.925;
  const cy = fy - h * 0.055;
  const R = Math.max(26, w * 0.045);
  ctx.save();
  ctx.beginPath();
  const N = 24;
  for (let i = 0; i <= N * 2; i++) {
    const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? R : R * 0.86;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const gold = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  gold.addColorStop(0, '#ffe98a');
  gold.addColorStop(0.5, '#f5b81d');
  gold.addColorStop(1, '#c77f0a');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.strokeStyle = '#7a5200';
  ctx.lineWidth = Math.max(1, R * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#160822';
  ctx.fill();
  ctx.strokeStyle = '#ffe98a';
  ctx.lineWidth = Math.max(1, R * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#ffe98a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ts = R * 0.2;
  ctx.font = `bold ${ts}px Anton, 'Arial Black', sans-serif`;
  ctx.fillText('ORIGINAL', cx, cy - ts * 1.05);
  ctx.fillText('COVER', cx, cy);
  ctx.fillText('ART', cx, cy + ts * 1.05);
  ctx.font = `${ts * 0.8}px sans-serif`;
  ctx.fillText('★ ★ ★', cx, cy + ts * 2.0);
  ctx.restore();
}

/** A rounded-rect path (ctx.roundRect is not in every headless build). */
function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

/** Wraps the caption to at most two lines at the given size. */
function wrapCaption(ctx, text, maxWidth, size) {
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}
