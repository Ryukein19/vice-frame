// Vice Frame — the app.
// A multi-panel GTA-style cover studio. The state holds the layout, the
// grade, the poster words and one slot per panel (photo, focus, zoom, role).
// The cover preview is a DOM render (render.js); the PNG export draws the
// same cover to a canvas. Photos are read on the user's own machine and
// never leave it.

import { LAYOUTS, LAYOUT_ORDER } from './layouts.js';
import { GRADES, GRADE_ORDER } from './grades.js';
import { defaultFocus, faceAwareCrop, nudgeFocus } from './crop.js';
import { SIZES, renderCoverDOM, drawCoverToCanvas, downloadCanvas } from './render.js';
import { shotParams, applyShot, markReady } from './shots.js';

export const SAMPLES = [
  { file: 'face.jpg', name: 'The Fixer', role: 'THE FIXER' },
  { file: 'courier.jpg', name: 'Courier', role: 'THE DRIVER' },
  { file: 'neon.jpg', name: 'Neon Street', role: 'THE HIDEOUT' },
  { file: 'getaway.jpg', name: 'Getaway', role: 'THE GETAWAY' },
  { file: 'pier.jpg', name: 'Pier', role: 'THE INSIDER' },
  { file: 'boulevard.jpg', name: 'Boulevard', role: 'OCEAN DRIVE' },
];

export const ROLES = ['THE INSIDER', 'THE BOSS', 'THE DRIVER', 'THE LOOKOUT', 'THE FIXER', 'THE CLEANER', 'THE WHEELMAN'];

export function freshState() {
  return {
    layout: 'mosaic',
    grade: 'sunset',
    caption: 'SUNSET HEIST',
    subtitle: 'a vice city story',
    quote: 'THE HOTTEST RIDE OF THE YEAR',
    quoteSource: 'VICE CITY GAZETTE',
    volume: 'VOL. 1',
    tagline: 'EVERY SUNSET HAS A PRICE',
    billing: 'VICE FRAME PICTURES  •  A SUNSET HEIST  •  STARRING YOU — SHOT ON YOUR OWN CAMERA  •  COMING SOON',
    furniture: true,
    selected: 0,
    panels: SAMPLES.map((s) => ({
      photo: `samples/${s.file}`,
      focus: defaultFocus(),
      zoom: 1,
      role: s.role,
    })),
  };
}

export const state = freshState();

// Loaded <img> elements, keyed by photo path.
const images = {};
let coverEl = null;
let sizeKey = 'square';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + url));
    img.src = url;
  });
}

async function ensureImage(path) {
  if (images[path]) return images[path];
  const img = await loadImage(path);
  images[path] = img;
  return img;
}

async function ensureAll() {
  // Load every panel photo, then face-aware-crop each one by default, so
  // every panel already centres its subject before the user touches it.
  const jobs = state.panels
    .map((p) => p.photo)
    .filter(Boolean)
    .map((path) => ensureImage(path).catch(() => null));
  await Promise.all(jobs);
  for (const p of state.panels) {
    const img = images[p.photo];
    if (img && !p.focusSet) {
      p.focus = faceAwareCrop(img);
      p.focusSet = true;
    }
  }
}

function redraw() {
  if (!coverEl) return;
  renderCoverDOM(coverEl, state, images);
  syncEditor();
  document.body.dataset.layout = state.layout;
  document.body.dataset.grade = state.grade;
}

// --- editor panel -------------------------------------------------------

function syncEditor() {
  const sel = state.panels[state.selected] ?? state.panels[0];
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  set('ed-zoom', sel.zoom);
  set('ed-role', sel.role);
  const zoomOut = document.getElementById('ed-zoom-out');
  if (zoomOut) zoomOut.textContent = `${sel.zoom.toFixed(1)}×`;
  const cap = document.getElementById('ed-caption');
  if (cap) cap.value = state.caption;
  const sub = document.getElementById('ed-subtitle');
  if (sub) sub.value = state.subtitle;
  const quo = document.getElementById('ed-quote');
  if (quo) quo.value = state.quote;
  const qsrc = document.getElementById('ed-quote-source');
  if (qsrc) qsrc.value = state.quoteSource;
  const vol = document.getElementById('ed-volume');
  if (vol) vol.value = state.volume;
  const tag = document.getElementById('ed-tagline');
  if (tag) tag.value = state.tagline;
  const bil = document.getElementById('ed-billing');
  if (bil) bil.value = state.billing;
  const furn = document.getElementById('ed-furniture');
  if (furn) furn.checked = state.furniture;
  document.querySelectorAll('.panel-slot').forEach((el, i) => {
    el.classList.toggle('selected', i === state.selected);
  });
}

function buildPickers() {
  const layoutBox = document.getElementById('layout-picker');
  LAYOUT_ORDER.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick layout-pick';
    b.dataset.layout = id;
    b.textContent = LAYOUTS[id].name;
    b.title = LAYOUTS[id].blurb;
    b.addEventListener('click', () => {
      state.layout = id;
      redraw();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = document.getElementById('grade-picker');
  GRADE_ORDER.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick grade-pick';
    b.dataset.grade = id;
    b.textContent = GRADES[id].name;
    b.style.setProperty('--swatch', GRADES[id].accent);
    b.addEventListener('click', () => {
      state.grade = id;
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const slotBox = document.getElementById('panel-slots');
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick panel-slot';
    b.dataset.slot = i;
    b.textContent = `Panel ${i + 1} — ${p.role}`;
    b.addEventListener('click', () => {
      state.selected = i;
      redraw();
    });
    slotBox.appendChild(b);
  });
  const sampleBox = document.getElementById('sample-picker');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick sample-pick';
    b.textContent = s.name;
    b.addEventListener('click', async () => {
      const slot = state.panels[state.selected];
      slot.photo = `samples/${s.file}`;
      slot.role = s.role;
      await ensureImage(slot.photo).catch(() => null);
      redraw();
    });
    sampleBox.appendChild(b);
  });
}

function buildEditor() {
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => fn(e.target.value));
  };
  bind('ed-caption', (v) => { state.caption = v.toUpperCase(); redraw(); });
  bind('ed-subtitle', (v) => { state.subtitle = v; redraw(); });
  bind('ed-quote', (v) => { state.quote = v; redraw(); });
  bind('ed-quote-source', (v) => { state.quoteSource = v; redraw(); });
  bind('ed-volume', (v) => { state.volume = v; redraw(); });
  bind('ed-tagline', (v) => { state.tagline = v; redraw(); });
  bind('ed-billing', (v) => { state.billing = v; redraw(); });
  bind('ed-role', (v) => {
    const slot = state.panels[state.selected];
    slot.role = v.toUpperCase();
    const btn = document.querySelector(`.panel-slot[data-slot="${state.selected}"]`);
    if (btn) btn.textContent = `Panel ${state.selected + 1} — ${slot.role}`;
    redraw();
  });
  bind('ed-zoom', (v) => {
    state.panels[state.selected].zoom = Number(v);
    redraw();
  });
  const furn = document.getElementById('ed-furniture');
  if (furn) furn.addEventListener('change', (e) => { state.furniture = e.target.checked; redraw(); });

  const focusBtn = document.getElementById('ed-autofocus');
  if (focusBtn) focusBtn.addEventListener('click', async () => {
    const slot = state.panels[state.selected];
    const img = images[slot.photo];
    if (!img) return;
    slot.focus = faceAwareCrop(img);
    slot.focusSet = true;
    redraw();
  });

  // Arrow keys nudge the selected panel's focus; = / - zoom.
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const slot = state.panels[state.selected];
    const step = 0.04;
    if (e.key === 'ArrowLeft') slot.focus = nudgeFocus(slot.focus, -step, 0);
    else if (e.key === 'ArrowRight') slot.focus = nudgeFocus(slot.focus, step, 0);
    else if (e.key === 'ArrowUp') slot.focus = nudgeFocus(slot.focus, 0, -step);
    else if (e.key === 'ArrowDown') slot.focus = nudgeFocus(slot.focus, 0, step);
    else if (e.key === '=' || e.key === '+') slot.zoom = Math.min(3, slot.zoom + 0.1);
    else if (e.key === '-') slot.zoom = Math.max(1, slot.zoom - 0.1);
    else return;
    e.preventDefault();
    redraw();
  });

  // Click a panel in the preview to select it; drag on it to move focus.
  coverEl.addEventListener('click', (e) => {
    const panel = e.target.closest('.panel');
    if (!panel) return;
    const idx = Number(panel.dataset.panel.replace('p', ''));
    if (!Number.isNaN(idx)) {
      state.selected = idx;
      redraw();
    }
  });
  let dragging = null;
  coverEl.addEventListener('pointerdown', (e) => {
    const panel = e.target.closest('.panel');
    if (!panel) return;
    dragging = { idx: Number(panel.dataset.panel.replace('p', '')), x: e.clientX, y: e.clientY };
    coverEl.setPointerCapture(e.pointerId);
  });
  coverEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const slot = state.panels[dragging.idx];
    const rect = coverEl.getBoundingClientRect();
    slot.focus = nudgeFocus(slot.focus, (e.clientX - dragging.x) / rect.width, (e.clientY - dragging.y) / rect.height);
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    redraw();
  });
  coverEl.addEventListener('pointerup', () => { dragging = null; });

  // Size picker: square / portrait / wide changes the cover's aspect.
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      sizeKey = b.dataset.size;
      const s = SIZES[sizeKey];
      coverEl.style.aspectRatio = `${s.w} / ${s.h}`;
      redraw();
    });
  });

  // Export buttons.
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportSize(b.dataset.export));
  });
  const all = document.getElementById('export-all');
  if (all) all.addEventListener('click', () => {
    for (const key of Object.keys(SIZES)) exportSize(key);
  });
}

async function exportSize(key) {
  const s = SIZES[key];
  await ensureAll();
  const canvas = drawCoverToCanvas(state, images, s.w, s.h);
  downloadCanvas(canvas, `vice-frame-${s.w}x${s.h}.png`);
  const status = document.getElementById('status');
  if (status) status.textContent = `Saved vice-frame-${s.w}x${s.h}.png`;
}

// --- photo upload -------------------------------------------------------

function buildUpload() {
  const input = document.getElementById('photo');
  if (!input) return;
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const slot = state.panels[state.selected];
    slot.photo = url;
    slot.focus = defaultFocus();
    try {
      const img = await loadImage(url);
      images[url] = img;
      slot.focus = faceAwareCrop(img);
      slot.focusSet = true;
    } catch {
      // Keep the photo; the panel just stays empty until it loads.
    }
    redraw();
  });
  const loadBtn = document.getElementById('load-samples');
  if (loadBtn) loadBtn.addEventListener('click', async () => {
    state.panels.forEach((p, i) => {
      p.photo = `samples/${SAMPLES[i].file}`;
      p.role = SAMPLES[i].role;
      p.focus = defaultFocus();
      p.zoom = 1;
    });
    await ensureAll();
    redraw();
  });
}

// --- boot ---------------------------------------------------------------

export async function boot() {
  coverEl = document.getElementById('cover');
  buildPickers();
  buildEditor();
  buildUpload();
  const params = shotParams();
  const inShot = applyShot(state, params);
  await ensureAll();
  redraw();
  if (inShot) {
    document.body.classList.add('shot');
    if (params.shot === 'cover' || params.shot === 'wide' || params.shot === 'portrait') {
      document.body.classList.add('shot-cover');
      if (params.shot === 'wide') sizeKey = 'wide';
      if (params.shot === 'portrait') sizeKey = 'portrait';
      const s = SIZES[sizeKey];
      coverEl.style.aspectRatio = `${s.w} / ${s.h}`;
      redraw();
    }
    // Let the fonts and images settle, then signal readiness.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(() => markReady(params.shot), 120);
    }));
  }
}

boot();
