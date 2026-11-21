// Vice Frame — cover rendering.
// One layout math drives both the live DOM preview and the exported PNG,
// so what you see is what the PNG holds. The cover is a movie poster:
// a 5-star press-quote bar across the top, a huge striped chrome 3D title
// in the centre overlapping the panels, and a furniture band along the
// bottom (tagline, billing, COMING SOON, barcode, rosette seal). The hero
// panel pops out of the grid with a border and a shadow, and the whole
// cover wears one cohesive grade.

import { layoutPanels } from './layouts.js';
import { GRADES, titleShade } from './grades.js';
import { cropRect } from './crop.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

const ROLE_DEFAULTS = ['THE FIXER', 'THE DRIVER', 'THE HIDEOUT', 'THE GETAWAY', 'THE INSIDER', 'OCEAN DRIVE'];

// The panels a layout shows, each paired with the user's photo state.
export function coverPanels(state, W, H) {
  const rects = layoutPanels(state.layout, W, H);
  return rects.map((r, i) => ({
    ...r,
    slot: state.panels[i] ?? {},
    role: state.panels[i]?.role ?? ROLE_DEFAULTS[i % ROLE_DEFAULTS.length],
  }));
}

// --- DOM preview -------------------------------------------------------

// Build (or rebuild) the cover preview inside coverEl. coverEl keeps the
// cover's aspect ratio; panels are absolutely positioned divs whose
// background is the photo, positioned by the panel's focus and zoom.
export function renderCoverDOM(coverEl, state, images) {
  const W = coverEl.clientWidth || 600;
  const H = coverEl.clientHeight || 600;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  coverEl.innerHTML = '';
  coverEl.style.setProperty('--accent', grade.accent);
  const panels = coverPanels(state, W, H);
  for (const p of panels) {
    const img = images[p.slot.photo];
    const div = document.createElement('div');
    div.className = 'panel' + (p.hero ? ' hero' : '');
    div.dataset.panel = p.id;
    div.style.left = p.px + 'px';
    div.style.top = p.py + 'px';
    div.style.width = p.pw + 'px';
    div.style.height = p.ph + 'px';
    if (p.slant) {
      const s = p.slant * p.pw;
      div.style.clipPath = `polygon(${s}px 0, 100% 0, calc(100% - ${s}px) 100%, 0 100%)`;
    }
    if (img) {
      const r = cropRect(img.naturalWidth, img.naturalHeight, p.pw, p.ph, p.slot.focus, p.slot.zoom);
      const bgW = (p.pw / r.sw) * img.naturalWidth;
      const bgH = (p.ph / r.sh) * img.naturalHeight;
      const bgX = (-r.sx / img.naturalWidth) * bgW;
      const bgY = (-r.sy / img.naturalHeight) * bgH;
      div.style.backgroundImage = `url("${p.slot.photo}")`;
      div.style.backgroundSize = `${bgW}px ${bgH}px`;
      div.style.backgroundPosition = `${bgX}px ${bgY}px`;
      div.style.filter = grade.filter;
    } else {
      div.classList.add('empty');
    }
    const tag = document.createElement('span');
    tag.className = 'role-tag';
    // Bottom-row panels sit under the furniture band, so their tag goes
    // at the top of the panel instead of the bottom.
    if (p.py + p.ph > H * 0.85) tag.classList.add('top');
    tag.textContent = p.role;
    div.appendChild(tag);
    if (p.hero) {
      const pop = document.createElement('span');
      pop.className = 'pop';
      pop.textContent = '★ HERO';
      div.appendChild(pop);
    }
    coverEl.appendChild(div);
    // The wash tint sits above the photo but below the tag.
    const wash = document.createElement('div');
    wash.className = 'wash';
    wash.style.cssText = `left:${p.px}px;top:${p.py}px;width:${p.pw}px;height:${p.ph}px;background:${grade.wash}`;
    coverEl.appendChild(wash);
  }
  if (!state.furniture) return;

  // Top bar: five gold stars + the press quote + the volume badge.
  const top = document.createElement('div');
  top.className = 'topbar';
  top.innerHTML =
    `<span class="stars">★★★★★</span>` +
    `<span class="press-quote">“${escapeHtml(state.quote || '')}” — ${escapeHtml(state.quoteSource || 'VICE CITY GAZETTE')}</span>` +
    `<span class="vol-badge">${escapeHtml(state.volume || 'VOL. 1')}</span>`;
  coverEl.appendChild(top);

  // The title, huge and central, overlapping the panels.
  const titleSize = Math.min(W * 0.16, (W * 0.94) / Math.max(4, (state.caption || 'SUNSET HEIST').length * 0.62));
  const band = document.createElement('div');
  band.className = 'title-band';
  band.style.top = `${H * 0.33}px`;
  const title = document.createElement('div');
  title.className = 'cover-title';
  title.style.fontSize = `${titleSize}px`;
  title.textContent = (state.caption || 'SUNSET HEIST').toUpperCase();
  const sub = document.createElement('div');
  sub.className = 'cover-sub';
  sub.style.fontSize = `${titleSize * 0.38}px`;
  sub.textContent = state.subtitle || '';
  band.appendChild(title);
  band.appendChild(sub);
  coverEl.appendChild(band);

  // Bottom furniture band: tagline, billing, COMING SOON, barcode, rosette.
  const foot = document.createElement('div');
  foot.className = 'foot';
  foot.innerHTML =
    `<span class="tagline">${escapeHtml(state.tagline || '')}</span>` +
    `<span class="billing">${escapeHtml(state.billing || '')}</span>` +
    `<span class="soon">COMING SOON</span>` +
    `<span class="barcode" aria-hidden="true"></span>` +
    `<span class="seal">★ ORIGINAL<br>COVER ART ★</span>`;
  coverEl.appendChild(foot);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Canvas export -----------------------------------------------------

// Draw the whole cover to a canvas at (W, H) and return the canvas.
// Uses the same panels, focus and zoom as the DOM preview.
export function drawCoverToCanvas(state, images, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;

  // Backdrop: the grade's sky gradient, so gaps read as sunset, not white.
  const sky = ctx.createLinearGradient(0, 0, W, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const panels = coverPanels(state, W, H);
  for (const p of panels) {
    const img = images[p.slot.photo];
    if (!img) continue;
    ctx.save();
    if (p.slant) {
      const s = p.slant * p.pw;
      ctx.beginPath();
      ctx.moveTo(p.px + s, p.py);
      ctx.lineTo(p.px + p.pw, p.py);
      ctx.lineTo(p.px + p.pw - s, p.py + p.ph);
      ctx.lineTo(p.px, p.py + p.ph);
      ctx.closePath();
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(p.px, p.py, p.pw, p.ph);
      ctx.clip();
    }
    if (p.hero) {
      // Pop-out hero: a white frame and a soft shadow around the panel.
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = W * 0.03;
      ctx.shadowOffsetY = W * 0.012;
    }
    const r = cropRect(img.naturalWidth, img.naturalHeight, p.pw, p.ph, p.slot.focus, p.slot.zoom);
    ctx.filter = grade.filter;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, p.px, p.py, p.pw, p.ph);
    ctx.filter = 'none';
    ctx.fillStyle = grade.wash;
    ctx.fillRect(p.px, p.py, p.pw, p.ph);
    // Panel frame.
    ctx.strokeStyle = p.hero ? '#ffffff' : 'rgba(255,255,255,0.75)';
    ctx.lineWidth = p.hero ? Math.max(3, W * 0.006) : Math.max(1.5, W * 0.0025);
    ctx.strokeRect(p.px, p.py, p.pw, p.ph);
    ctx.restore();

    // Role tag: bottom-left of the panel — except bottom-row panels, whose
    // tag goes at the top so the furniture band never covers it.
    const tagH = Math.max(18, H * 0.028);
    const tagPad = tagH * 0.45;
    ctx.font = `700 ${Math.round(tagH * 0.62)}px Anton, sans-serif`;
    const tw = ctx.measureText(p.role).width + tagPad * 2;
    const tx = p.px + Math.max(6, W * 0.012);
    const ty = p.py + p.ph > H * 0.85
      ? p.py + Math.max(6, H * 0.012)
      : p.py + p.ph - tagH - Math.max(6, H * 0.012);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(tx, ty, tw, tagH);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.role, tx + tagPad, ty + tagH / 2 + 1);
  }

  if (!state.furniture) return canvas;

  // Top bar: five gold stars + the press quote + the volume badge.
  const barH = H * 0.075;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.66)';
  ctx.fillRect(0, 0, W, barH);
  const starSize = Math.max(14, barH * 0.52);
  ctx.font = `${Math.round(starSize)}px Arial, sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', W * 0.03, barH / 2);
  const qSize = Math.max(13, H * 0.017);
  ctx.font = `italic 700 ${Math.round(qSize)}px Georgia, serif`;
  ctx.fillStyle = '#ffffff';
  const quote = `“${state.quote || ''}” — ${state.quoteSource || 'VICE CITY GAZETTE'}`;
  ctx.fillText(quote, W * 0.03 + starSize * 5.4, barH / 2, W * 0.68);
  ctx.font = `700 ${Math.round(qSize)}px Anton, sans-serif`;
  ctx.fillStyle = grade.accent;
  ctx.textAlign = 'right';
  ctx.fillText(state.volume || 'VOL. 1', W * 0.97, barH / 2);
  ctx.textAlign = 'left';

  // The title, huge and central, overlapping the panels: striped chrome
  // with a heavy outline and a 3D drop, so it reads at thumbnail size.
  const title = (state.caption || 'SUNSET HEIST').toUpperCase();
  const titleSize = Math.min(W * 0.16, (W * 0.94) / Math.max(4, title.length * 0.62));
  const cy = H * 0.44;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(titleSize)}px Anton, sans-serif`;
  // 3D depth: dark copies stacked below.
  ctx.fillStyle = 'rgba(20, 4, 30, 0.9)';
  for (let d = 9; d >= 3; d -= 3) {
    ctx.fillText(title, W / 2, cy + d);
  }
  // Striped chrome fill: hard-stop gradient bands (gold / pink / gold).
  const stripe = ctx.createLinearGradient(0, cy - titleSize / 2, 0, cy + titleSize / 2);
  stripe.addColorStop(0, '#fff8d6');
  stripe.addColorStop(0.42, '#ffd166');
  stripe.addColorStop(0.5, '#ff5e3a');
  stripe.addColorStop(0.58, '#ffd166');
  stripe.addColorStop(1, '#fff3c4');
  ctx.fillStyle = stripe;
  ctx.fillText(title, W / 2, cy);
  ctx.lineWidth = Math.max(2, titleSize * 0.035);
  ctx.strokeStyle = 'rgba(20,4,30,0.9)';
  ctx.strokeText(title, W / 2, cy);

  if (state.subtitle) {
    ctx.font = `${Math.round(titleSize * 0.4)}px Yellowtail, cursive`;
    ctx.fillStyle = grade.ink;
    ctx.fillText(state.subtitle, W / 2, cy + titleSize * 0.62);
  }

  // Bottom furniture band: tagline, billing, COMING SOON, barcode, rosette.
  const footTop = H * 0.86;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.72)';
  ctx.fillRect(0, footTop, W, H - footTop);
  ctx.textAlign = 'left';
  const tSize = Math.max(13, H * 0.018);
  ctx.font = `700 ${Math.round(tSize)}px Anton, sans-serif`;
  ctx.fillStyle = grade.ink;
  ctx.fillText(state.tagline || '', W * 0.03, footTop + tSize * 1.1);
  ctx.font = `${Math.round(tSize * 0.62)}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(state.billing || '', W * 0.03, footTop + tSize * 2.3, W * 0.58);

  // COMING SOON, in the bottom band (never on a photo).
  const soonSize = Math.max(13, H * 0.022);
  ctx.font = `700 ${Math.round(soonSize)}px Anton, sans-serif`;
  ctx.fillStyle = '#ff2e3e';
  ctx.fillText('COMING SOON', W * 0.03, H - tSize * 0.7);

  // Barcode, bottom-right of the band.
  const sealR = H * 0.048;
  const sx = W - sealR - W * 0.03;
  const sy = H - sealR - H * 0.028;
  const barX = sx - sealR * 2.6;
  const barW = sealR * 2.0;
  const codeH = sealR * 0.95;
  const barY = sy + sealR - codeH;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barX - 4, barY - 4, barW + 8, codeH + 8);
  let bx = barX;
  let seed = 7;
  ctx.fillStyle = '#111111';
  while (bx < barX + barW) {
    seed = (seed * 37 + 11) % 97;
    const bw = 1 + (seed % 4);
    if (seed % 3) ctx.fillRect(bx, barY, bw, codeH);
    bx += bw + 1 + (seed % 3);
  }

  // Rosette seal with words: a scalloped gold rosette, not a plain circle.
  ctx.save();
  ctx.translate(sx, sy);
  ctx.beginPath();
  const points = 14;
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? sealR : sealR * 0.86;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#d4af37';
  ctx.fill();
  ctx.lineWidth = Math.max(2, sealR * 0.07);
  ctx.strokeStyle = '#8a6d1b';
  ctx.stroke();
  ctx.fillStyle = '#3a2a00';
  ctx.font = `700 ${Math.round(sealR * 0.26)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ORIGINAL', 0, -sealR * 0.1);
  ctx.fillText('COVER ART', 0, sealR * 0.26);
  ctx.restore();

  return canvas;
}

// Download a canvas as a PNG file.
export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}
