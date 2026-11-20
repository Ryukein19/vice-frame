// Colour grades for the Vice Frame cover. A grade is a canvas filter the
// panels are painted through, a two-stop tint washed over them, and a glow
// colour used for the title's halo and the furniture accents. The names are
// the Vice City moods: a sunset, a neon night, palm shade, golden hour and
// the tropics.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.25) contrast(1.06) sepia(0.18)',
    tintTop: 'rgba(255, 122, 64, 0.10)',
    tintBottom: 'rgba(198, 38, 118, 0.48)',
    glow: '#ff7a40',
  },
  {
    id: 'neon',
    name: 'Neon',
    filter: 'saturate(1.55) contrast(1.16) hue-rotate(-12deg)',
    tintTop: 'rgba(255, 45, 149, 0.16)',
    tintBottom: 'rgba(28, 220, 255, 0.34)',
    glow: '#ff2d95',
  },
  {
    id: 'palm',
    name: 'Palm',
    filter: 'saturate(1.32) contrast(1.05) hue-rotate(14deg)',
    tintTop: 'rgba(64, 224, 160, 0.12)',
    tintBottom: 'rgba(8, 120, 90, 0.42)',
    glow: '#40e0a0',
  },
  {
    id: 'night',
    name: 'Neon Night',
    filter: 'brightness(0.92) saturate(1.65) contrast(1.22) hue-rotate(18deg)',
    tintTop: 'rgba(90, 40, 200, 0.20)',
    tintBottom: 'rgba(10, 8, 48, 0.55)',
    glow: '#8a5cff',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'sepia(0.38) saturate(1.42) contrast(1.06)',
    tintTop: 'rgba(255, 196, 66, 0.14)',
    tintBottom: 'rgba(214, 110, 24, 0.44)',
    glow: '#ffc442',
  },
  {
    id: 'teal',
    name: 'Tropic Teal',
    filter: 'saturate(1.38) contrast(1.08) hue-rotate(24deg)',
    tintTop: 'rgba(45, 226, 216, 0.12)',
    tintBottom: 'rgba(6, 90, 120, 0.46)',
    glow: '#2de2d8',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    filter: 'brightness(0.9) saturate(1.5) contrast(1.2) hue-rotate(30deg)',
    tintTop: 'rgba(40, 60, 180, 0.16)',
    tintBottom: 'rgba(12, 8, 40, 0.55)',
    glow: '#6a7cff',
  },
  {
    id: 'coral',
    name: 'Coral',
    filter: 'saturate(1.5) contrast(1.08) hue-rotate(-8deg) sepia(0.12)',
    tintTop: 'rgba(255, 127, 110, 0.14)',
    tintBottom: 'rgba(200, 60, 90, 0.46)',
    glow: '#ff7f6e',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    filter: 'saturate(0.35) contrast(1.35) brightness(1.05)',
    tintTop: 'rgba(220, 225, 235, 0.12)',
    tintBottom: 'rgba(90, 100, 120, 0.45)',
    glow: '#c8d0dc',
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    filter: 'saturate(1.6) contrast(1.12) hue-rotate(-28deg)',
    tintTop: 'rgba(255, 110, 190, 0.15)',
    tintBottom: 'rgba(20, 160, 170, 0.42)',
    glow: '#ff6ebe',
  },
];

/** The grade record for an id, falling back to Sunset when unknown. */
export function gradeById(id) {
  return GRADES.find((entry) => entry.id === id) ?? GRADES[0];
}

/** The canvas filter string a grade paints its panels through. */
export function gradeFilter(id) {
  return gradeById(id).filter;
}

/** The two tint stops a grade washes from a panel's top to its foot. */
export function gradeTint(id) {
  const g = gradeById(id);
  return [g.tintTop, g.tintBottom];
}

/** The accent colour a grade lends the title halo and the furniture. */
export function gradeGlow(id) {
  return gradeById(id).glow;
}
