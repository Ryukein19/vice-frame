// Fixed scenes for screenshots. `?shot=cover` shows the cover alone and
// `?shot=editor` shows the editor with a photo loaded; the query picks the
// layout, grade, sample photos and every line of poster text, so a shot is a
// full cover in a chosen mood. window.__shotReady is set once it is painted.
// Any of the twelve layouts and ten grades can be picked through the query
// (layout= / grade=), so a shot can show the round-4 additions too.
const DEFAULT_ROLES = ['THE INSIDER', 'THE BOSS', 'THE DRIVER', 'THE LOOKOUT', 'THE FIXER'];

function splitList(value, fallback) {
  const parts = String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : fallback;
}

/** Reads a shot scene out of the query string. */
export function sceneFromQuery(query) {
  return {
    layout: query.get('layout') ?? 'grid',
    grade: query.get('grade') ?? 'sunset',
    photos: splitList(query.get('photo'), ['pier']),
    roles: splitList(query.get('roles'), DEFAULT_ROLES),
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Vice City',
    quote: query.get('quote') ?? 'The city never sleeps. Neither do we.',
    volume: query.get('volume') ?? '1',
    tagline: query.get('tagline') ?? 'Every empire starts with one job',
    billing: query.get('billing') ?? 'A Vice Frame original',
    furniture: query.get('furniture') !== '0',
  };
}

/**
 * Runs a shot: builds the scene from the query, hands it to `apply` (which
 * loads the photos and paints), then marks the page ready for the capture.
 */
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = sceneFromQuery(query);
  await apply(scene);
  // Let the fonts settle, then paint twice so the capture sees the final
  // frame even if a webfont arrived late.
  if (document.fonts?.ready) {
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    } catch {
      // A font that never arrives still leaves a painted cover.
    }
    await apply(scene);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
