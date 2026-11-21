// The five sample photos shipped with the app, made with an image model for this
// entry. Each names its file, its role tag and its pinned focus (measured by eye
// from the photo itself). The pier photo's fisherman smiles at about (0.56, 0.30)
// of the frame — the pin keeps his face in the crop, where a brightness heuristic
// would score the turquoise sea higher and cut him out.
export const SAMPLES = [
  { key: 'face', file: 'face.jpg', tag: 'THE FIXER', focus: null },
  { key: 'courier', file: 'courier.jpg', tag: 'THE DRIVER', focus: null },
  { key: 'street', file: 'street.jpg', tag: 'THE HIDEOUT', focus: null },
  { key: 'car', file: 'car.jpg', tag: 'THE GETAWAY', focus: null },
  { key: 'pier', file: 'pier.jpg', tag: 'THE INSIDER', focus: { fx: 0.56, fy: 0.30, zoom: 1.35 } },
];

/** Looks a sample up by its key. */
export function sampleByKey(key) {
  return SAMPLES.find((s) => s.key === key) || SAMPLES[0];
}
