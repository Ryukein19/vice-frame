// Vice Frame editor: loads the samples, renders the live cover preview (the same
// renderCover the PNG export uses), and wires the layout, grade, caption, photo
// and per-panel focus controls.
import { renderCover, exportPNG } from './render.js';
import { GRADES } from './grades.js';
import { LAYOUTS } from './layouts.js';
import { faceAwareCrop } from './crop.js';
import { SAMPLES } from './samples.js';
import { runShot } from './shots.js';

const state = {
  layout: 'mosaic',
  grade: 'sunset',
  caption: 'SUNSET HEIST',
  subtitle: 'a vice city story',
  quote: 'THE HOTTEST RIDE OF THE YEAR',
  images: {},
  focus: {},
  tags: {},
};
let selectedPhoto = 'face';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
}

function render() {
  renderCover(ctx, state, canvas.width, canvas.height);
}

/** Loads one image from a URL. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** Loads all five sample photos and measures each one's focus point. */
async function loadSamples() {
  for (const sample of SAMPLES) {
    const img = await loadImage(`samples/${sample.file}`);
    state.images[sample.key] = img;
    state.focus[sample.key] = faceAwareCrop(img, sample.focus);
    state.tags[sample.key] = sample.tag;
  }
  setStatus('Sample photos loaded. Click a panel to select it, then crop it.');
}

/** Builds the layout and grade picker buttons. */
function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = layout.name;
    b.dataset.key = layout.key;
    b.addEventListener('click', () => {
      state.layout = layout.key;
      layoutBox.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
    if (layout.key === state.layout) b.classList.add('active');
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grades');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = grade.name;
    b.dataset.key = grade.key;
    b.addEventListener('click', () => {
      state.grade = grade.key;
      gradeBox.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
    if (grade.key === state.grade) b.classList.add('active');
    gradeBox.appendChild(b);
  }
}

/** Builds the sample-photo thumbnails. Clicking one loads it into the selected panel. */
function buildThumbs() {
  const box = document.getElementById('samples');
  for (const sample of SAMPLES) {
    const img = document.createElement('img');
    img.src = `samples/${sample.file}`;
    img.alt = sample.tag;
    img.title = `${sample.tag} — click to put this photo in the selected panel`;
    img.addEventListener('click', async () => {
      const loaded = await loadImage(`samples/${sample.file}`);
      state.images[sample.key] = loaded;
      state.focus[sample.key] = faceAwareCrop(loaded, sample.focus);
      state.tags[sample.key] = sample.tag;
      render();
      setStatus(`${sample.tag} loaded into the selected panel.`);
    });
    box.appendChild(img);
  }
}

/** Finds which layout panel a click on the preview canvas landed in. */
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  const layout = LAYOUTS.find((l) => l.key === state.layout);
  return layout.panels.find((p) => fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) || null;
}

function wireEditor() {
  const captionInput = document.getElementById('caption');
  const subtitleInput = document.getElementById('subtitle');
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value.toUpperCase() || 'SUNSET HEIST';
    render();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value || 'a vice city story';
    render();
  });

  const zoomInput = document.getElementById('zoom');
  const roleInput = document.getElementById('role');
  const selectedLabel = document.getElementById('selectedLabel');

  canvas.addEventListener('click', (ev) => {
    const panel = panelAt(ev.clientX, ev.clientY);
    if (!panel) return;
    selectedPhoto = panel.photo;
    const focus = state.focus[selectedPhoto];
    zoomInput.value = focus ? focus.zoom : 1;
    roleInput.value = state.tags[selectedPhoto] || panel.tag;
    selectedLabel.textContent = `Selected: ${state.tags[selectedPhoto] || panel.tag} (${panel.photo}).`;
  });

  zoomInput.addEventListener('input', () => {
    const focus = state.focus[selectedPhoto];
    if (focus) focus.zoom = Number(zoomInput.value);
    render();
  });

  document.getElementById('autofocus').addEventListener('click', () => {
    const img = state.images[selectedPhoto];
    if (!img) return;
    const sample = SAMPLES.find((s) => s.key === selectedPhoto);
    state.focus[selectedPhoto] = faceAwareCrop(img, sample ? sample.focus : null);
    zoomInput.value = state.focus[selectedPhoto].zoom;
    render();
    setStatus(`Auto-focus set for ${state.tags[selectedPhoto]}.`);
  });

  roleInput.addEventListener('input', () => {
    state.tags[selectedPhoto] = roleInput.value.toUpperCase();
    render();
  });

  document.getElementById('upload').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    state.images[selectedPhoto] = img;
    state.focus[selectedPhoto] = faceAwareCrop(img, null);
    render();
    setStatus(`Your photo is in the ${state.tags[selectedPhoto]} panel.`);
  });

  document.getElementById('loadSamples').addEventListener('click', async () => {
    await loadSamples();
    render();
  });

  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      exportPNG(state, w, h);
      setStatus(`Exported ${w} × ${h} PNG.`);
    });
  });
  document.getElementById('exportAll').addEventListener('click', () => {
    [[1080, 1080], [1080, 1350], [1920, 1080]].forEach(([w, h], i) => {
      setTimeout(() => exportPNG(state, w, h), i * 400);
    });
    setStatus('Exported all three PNG sizes.');
  });
}

async function boot() {
  buildPickers();
  buildThumbs();
  wireEditor();
  // Fonts must be in before the first render, or the canvas falls back to a
  // system font and the title looks wrong.
  await Promise.all([
    document.fonts.load('40px Anton'),
    document.fonts.load('40px Yellowtail'),
    document.fonts.ready,
  ]);
  await loadSamples();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    const ran = await runShot(shot, query, async (opts) => {
      state.layout = opts.layout;
      state.grade = opts.grade;
      state.caption = opts.caption;
      state.subtitle = opts.subtitle;
      if (opts.shot === 'cover') {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      render();
    });
    if (ran) return;
  }
  render();
  setStatus('Ready — pick a layout and a grade, then export your cover.');
}

boot().catch((err) => {
  setStatus(`Could not start: ${err.message}`);
  console.error(err);
});
