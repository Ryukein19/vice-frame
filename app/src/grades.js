// Colour grades: each grade tints the photos with a filter and unifies the whole
// cover with one colour cast, so the panels read as a single poster, not a collage.
export const GRADES = [
  { key: 'sunset', name: 'Sunset', filter: 'saturate(1.25) contrast(1.06) brightness(1.02)', cast: ['rgba(255,140,40,0.16)', 'rgba(255,60,120,0.10)'] },
  { key: 'neon', name: 'Neon', filter: 'saturate(1.45) contrast(1.10) brightness(1.00)', cast: ['rgba(255,40,160,0.16)', 'rgba(80,40,255,0.14)'] },
  { key: 'palm', name: 'Palm', filter: 'saturate(1.20) contrast(1.05) brightness(1.00)', cast: ['rgba(40,200,120,0.10)', 'rgba(255,180,60,0.10)'] },
  { key: 'night', name: 'Neon Night', filter: 'saturate(1.55) contrast(1.12) brightness(0.92)', cast: ['rgba(180,30,200,0.20)', 'rgba(40,10,80,0.18)'] },
  { key: 'golden', name: 'Golden Hour', filter: 'saturate(1.30) contrast(1.05) brightness(1.06)', cast: ['rgba(255,190,60,0.18)', 'rgba(255,120,20,0.08)'] },
  { key: 'teal', name: 'Tropic Teal', filter: 'saturate(1.25) contrast(1.06) brightness(1.00)', cast: ['rgba(20,200,180,0.14)', 'rgba(20,120,160,0.12)'] },
];

/** Looks a grade up by its key, falling back to Sunset. */
export function gradeByKey(key) {
  return GRADES.find((g) => g.key === key) || GRADES[0];
}
