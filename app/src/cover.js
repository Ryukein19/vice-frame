// Draws the Vice Frame cover: multi-panel photos, a sunset caption band with a
// sun and a skyline, and bold poster lettering. Everything is drawn on the
// canvas at its own (export) size, so the preview and the PNG are the same art.
//
// State shape:
//   photos: [{ img, scale, dx, dy }]        - uploaded photos, scale 1..2.5, dx/dy pan -0.4..0.4
//   slots:  [photoIndex | null, ...]        - which photo fills each panel
//   layout: a LAYOUTS entry                 - panels + caption band
//   grade:  a GRADES entry                  - colour wash over the cover
//   caption, subtitle: strings
import { captionBand } from './layouts.js';
import { applyGrade } from './grade.js';

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
    const px = panel.x * w;
    const py = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;
    const photo = photoForSlot(state, i);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + gap / 2, py + gap / 2, pw - gap, ph - gap);
    ctx.clip();
    if (photo) {
      drawPhoto(ctx, photo, px + gap / 2, py + gap / 2, pw - gap, ph - gap);
    } else {
      drawEmptyPanel(ctx, px + gap / 2, py + gap / 2, pw - gap, ph - gap, i);
    }
    ctx.restore();
    // Dark divider, then a thin neon edge so the panels read as a poster grid.
    ctx.strokeStyle = 'rgba(8, 2, 16, 0.85)';
    ctx.lineWidth = gap;
    ctx.strokeRect(px + gap / 2, py + gap / 2, pw - gap, ph - gap);
    ctx.strokeStyle = 'rgba(255, 46, 136, 0.55)';
    ctx.lineWidth = Math.max(1, w / 900);
    ctx.strokeRect(px + gap / 2, py + gap / 2, pw - gap, ph - gap);
  });

  applyGrade(ctx, w, h, state.grade);
  drawCaptionBand(ctx, w, h, state);
}

/** The photo assigned to a panel slot, with that panel's own crop, or null. */
function photoForSlot(state, slot) {
  const s = state.slots[slot];
  if (!s || s.photo === null || s.photo === undefined) return null;
  const photo = state.photos[s.photo];
  if (!photo) return null;
  return { img: photo.img, scale: s.scale, dx: s.dx, dy: s.dy };
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

/** The sunset caption band: sky gradient, a low sun, a skyline, then the words. */
function drawCaptionBand(ctx, w, h, state) {
  const band = captionBand(state.layout);
  const bh = band.h * h;
  const by = band.edge === 'top' ? 0 : h - bh;

  const sky = ctx.createLinearGradient(0, by, 0, by + bh);
  sky.addColorStop(0, 'rgba(255, 154, 60, 0.96)');
  sky.addColorStop(0.55, 'rgba(255, 46, 136, 0.94)');
  sky.addColorStop(1, 'rgba(90, 20, 130, 0.96)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, by, w, bh);

  // A low sun glowing behind the words.
  const sunR = bh * 0.52;
  const sunX = w * 0.82;
  const sunY = by + bh * 0.52;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 1.9);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  glow.addColorStop(0.45, 'rgba(255, 170, 80, 0.55)');
  glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffedbe';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // A simple skyline along the band's far edge, drawn from fixed heights.
  const heights = [0.28, 0.44, 0.34, 0.54, 0.4, 0.6, 0.36, 0.48, 0.3, 0.46, 0.38, 0.52];
  ctx.fillStyle = 'rgba(24, 6, 40, 0.85)';
  const bw = w / heights.length;
  heights.forEach((f, i) => {
    const top = band.edge === 'top' ? by + bh - f * bh * 0.5 : by + bh - f * bh * 0.5;
    ctx.fillRect(i * bw + 2, top, bw - 4, f * bh * 0.5);
  });

  drawCaptionText(ctx, w, h, by, bh, state);
}

/** Bold poster lettering: Anton, gradient fill, dark outline, neon shadow. */
function drawCaptionText(ctx, w, h, by, bh, state) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (!text && !sub) return;
  ctx.save();
  ctx.translate(w / 2, by + bh / 2);
  ctx.rotate(-0.026); // a slight poster tilt
  ctx.translate(-w / 2, -(by + bh / 2));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (text) {
    const lines = wrapCaption(ctx, text, w * 0.86, bh * 0.5);
    const size = Math.min(bh * 0.5, (bh * 0.86) / Math.max(1, lines.length));
    const fill = ctx.createLinearGradient(0, by + bh * 0.18, 0, by + bh * 0.82);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#ffe9b0');
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.085);
    ctx.strokeStyle = '#160822';
    ctx.shadowColor = 'rgba(255, 0, 128, 0.75)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.045;
    const step = size * 1.04;
    const startY = by + bh / 2 - ((lines.length - 1) * step) / 2 + (sub ? -size * 0.14 : 0);
    lines.forEach((line, i) => {
      ctx.strokeText(line, w / 2, startY + i * step);
      ctx.fillStyle = fill;
      ctx.fillText(line, w / 2, startY + i * step);
    });
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (sub) {
    const subSize = Math.max(12, bh * 0.16);
    ctx.font = `${subSize}px Anton, 'Arial Black', sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.22)}px`; } catch { /* older canvas: no letter spacing */ }
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.5, subSize * 0.1);
    ctx.strokeStyle = '#160822';
    ctx.fillStyle = '#ffe9f4';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = subSize * 0.2;
    ctx.strokeText(sub, w / 2, by + bh - subSize * 0.85);
    ctx.fillText(sub, w / 2, by + bh - subSize * 0.85);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
  ctx.restore();
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
