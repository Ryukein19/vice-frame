// Vice Frame: wires the editor. Pick photos, choose a layout, crop each panel,
// tag each panel with a character role, write the caption, pick a grade and an
// export size, export the PNG. A `?shot=` query sets up a fixed scene for a
// screenshot instead (shots.js).
import { drawCover, ROLES } from './cover.js';
import { LAYOUTS, panelHit } from './layouts.js';
import { GRADES } from './grade.js';
import { runShot } from './shots.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** A fresh panel slot: no photo, default crop, role tag unassigned. */
function slot() {
  return { photo: null, scale: 1.15, dx: 0, dy: 0, role: null };
}

const state = {
  photos: [], // { img, name }
  // One slot per panel: which photo it shows, that panel's own crop, its role tag.
  slots: [slot(), slot(), slot(), slot()],
  layout: LAYOUTS['sunset-split'],
  layoutId: 'sunset-split',
  grade: GRADES.sunset,
  gradeId: 'sunset',
  caption: 'Vice Heist',
  subtitle: 'Leonida • 2026',
  quote: 'Pure Golden-Hour Mayhem',
  quoteSource: 'The Harbor Gazette',
  volume: 'Vol. 1',
  tagline: 'Five Friends • One Coast • No Way Back',
  billing: 'A Sunset Pictures Production • Starring You\nShot on Your Own Camera • Graded by Hand',
  furniture: true, // poster furniture: quote, volume badge, tagline, footer
  size: '1080x1080',
  selected: 0, // selected panel index
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state);
}

/** Keeps one slot per panel of the current layout, giving unassigned slots
 *  their default role tag (a cleared tag, '', stays hidden). */
function ensureSlots() {
  while (state.slots.length < state.layout.panels.length) state.slots.push(slot());
  state.slots.length = state.layout.panels.length;
  state.slots.forEach((s, i) => {
    if (s.role === null || s.role === undefined) s.role = ROLES[i % ROLES.length];
  });
}

function setSize(sizeId) {
  state.size = sizeId;
  const [w, h] = SIZES[sizeId];
  canvas.width = w;
  canvas.height = h;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === sizeId);
  });
  redraw();
}

function setLayout(layoutId) {
  state.layoutId = layoutId;
  state.layout = LAYOUTS[layoutId];
  state.selected = 0;
  ensureSlots();
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === layoutId);
  });
  renderPanelButtons();
  renderSliders();
  redraw();
}

function setGrade(gradeId) {
  state.gradeId = gradeId;
  state.grade = GRADES[gradeId];
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === gradeId);
  });
  redraw();
}

/** Adds a photo (already loaded) and fills the first empty panel with it. */
function addPhoto(img, name) {
  const photo = { img, name };
  state.photos.push(photo);
  const index = state.photos.length - 1;
  const empty = state.slots.findIndex((s) => s.photo === null);
  if (empty !== -1 && empty < state.layout.panels.length) {
    state.slots[empty] = { photo: index, scale: 1.15, dx: 0, dy: 0, role: state.slots[empty].role };
  }
  renderPhotos();
  renderSliders();
  redraw();
  return index;
}

/** Loads the sample photos (kit samples plus three originals) into the editor. */
async function loadSamples() {
  for (const name of ['pier', 'boulevard', 'neon', 'courier', 'getaway']) {
    if (state.photos.some((p) => p.name === name)) continue;
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      addPhoto(img, name);
    } catch { /* a missing sample never blocks the editor */ }
  }
  status.textContent = 'Sample photos loaded. Add your own photos any time.';
}

/** The photo chips: click one to put that photo in the selected panel. */
function renderPhotos() {
  const list = document.getElementById('photos');
  list.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = photo.name;
    chip.title = `Put ${photo.name} in panel ${state.selected + 1}`;
    chip.addEventListener('click', () => {
      const role = state.slots[state.selected].role;
      state.slots[state.selected] = { photo: i, scale: 1.15, dx: 0, dy: 0, role };
      renderSliders();
      redraw();
    });
    list.appendChild(chip);
  });
  const used = state.slots.filter((s) => s.photo !== null).length;
  document.getElementById('photo-count').textContent =
    `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'}, ${used} panel${used === 1 ? '' : 's'} filled`;
}

/** The panel picker: one button per panel of the current layout. */
function renderPanelButtons() {
  const row = document.getElementById('panels');
  row.innerHTML = '';
  state.layout.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-btn' + (i === state.selected ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => {
      state.selected = i;
      renderPanelButtons();
      renderSliders();
    });
    row.appendChild(b);
  });
}

/** Zoom / pan sliders and the role tag for the selected panel's photo. */
function renderSliders() {
  const slot = state.slots[state.selected];
  const photo = slot.photo !== null ? state.photos[slot.photo] : null;
  const zoom = document.getElementById('zoom');
  const panx = document.getElementById('panx');
  const pany = document.getElementById('pany');
  const label = document.getElementById('panel-label');
  label.textContent = photo
    ? `Panel ${state.selected + 1} — ${photo.name}`
    : `Panel ${state.selected + 1} — empty`;
  for (const [el, key, def] of [[zoom, 'scale', 1.15], [panx, 'dx', 0], [pany, 'dy', 0]]) {
    el.disabled = !photo;
    el.value = photo ? slot[key] : def;
  }
  document.getElementById('role').value = slot.role || '';
}

function bindSlider(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    const slot = state.slots[state.selected];
    if (slot.photo === null) return;
    slot[key] = Number(e.target.value);
    redraw();
  });
}

function bindText(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    redraw();
  });
}

/** Clicking the preview selects the panel under the pointer. */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = state.layout.panels.findIndex((p) =>
    panelHit(p, x, y, canvas.width, canvas.height));
  if (hit !== -1) {
    state.selected = hit;
    renderPanelButtons();
    renderSliders();
  }
});

document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'photo');
    } catch { /* unreadable file: skip it */ }
  }
  e.target.value = '';
});
document.getElementById('samples').addEventListener('click', loadSamples);
document.getElementById('fill-all').addEventListener('click', () => {
  if (!state.photos.length) return;
  state.layout.panels.forEach((_, i) => { state.slots[i].photo = 0; });
  renderSliders();
  redraw();
  status.textContent = 'One photo in every panel. Pick a photo chip to change a panel.';
});
document.querySelectorAll('[data-layout]').forEach((b) =>
  b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-grade]').forEach((b) =>
  b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('[data-size]').forEach((b) =>
  b.addEventListener('click', () => setSize(b.dataset.size)));
bindSlider('zoom', 'scale');
bindSlider('panx', 'dx');
bindSlider('pany', 'dy');
document.getElementById('role').addEventListener('input', (e) => {
  state.slots[state.selected].role = e.target.value;
  redraw();
});
bindText('caption', 'caption');
bindText('subtitle', 'subtitle');
bindText('quote', 'quote');
bindText('quote-source', 'quoteSource');
bindText('volume', 'volume');
bindText('tagline', 'tagline');
bindText('billing', 'billing');
document.getElementById('furniture').addEventListener('change', (e) => {
  state.furniture = e.target.checked;
  redraw();
});
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed. Try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-frame-${w}x${h}.png`;
  }, 'image/png');
});
document.getElementById('export-all').addEventListener('click', async () => {
  const btn = document.getElementById('export-all');
  btn.disabled = true;
  const current = state.size;
  for (const sizeId of Object.keys(SIZES)) {
    setSize(sizeId);
    const [w, h] = SIZES[sizeId];
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-frame-${w}x${h}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
  setSize(current);
  btn.disabled = false;
  status.textContent = 'Saved all three sizes.';
});

/** Sets up a fixed screenshot scene: loads the named samples, applies the
 *  layout/grade/size, and fits the canvas to the window for a cover shot. */
async function setupScene(scene) {
  if (scene.shot === 'cover') document.body.classList.add('shot-cover');
  setSize(scene.size);
  setLayout(scene.layout);
  setGrade(scene.grade);
  state.caption = scene.caption;
  state.subtitle = scene.subtitle;
  if (scene.quote !== undefined) state.quote = scene.quote;
  if (scene.quoteSource !== undefined) state.quoteSource = scene.quoteSource;
  if (scene.volume !== undefined) state.volume = scene.volume;
  if (scene.tagline !== undefined) state.tagline = scene.tagline;
  if (scene.billing !== undefined) state.billing = scene.billing;
  if (scene.furniture !== undefined) state.furniture = scene.furniture;
  document.getElementById('caption').value = state.caption;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('quote').value = state.quote;
  document.getElementById('quote-source').value = state.quoteSource;
  document.getElementById('volume').value = state.volume;
  document.getElementById('tagline').value = state.tagline;
  document.getElementById('billing').value = state.billing;
  document.getElementById('furniture').checked = state.furniture;
  if (scene.roles) {
    scene.roles.forEach((r, i) => {
      if (state.slots[i]) state.slots[i].role = r;
    });
  }
  for (const name of scene.photos) {
    if (state.photos.some((p) => p.name === name)) continue;
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      addPhoto(img, name);
    } catch { /* keep going with the photos that loaded */ }
  }
  // Spread the photos across the panels in order, first photo first. A photo
  // repeated in another panel gets its own crop, so no two panels match.
  // A portrait photo in a wider panel is panned up (faces sit high in a
  // portrait) and kept centred sideways, so the face survives the crop.
  state.layout.panels.forEach((_, i) => {
    const slot = state.slots[i];
    if (state.photos.length) {
      slot.photo = i % state.photos.length;
      slot.scale = 1.15 + (i % 2) * 0.2;
      const photo = state.photos[slot.photo];
      const panel = state.layout.panels[i];
      const panelAR = (panel.w * canvas.width) / (panel.h * canvas.height);
      const photoAR = photo.img.naturalWidth / photo.img.naturalHeight;
      if (photoAR < panelAR) {
        slot.dx = 0;
        slot.dy = 0.15;
      } else {
        slot.dx = ((i % 3) - 1) * 0.14;
        slot.dy = 0;
      }
    } else {
      slot.photo = null;
    }
  });
  renderPhotos();
  renderSliders();
  redraw();
  if (scene.shot === 'cover') fitCanvasToWindow();
}

/** In a cover shot the canvas fills the window, keeping its aspect. */
function fitCanvasToWindow() {
  const scale = Math.min(
    window.innerWidth / canvas.width,
    window.innerHeight / canvas.height,
  );
  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
}

// Shot mode, or the live editor.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { setupScene });
} else {
  setSize(state.size);
  setLayout(state.layoutId);
  setGrade(state.gradeId);
  renderPanelButtons();
  renderPhotos();
  renderSliders();
  // Anton for the poster lettering, Yellowtail for the script subtitle; the
  // editor still works if a font never arrives.
  Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('60px Yellowtail'),
  ]).catch(() => {}).finally(redraw);
  document.fonts.ready.then(redraw).catch(() => {});
  loadSamples();
}
