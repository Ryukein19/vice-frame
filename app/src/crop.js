// Face-aware crop: finds the subject of a photo so every panel keeps its face
// (or its subject) centred, whatever the panel's shape. A photo may also carry a
// pinned focus — a focus the maker measured by eye — which always wins over the
// heuristic, because a heuristic can score a bright sea higher than a face.

/**
 * Measures where the subject of `img` is. Returns { fx, fy, zoom } in image
 * fractions (0..1). A pinned focus ({ fx, fy, zoom }) is returned as-is.
 * Otherwise the image is downsampled and the weighted centre of its warmest,
 * brightest, most saturated pixels is taken — faces, skin and neon all score
 * high there, and flat sky or sea scores low.
 */
export function faceAwareCrop(img, pinned) {
  if (pinned && typeof pinned.fx === 'number' && typeof pinned.fy === 'number') {
    return { fx: pinned.fx, fy: pinned.fy, zoom: pinned.zoom || 1 };
  }
  const S = 48;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, S, S);
  const data = cx.getImageData(0, 0, S, S).data;
  let sum = 0;
  let wx = 0;
  let wy = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = (r + g + b) / 3 / 255;
      const saturation = max === 0 ? 0 : (max - min) / max;
      const skin = r > g && g >= b ? 0.35 : 0;
      const energy = brightness * (0.5 + saturation) + skin;
      sum += energy;
      wx += (x + 0.5) / S * energy;
      wy += (y + 0.5) / S * energy;
    }
  }
  if (sum <= 0) return { fx: 0.5, fy: 0.5, zoom: 1 };
  const clamp = (v) => Math.max(0.2, Math.min(0.8, v));
  return { fx: clamp(wx / sum), fy: clamp(wy / sum), zoom: 1 };
}

/**
 * The source rectangle of `img` to draw so it covers a target of
 * targetW x targetH with the focus point at the target's centre.
 * Returns [sx, sy, sw, sh] in image pixels.
 */
export function coverRect(img, targetW, targetH, focus) {
  const zoom = focus.zoom || 1;
  const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight) * zoom;
  const sw = targetW / scale;
  const sh = targetH / scale;
  let sx = focus.fx * img.naturalWidth - sw / 2;
  let sy = focus.fy * img.naturalHeight - sh / 2;
  sx = Math.max(0, Math.min(img.naturalWidth - sw, sx));
  sy = Math.max(0, Math.min(img.naturalHeight - sh, sy));
  return [sx, sy, sw, sh];
}
