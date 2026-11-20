// Vice Frame: the editor. Owns the cover state (layout, grade, one slot per
// panel, the caption and the poster furniture), wires every control on the
// page, and exports the cover as a PNG in the three post sizes. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawViceCover } from './cover.js';
import { runShot } from './shots.js';
import { LAYOUTS, layoutById, panelAt, panelCount } from './layouts.js';
import { GRADES, gradeById } from './grade.js';

const SAMPLES = ['pier', 'boulevard', 'neon', 'courier', 'getaway'];
const ROLE_IDEAS = ['THE INSIDER', 'THE BOSS', 'THE DRIVER', 'THE LOOKOUT', 'THE FIXER'];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');

// One slot per panel the widest layout shows. A layout that shows fewer
// simply leaves the later slots undrawn; their photos are kept when the
// layout changes back.
function freshSlots() {
  return Array.from({ length: 5 }, (_, i) => ({
    img: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    role: ROLE_IDEAS[i % ROLE_IDEAS.length],
  }));
}

const state = {
  layout: 'grid',
  grade: 'sunset',
  panels: freshSlots(),
  selected: 0,
  caption: 'Sunset Heist',
  subtitle: 'Vice City',
  quote: 'The city never sleeps. Neither do we.',
  volume: '1',
  tagline: 'Every empire starts with one job',
  billing: 'A Vice Frame original · Made with photos on your own machine',
  furniture: true,
};

function redraw() {
  drawViceCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function say(message) {
  statusEl.textContent = message;
}

// --- pickers ---------------------------------------------------------------

function buildPickers() {
  const layoutBox = document.getElementById('layout-pick');
  for (const entry of LAYOUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick';
    button.dataset.layout = entry.id;
    button.textContent = entry.name;
    button.title = entry.blurb;
    button.addEventListener('click', () => {
      state.layout = entry.id;
      state.selected = 0;
      syncPickers();
      syncPanelControls();
      redraw();
    });
    layoutBox.append(button);
  }
  const gradeBox = document.getElementById('grade-pick');
  for (const entry of GRADES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick';
    button.dataset.grade = entry.id;
    button.textContent = entry.name;
    button.addEventListener('click', () => {
      state.grade = entry.id;
      syncPickers();
      redraw();
    });
    gradeBox.append(button);
  }
}

function syncPickers() {
  for (const button of document.querySelectorAll('#layout-pick .pick')) {
    button.classList.toggle('on', button.dataset.layout === state.layout);
  }
  for (const button of document.querySelectorAll('#grade-pick .pick')) {
    button.classList.toggle('on', button.dataset.grade === state.grade);
  }
  const layoutName = document.getElementById('layout-name');
  if (layoutName) layoutName.textContent = layoutById(state.layout).name;
  const gradeName = document.getElementById('grade-name');
  if (gradeName) gradeName.textContent = gradeById(state.grade).name;
}

// --- the selected panel -----------------------------------------------------

function selectedSlot() {
  return state.panels[state.selected];
}

function syncPanelControls() {
  const slot = selectedSlot();
  panelLabel.textContent = `Panel ${state.selected + 1} of ${panelCount(state.layout)} — ${slot.role}`;
  document.getElementById('zoom').value = String(slot.zoom);
  document.getElementById('panx').value = String(slot.panX);
  document.getElementById('pany').value = String(slot.panY);
  document.getElementById('role').value = slot.role;
}

function selectPanel(index) {
  state.selected = index;
  syncPanelControls();
}

canvas.addEventListener('click', (event) => {
  const box = canvas.getBoundingClientRect();
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  const px = (event.clientX - box.left) * scaleX;
  const py = (event.clientY - box.top) * scaleY;
  // The panels own the top four-fifths while the furniture is on, exactly
  // as drawViceCover lays them out; hit-test against that same area.
  const panelH = state.furniture ? canvas.height * 0.80 : canvas.height;
  const hit = panelAt(state.layout, canvas.width, panelH, px, py);
  if (hit >= 0) {
    selectPanel(hit);
    say(`Panel ${hit + 1} selected — ${selectedSlot().role}`);
  }
});

// --- photo, crop and role ---------------------------------------------------

document.getElementById('photo').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    selectedSlot().img = await loadImage(URL.createObjectURL(file));
    redraw();
    say(`Photo loaded into panel ${state.selected + 1}.`);
  } catch {
    say('That file could not be read as a photo.');
  }
  event.target.value = '';
});

document.getElementById('load-samples').addEventListener('click', async () => {
  for (let i = 0; i < state.panels.length; i++) {
    try {
      state.panels[i].img = await loadImage(`samples/${SAMPLES[i % SAMPLES.length]}.jpg`);
    } catch {
      // A missing sample leaves its panel empty rather than stopping the rest.
    }
  }
  redraw();
  say('Samples loaded — pick a panel and crop it.');
});

function bindCrop() {
  document.getElementById('zoom').addEventListener('input', (event) => {
    selectedSlot().zoom = Number(event.target.value);
    redraw();
  });
  document.getElementById('panx').addEventListener('input', (event) => {
    selectedSlot().panX = Number(event.target.value);
    redraw();
  });
  document.getElementById('pany').addEventListener('input', (event) => {
    selectedSlot().panY = Number(event.target.value);
    redraw();
  });
  document.getElementById('role').addEventListener('input', (event) => {
    selectedSlot().role = event.target.value;
    syncPanelControls();
    redraw();
  });
}

// --- caption and poster furniture -------------------------------------------

function bindText() {
  const fields = ['caption', 'subtitle', 'quote', 'volume', 'tagline', 'billing'];
  for (const name of fields) {
    const input = document.getElementById(name);
    input.value = state[name];
    input.addEventListener('input', (event) => {
      state[name] = event.target.value;
      redraw();
    });
  }
  const furniture = document.getElementById('furniture');
  furniture.checked = state.furniture;
  furniture.addEventListener('change', (event) => {
    state.furniture = event.target.checked;
    redraw();
    say(state.furniture ? 'Poster furniture on.' : 'Clean cover — furniture off.');
  });
}

// --- export -----------------------------------------------------------------

function renderAt(width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawViceCover(off, state);
  return off;
}

function downloadPng(off, name) {
  off.toBlob((blob) => {
    if (!blob) {
      say('Export failed — the browser could not make the PNG.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say(`Saved ${name}`);
  }, 'image/png');
}

const SIZES = [
  { label: '1080 x 1080', w: 1080, h: 1080, name: 'vice-frame-1080x1080.png' },
  { label: '1080 x 1350', w: 1080, h: 1350, name: 'vice-frame-1080x1350.png' },
  { label: '1920 x 1080', w: 1920, h: 1080, name: 'vice-frame-1920x1080.png' },
];

function bindExport() {
  document.getElementById('export-square').addEventListener('click', () => {
    downloadPng(renderAt(1080, 1080), SIZES[0].name);
  });
  document.getElementById('export-portrait').addEventListener('click', () => {
    downloadPng(renderAt(1080, 1350), SIZES[1].name);
  });
  document.getElementById('export-wide').addEventListener('click', () => {
    downloadPng(renderAt(1920, 1080), SIZES[2].name);
  });
  document.getElementById('export-all').addEventListener('click', () => {
    for (const size of SIZES) downloadPng(renderAt(size.w, size.h), size.name);
    say('Exported all three sizes.');
  });
}

// --- boot -------------------------------------------------------------------

buildPickers();
syncPickers();
bindCrop();
bindText();
bindExport();
syncPanelControls();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    // A cover shot fills the frame; match the canvas backing store to the
    // viewport's shape so the poster is not stretched.
    if (shot === 'cover') {
      const aspect = window.innerWidth / window.innerHeight;
      if (aspect < 0.98) {
        canvas.width = 1080;
        canvas.height = Math.round(1080 / aspect);
      } else if (aspect > 1.02) {
        canvas.height = 1080;
        canvas.width = Math.round(1080 * aspect);
      }
    }
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.caption = scene.caption;
    state.subtitle = scene.subtitle;
    state.quote = scene.quote;
    state.volume = scene.volume;
    state.tagline = scene.tagline;
    state.billing = scene.billing;
    state.furniture = scene.furniture;
    for (let i = 0; i < state.panels.length; i++) {
      const name = scene.photos[i % scene.photos.length];
      try {
        state.panels[i].img = await loadImage(`samples/${name}.jpg`);
      } catch {
        state.panels[i].img = null;
      }
      state.panels[i].role = scene.roles[i % scene.roles.length];
    }
    state.selected = 0;
    syncPickers();
    syncPanelControls();
    for (const name of ['caption', 'subtitle', 'quote', 'volume', 'tagline', 'billing']) {
      document.getElementById(name).value = state[name];
    }
    document.getElementById('furniture').checked = state.furniture;
    redraw();
  });
} else {
  redraw();
}
