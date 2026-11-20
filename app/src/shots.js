// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos;
// ?shot=cover shows the cover alone, filling the window. `photos` picks the
// samples (samples/<name>.jpg), `caption` and `subtitle` the words, `layout`
// and `grade` the look, `size` the export size (1080x1080, 1080x1350 or
// 1920x1080). window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, api) {
  const photos = (query.get('photos') ?? 'pier,boulevard').split(',').filter(Boolean);
  await api.setupScene({
    shot,
    photos,
    caption: query.get('caption') ?? 'Vice Heist',
    subtitle: query.get('subtitle') ?? 'Leonida • 2026',
    layout: query.get('layout') ?? 'sunset-split',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
  });
  await document.fonts.ready.catch(() => {});
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
