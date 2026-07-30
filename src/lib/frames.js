/**
 * Turning what the camera gives us into pixels the detector can read.
 *
 * Both paths downscale hard. The vision pipeline is O(pixels) and runs on the
 * main thread between frames, so a 1280px still becomes ~320px before anything
 * touches it — packages stay several hundred pixels across at that size, which
 * is all the mask needs.
 */

/** Longest edge used when reading a captured still. */
export const STILL_EDGE = 320;

/** Longest edge used for the live viewfinder pass — smaller, runs repeatedly. */
export const LIVE_EDGE = 224;

// One canvas per purpose, reused. Live scanning would otherwise allocate a new
// backing store every tick and keep the GC busy while the camera is open.
const canvases = new Map();

function scratch(key, w, h) {
  let canvas = canvases.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvases.set(key, canvas);
  }
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas;
}

function fit(sourceW, sourceH, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(sourceW, sourceH));
  return {
    w: Math.max(16, Math.round(sourceW * scale)),
    h: Math.max(16, Math.round(sourceH * scale)),
  };
}

function draw(key, source, sourceW, sourceH, maxEdge) {
  const { w, h } = fit(sourceW, sourceH, maxEdge);
  const canvas = scratch(key, w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Current frame of a live <video>, or null while it has nothing to show. */
export function imageDataFromVideo(video, maxEdge = LIVE_EDGE) {
  if (!video?.videoWidth || !video.videoHeight) return null;
  return draw('live', video, video.videoWidth, video.videoHeight, maxEdge);
}

async function decode(blob) {
  if (typeof createImageBitmap === 'function') {
    return { source: await createImageBitmap(blob), release: (b) => b.close?.() };
  }
  // Safari 14 and older have no createImageBitmap for blobs.
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('image decode failed'));
      element.src = url;
    });
    return { source: image, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** A captured JPEG still, decoded and downscaled. */
export async function imageDataFromBlob(blob, maxEdge = STILL_EDGE) {
  if (!blob) return null;
  const { source, release } = await decode(blob);
  try {
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    if (!width || !height) return null;
    return draw('still', source, width, height, maxEdge);
  } finally {
    release(source);
  }
}
