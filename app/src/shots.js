// Vice Frame — screenshot mode.
// The screenshot runner loads the app with ?shot=<name>&photo=<sample>
// &caption=<text> and waits for the page to settle, so the shots are
// deterministic: same query, same cover. The runner (headless Chrome)
// screenshots the page; this module only arranges the view.
//   shot=cover    — the cover alone, filling the frame, furniture on.
//   shot=editor   — the full editor with a photo loaded and a panel selected.
//   shot=wide     — the cover in wide 1920x1080.
//   shot=portrait — the cover in portrait 1080x1350.
// Without ?shot the app opens normally in the editor.

export function shotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    photo: q.get('photo') || '',
    caption: q.get('caption') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
  };
}

// Apply the shot query to the state before the first render. Returns true
// when the page is in a shot (so the editor chrome is hidden for cover
// shots and shown for editor shots).
export function applyShot(state, params) {
  if (!params.shot) return false;
  if (params.photo) {
    const slot = state.panels.find((p) => p.photo === `samples/${params.photo}.jpg`) ?? state.panels[0];
    if (slot) slot.photo = `samples/${params.photo}.jpg`;
  }
  if (params.caption) state.caption = params.caption;
  if (params.layout) state.layout = params.layout;
  if (params.grade) state.grade = params.grade;
  return true;
}

// Mark the cover as ready for the screenshot runner: the runner waits for
// document.title to carry "ready" before it shoots.
export function markReady(kind) {
  document.title = `Vice Frame — ${kind} — ready`;
}
