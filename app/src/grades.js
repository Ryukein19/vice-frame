// Vice Frame — colour grades.
// A grade re-colours the whole cover. Each grade carries:
//   filter  — a CSS filter applied to every panel photo (and to the canvas
//             export through ctx.filter), so the grade is baked into the PNG.
//   wash    — a translucent overlay tint laid over the panels.
//   sky     — the two colours of the gradient behind the title band.
//   accent  — the colour of the role tags, seals and stamps for this grade.
//   ink     — the title's base colour.
// Grades are tuned so a photo reads as a Vice City sunset or a neon night.

export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02) sepia(0.22) hue-rotate(-8deg)',
    wash: 'rgba(255, 110, 60, 0.14)',
    sky: ['#ff9a3d', '#e83e8c'],
    accent: '#ff5e3a',
    ink: '#fff3d6',
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.7) contrast(1.15) brightness(0.98) hue-rotate(12deg)',
    wash: 'rgba(255, 0, 128, 0.16)',
    sky: ['#ff2e88', '#7b2ff7'],
    accent: '#ff2e88',
    ink: '#ffe9f6',
  },
  palm: {
    name: 'Palm',
    filter: 'saturate(1.25) contrast(1.05) brightness(1.06) sepia(0.12) hue-rotate(-14deg)',
    wash: 'rgba(255, 190, 80, 0.12)',
    sky: ['#ffc46b', '#ff7a59'],
    accent: '#ffb347',
    ink: '#fff8e7',
  },
  night: {
    name: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.22) brightness(0.88) hue-rotate(18deg)',
    wash: 'rgba(40, 20, 160, 0.22)',
    sky: ['#1b1b4b', '#c2188b'],
    accent: '#00e5ff',
    ink: '#eaf6ff',
  },
  golden: {
    name: 'Golden Hour',
    filter: 'saturate(1.4) contrast(1.06) brightness(1.08) sepia(0.35) hue-rotate(-6deg)',
    wash: 'rgba(255, 170, 40, 0.18)',
    sky: ['#ffd166', '#f4842c'],
    accent: '#ffaa1d',
    ink: '#fff6d8',
  },
  teal: {
    name: 'Tropic Teal',
    filter: 'saturate(1.45) contrast(1.1) brightness(1.0) hue-rotate(28deg)',
    wash: 'rgba(0, 200, 180, 0.14)',
    sky: ['#00c9a7', '#005f73'],
    accent: '#00e5b0',
    ink: '#eafff6',
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'palm', 'night', 'golden', 'teal'];

// A soft vertical gradient used behind the title so the lettering stays
// readable over any photo.
export function titleShade(ctx, W, bandH, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, bandH);
  g.addColorStop(0, 'rgba(10, 6, 24, 0.72)');
  g.addColorStop(0.7, 'rgba(10, 6, 24, 0.28)');
  g.addColorStop(1, 'rgba(10, 6, 24, 0)');
  return g;
}
