// Colour grades for Vice Frame. A grade is a translucent vertical gradient
// washed over the whole cover after the panels are drawn, plus a vignette that
// pulls the eye to the middle. All colours are our own sunset / neon palette.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    stops: [
      [0, 'rgba(255, 176, 66, 0)'],
      [0.55, 'rgba(255, 110, 80, 0.10)'],
      [1, 'rgba(214, 48, 120, 0.34)'],
    ],
    vignette: 0.28,
  },
  neon: {
    label: 'Neon',
    stops: [
      [0, 'rgba(0, 229, 255, 0.10)'],
      [0.5, 'rgba(255, 0, 128, 0.05)'],
      [1, 'rgba(120, 0, 255, 0.30)'],
    ],
    vignette: 0.34,
  },
  palm: {
    label: 'Palm',
    stops: [
      [0, 'rgba(0, 200, 170, 0.12)'],
      [0.6, 'rgba(20, 90, 140, 0.08)'],
      [1, 'rgba(40, 10, 80, 0.32)'],
    ],
    vignette: 0.3,
  },
};

/** Paints a grade's wash and vignette over the whole canvas. */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of grade.stops) wash.addColorStop(at, color);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const radius = Math.hypot(w, h) / 2;
  const vig = ctx.createRadialGradient(w / 2, h / 2, radius * 0.45, w / 2, h / 2, radius);
  vig.addColorStop(0, 'rgba(10, 4, 20, 0)');
  vig.addColorStop(1, `rgba(10, 4, 20, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
