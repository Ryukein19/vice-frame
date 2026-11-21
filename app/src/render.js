// Cover renderer. One function, renderCover, draws the whole poster — the DOM
// live preview and the PNG export both call it, so what you see is what you get.
// The title geometry lives in titleLayout so the preview and the export can never
// disagree about where the title sits.
import { gradeByKey } from './grades.js';
import { layoutByKey } from './layouts.js';
import { coverRect } from './crop.js';

const TOP_BAR = 0.075; // top bar (stars + press quote + VOL. 1), fraction of height
const BOTTOM_BAND = 0.865; // bottom furniture band starts here

/**
 * Shared title geometry for the DOM preview and the canvas export.
 * Two-word captions stack as two lines ("SUNSET" / "HEIST"). With a hero panel
 * the stack is sized to the hero, centred on the hero's centre x and fitted
 * between the top bar and the hero base — so it can never split across a panel
 * gap. Without a hero the caption is one line across the cover's middle.
 * Returns { lines: [{ text, x, y, size }], subtitle: { text, x, y, size } }
 * with y as baselines, all in canvas pixels.
 */
export function titleLayout(ctx, state, W, H) {
  const layout = layoutByKey(state.layout);
  const hero = layout.panels.find((p) => p.hero);
  const words = state.caption.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const subtitleText = state.subtitle.trim();
  if (hero) {
    const hx = hero.x * W;
    const hw = hero.w * W;
    const hy = hero.y * H;
    const hh = hero.h * H;
    const cx = hx + hw / 2;
    const lines = words.length >= 2
      ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
      : words.slice();
    // Size the widest line to the hero width, and the whole block to the hero height.
    let size = hw * 0.32;
    const fit = () => {
      ctx.font = `${size}px Anton, sans-serif`;
      const widest = Math.max(...lines.map((t) => ctx.measureText(t).width));
      const subSize = size * 0.34;
      const blockH = lines.length * size * 1.02 + subSize * 1.6;
      return widest <= hw * 0.98 && blockH <= hh * 0.94;
    };
    while (size > 12 && !fit()) size *= 0.96;
    const subSize = size * 0.34;
    const blockH = lines.length * size * 1.02 + subSize * 1.6;
    // Anchor the block to the hero base so the hero's eyes stay clear of the title.
    const blockBottom = hy + hh - H * 0.012;
    let y = blockBottom - blockH + size * 0.92;
    const out = lines.map((text) => {
      const spec = { text, x: cx, y, size };
      y += size * 1.02;
      return spec;
    });
    // The subtitle sits just above the hero base, inside the hero — never in the
    // gap below it, where the bottom band would cover it.
    return { lines: out, subtitle: { text: subtitleText, x: cx, y: blockBottom - subSize * 0.55, size: subSize } };
  }
  // No hero: one line across the middle of the cover.
  const text = words.join(' ');
  let size = W * 0.16;
  ctx.font = `${size}px Anton, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > W * 0.94) {
    size *= 0.96;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const midY = ((TOP_BAR + BOTTOM_BAND) / 2) * H;
  const subSize = size * 0.34;
  return {
    lines: [{ text, x: W / 2, y: midY + size * 0.3, size }],
    subtitle: { text: subtitleText, x: W / 2, y: midY + size * 0.3 + size * 0.62, size: subSize },
  };
}

/** Draws one five-pointed star centred at (x, y) with radius r. */
function drawStar(ctx, x, y, r, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draws the gold rosette seal with its words, centred at (x, y). */
function drawSeal(ctx, x, y, r, caption) {
  ctx.save();
  ctx.translate(x, y);
  // Scalloped gold edge.
  ctx.fillStyle = '#d4a017';
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.86;
    const a = (i * Math.PI) / points;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7d774';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6410';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, 0, -r * 0.34, r * 0.22, '#8a6410');
  ctx.fillStyle = '#5c3f05';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.24}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', 0, r * 0.14);
  ctx.fillText('COVER ART', 0, r * 0.42);
  ctx.restore();
}

/** Deterministic barcode bars from a seed string. */
function drawBarcode(ctx, x, y, w, h, seed) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  ctx.fillStyle = '#111111';
  let bx = x + w * 0.06;
  while (bx < x + w * 0.94) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const bw = 1 + (s % 4);
    if (s % 3 !== 0) ctx.fillRect(bx, y + h * 0.08, bw, h * 0.72);
    bx += bw + 2;
  }
  ctx.restore();
}

/**
 * Renders the whole cover into `ctx` at W x H. `state` holds layout, grade,
 * caption, subtitle, quote, the loaded images keyed by photo, the per-photo
 * focus points and the per-photo role tags.
 */
export function renderCover(ctx, state, W, H) {
  const layout = layoutByKey(state.layout);
  const grade = gradeByKey(state.grade);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a18';
  ctx.fillRect(0, 0, W, H);

  // Panels: each photo drawn cover-fit around its focus point.
  for (const panel of layout.panels) {
    const px = panel.x * W;
    const py = panel.y * H;
    const pw = panel.w * W;
    const ph = panel.h * H;
    const img = state.images[panel.photo];
    ctx.save();
    if (panel.slant) {
      const s = panel.slant * W;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + pw, py);
      ctx.lineTo(px + pw - s, py + ph);
      ctx.lineTo(px - s, py + ph);
      ctx.closePath();
      ctx.clip();
    }
    if (img) {
      const focus = state.focus[panel.photo];
      const [sx, sy, sw, sh] = coverRect(img, pw, ph, focus);
      ctx.filter = grade.filter;
      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#2a1430';
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  }

  // One cohesive grade cast over the whole cover, plus a soft vignette.
  const cast = ctx.createLinearGradient(0, 0, 0, H);
  cast.addColorStop(0, grade.cast[0]);
  cast.addColorStop(1, grade.cast[1]);
  ctx.fillStyle = cast;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Role tags on every panel.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const tagH = Math.max(16, H * 0.032);
  const tagSize = Math.max(11, H * 0.018);
  const hasHero = layout.panels.some((p) => p.hero);
  for (const panel of layout.panels) {
    const px = panel.x * W;
    const py = panel.y * H;
    const ph = panel.h * H;
    ctx.font = `${tagSize}px Anton, sans-serif`;
    const label = state.tags[panel.photo] || panel.tag;
    const tw = ctx.measureText(label).width + tagH * 0.9;
    // Without a hero the title sits across the cover's middle, so a bottom-row
    // panel's tag would hide behind it — those tags go on the panel's bottom.
    const ty = !hasHero && panel.y > 0.4 ? py + ph - tagH - 6 : py + 6;
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(px + 6, ty, tw, tagH);
    ctx.fillStyle = '#0b1520';
    ctx.fillText(label, px + 6 + tagH * 0.45, ty + tagH / 2 + 1);
  }

  // Title: striped chrome letters with a dark outline and a drop shadow.
  const title = titleLayout(ctx, state, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  for (const line of title.lines) {
    ctx.font = `${line.size}px Anton, sans-serif`;
    const grad = ctx.createLinearGradient(0, line.y - line.size, 0, line.y);
    grad.addColorStop(0, '#ffd23d');
    grad.addColorStop(0.5, '#ff9a3d');
    grad.addColorStop(1, '#ff5e8a');
    ctx.shadowBlur = line.size * 0.08;
    ctx.shadowOffsetY = line.size * 0.03;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a0b1e';
    ctx.lineWidth = Math.max(2, line.size * 0.07);
    ctx.strokeText(line.text, line.x, line.y);
    ctx.fillStyle = grad;
    ctx.fillText(line.text, line.x, line.y);
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (title.subtitle.text) {
    ctx.font = `${title.subtitle.size}px Yellowtail, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = title.subtitle.size * 0.15;
    ctx.shadowOffsetY = title.subtitle.size * 0.05;
    ctx.fillText(title.subtitle.text, title.subtitle.x, title.subtitle.y);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Top bar: five stars, the press quote, VOL. 1.
  const barH = TOP_BAR * H;
  ctx.fillStyle = 'rgba(16,6,20,0.88)';
  ctx.fillRect(0, 0, W, barH);
  const starR = barH * 0.26;
  let sx = W * 0.02 + starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, barH / 2, starR, '#f7c948');
    sx += starR * 2.4;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  const quoteX = W * 0.02 + starR * 12.6;
  let quote = `“${state.quote}” — VICE CITY GAZETTE`;
  let qSize = barH * 0.42;
  ctx.font = `${qSize}px Anton, sans-serif`;
  const volW = ctx.measureText('VOL. 1').width;
  const quoteMax = W * 0.985 - volW - W * 0.03 - quoteX;
  while (qSize > 8 && ctx.measureText(quote).width > quoteMax) {
    qSize *= 0.95;
    ctx.font = `${qSize}px Anton, sans-serif`;
  }
  if (ctx.measureText(quote).width > quoteMax) quote = `“${state.quote}”`;
  ctx.fillText(quote, quoteX, barH / 2 + 1);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f7c948';
  ctx.font = `${barH * 0.42}px Anton, sans-serif`;
  ctx.fillText('VOL. 1', W * 0.985, barH / 2 + 1);

  // Bottom furniture band: tagline, billing, COMING SOON, barcode, seal.
  const bandY = BOTTOM_BAND * H;
  const bandH = H - bandY;
  ctx.fillStyle = 'rgba(16,6,20,0.92)';
  ctx.fillRect(0, bandY, W, bandH);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.max(2, W * 0.002)}px`; } catch (e) { /* older canvas */ }
  const textMax = W * 0.72;
  ctx.fillStyle = '#ffffff';
  let bandTagSize = bandH * 0.26;
  ctx.font = `${bandTagSize}px Anton, sans-serif`;
  while (bandTagSize > 8 && ctx.measureText('EVERY SUNSET HAS A PRICE').width > textMax) {
    bandTagSize *= 0.95;
    ctx.font = `${bandTagSize}px Anton, sans-serif`;
  }
  ctx.fillText('EVERY SUNSET HAS A PRICE', W * 0.02, bandY + bandH * 0.34);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  ctx.fillStyle = '#c9b8cc';
  let billSize = bandH * 0.17;
  const billing = 'VICE FRAME PICTURES  •  A SUNSET HEIST  •  STARRING YOU — SHOT ON YOUR OWN CAMERA';
  ctx.font = `${billSize}px Anton, sans-serif`;
  while (billSize > 8 && ctx.measureText(billing).width > textMax) {
    billSize *= 0.95;
    ctx.font = `${billSize}px Anton, sans-serif`;
  }
  ctx.fillText(billing, W * 0.02, bandY + bandH * 0.62);
  ctx.fillStyle = '#ff4d6d';
  ctx.font = `${bandH * 0.22}px Anton, sans-serif`;
  ctx.fillText('COMING SOON', W * 0.02, bandY + bandH * 0.90);
  const sealR = bandH * 0.44;
  drawSeal(ctx, W * 0.87, bandY + bandH / 2, sealR, 'ORIGINAL COVER ART');
  drawBarcode(ctx, W * 0.74, bandY + bandH * 0.22, W * 0.05, bandH * 0.56, state.caption);
  ctx.restore();
}

/** Renders the cover at W x H and downloads it as a PNG file. */
export function exportPNG(state, w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  renderCover(cv.getContext('2d'), state, w, h);
  cv.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
