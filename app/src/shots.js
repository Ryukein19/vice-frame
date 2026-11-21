// Shot runner: reads ?shot=, ?layout=, ?grade=, ?caption=, ?subtitle= and ?photo=
// from the URL and renders the app for the headless screenshot capture. The cover
// shot fills the whole viewport; the editor shot keeps the normal editor layout.
import { layoutByKey } from './layouts.js';
import { gradeByKey } from './grades.js';

/**
 * Runs one screenshot. `load` starts the app and returns a promise that resolves
 * once the app is rendered at the shot size. Returns true when a shot ran.
 */
export async function runShot(shot, query, load) {
  if (shot !== 'cover' && shot !== 'editor') return false;
  const layout = layoutByKey(query.get('layout') || 'mosaic');
  const grade = gradeByKey(query.get('grade') || 'sunset');
  const caption = (query.get('caption') || 'SUNSET HEIST').toUpperCase();
  const subtitle = query.get('subtitle') || 'a vice city story';
  const photo = query.get('photo') || 'face';
  document.body.dataset.shot = shot;
  await load({ layout: layout.key, grade: grade.key, caption, subtitle, photo, shot });
  // Let the fonts settle and the canvas paint before the capture.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
  return true;
}
