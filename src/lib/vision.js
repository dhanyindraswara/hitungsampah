/**
 * On-device packaging vision — plain JavaScript, no model, no network.
 *
 * The camera hint asks the hiker to lay every wrapper on a flat surface and
 * spread them out. That framing is what makes counting tractable without a
 * trained network: the surface is one broad colour, and every package is a
 * patch that does not match it. So the pipeline is
 *
 *   1. estimate the surface colour, and how busy it is, from the border ring,
 *   2. mark as foreground every pixel far enough from it in CIE Lab, plus the
 *      edges — a white wrapper on a pale rock differs by its rim, not its hue,
 *   3. clean the mask: close, fill what the rims enclose, then open,
 *   4. label connected regions — one region is one package,
 *   5. name each region by matching its colour, corrected for the light falling
 *      on that corner of the frame, against the catalogue's packaging colours,
 *      and fall back to a shape guess when nothing is close enough.
 *
 * It runs in a few milliseconds on a downscaled frame, works offline, and adds
 * no dependency. Two things it cannot do, both by design rather than by
 * accident:
 *
 *   Read a brand off a wrapper. Colour is a real but weak signal, so a match
 *   only earns high confidence when it is close. Everything else lands in an
 *   "unknown" bucket under LOW_CONFIDENCE, which the review screen renders as
 *   "needs a check" for the hiker to correct.
 *
 *   Separate packages that touch. Two wrappers pushed together are one region
 *   and count as one, which is why the camera hint asks for them spread out.
 *   Guessing "that blob looks like three" would inflate a count the whole gate
 *   process depends on; undercounting is visible and fixable, and the hiker can
 *   add what is missing before saving.
 */
import { catalog } from '../data/catalog';

// ---- tuning ---------------------------------------------------------------

/** Share of the shortest edge sampled as background, from each side. */
const BORDER_FRACTION = 0.08;

/** Lab distance from the surface colour that counts as "an object". */
const MIN_THRESHOLD = 12;
const MAX_THRESHOLD = 30;

/** Sobel magnitude that counts as the rim of an object. */
const MIN_EDGE = 14;
const MAX_EDGE = 90;

/** A region must cover this much of the frame to be a package, and no more. */
const MIN_AREA_FRACTION = 0.004;
const MAX_AREA_FRACTION = 0.45;

/** Above this the surface estimate clearly failed — report nothing instead. */
const MAX_FOREGROUND_FRACTION = 0.85;

/** Upper bound on regions, so a noisy frame cannot flood the review list. */
const MAX_BOXES = 40;

/** Near-grey regions (foil, clear plastic) never match a brand colour. */
const MIN_CHROMA = 9;

/** Largest Lab distance that still counts as a brand-colour match. */
const MATCH_MAX_DELTA = 22;

// ---- colour ---------------------------------------------------------------

/** sRGB gamma decode, precomputed — this is the hot path of the Lab pass. */
const GAMMA = new Float32Array(256);
for (let i = 0; i < 256; i += 1) {
  const c = i / 255;
  GAMMA[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const EPSILON = 216 / 24389;

function pivot(v) {
  return v > EPSILON ? Math.cbrt(v) : 7.787 * v + 16 / 116;
}

/** Linear RGB → CIE L*a*b* (D65), written into `out`. */
export function linearToLab(rl, gl, bl, out) {
  const x = pivot((rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047);
  const y = pivot(rl * 0.2126 + gl * 0.7152 + bl * 0.0722);
  const z = pivot((rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883);
  out[0] = 116 * y - 16;
  out[1] = 500 * (x - y);
  out[2] = 200 * (y - z);
  return out;
}

/** sRGB bytes → CIE L*a*b* (D65), written into `out`. */
export function rgbToLab(r, g, b, out) {
  return linearToLab(GAMMA[r], GAMMA[g], GAMMA[b], out);
}

function deltaE(l1, a1, b1, l2, a2, b2) {
  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function hexToLab(hex) {
  const value = parseInt(hex.slice(1), 16);
  return rgbToLab((value >> 16) & 255, (value >> 8) & 255, value & 255, new Float32Array(3));
}

/**
 * Both gradient stops of every branded catalogue entry. The unknown categories
 * are deliberately left out: their colours are neutral placeholders, and
 * matching against them would put a confident name on every grey wrapper.
 */
const PALETTE = catalog
  .filter((product) => !product.key)
  .flatMap((product) => [product.c, product.c2].map((hex) => ({ id: product.id, lab: hexToLab(hex) })));

// ---- helpers --------------------------------------------------------------

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/** Percentile of a Float32Array. Sorts in place — pass a scratch array. */
function percentile(values, p) {
  if (!values.length) return 0;
  values.sort();
  return values[clamp(Math.round((values.length - 1) * p), 0, values.length - 1)];
}

// ---- edges ----------------------------------------------------------------

/**
 * Sobel gradient magnitude over lightness.
 *
 * Colour alone misses the packages that sit close to the surface in both hue
 * and brightness — grey foil on a grey camping table, a white wrapper on a
 * pale rock. Those still have a rim where the light breaks. Marking that rim
 * and then filling what it encloses recovers them.
 */
function edgeMagnitude(lab, w, h) {
  const n = w * h;
  const grad = new Float32Array(n);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const tl = lab[(i - w - 1) * 3];
      const tc = lab[(i - w) * 3];
      const tr = lab[(i - w + 1) * 3];
      const ml = lab[(i - 1) * 3];
      const mr = lab[(i + 1) * 3];
      const bl = lab[(i + w - 1) * 3];
      const bc = lab[(i + w) * 3];
      const br = lab[(i + w + 1) * 3];
      const gx = tr + 2 * mr + br - tl - 2 * ml - bl;
      const gy = bl + 2 * bc + br - tl - 2 * tc - tr;
      grad[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return grad;
}

// ---- morphology -----------------------------------------------------------

/**
 * Separable 3x3 min/max over a binary mask, applied `radius` times. A max pass
 * dilates, a min pass erodes; both run rows-then-columns so cost stays linear.
 */
function morph(mask, w, h, radius, grow) {
  const hit = grow ? 1 : 0;
  const miss = grow ? 0 : 1;
  let src = mask;
  let dst = new Uint8Array(mask.length);

  for (let pass = 0; pass < radius * 2; pass += 1) {
    const horizontal = pass % 2 === 0;
    for (let y = 0; y < h; y += 1) {
      const row = y * w;
      for (let x = 0; x < w; x += 1) {
        const i = row + x;
        let value = miss;
        if (horizontal) {
          const left = x > 0 ? src[i - 1] : miss;
          const right = x < w - 1 ? src[i + 1] : miss;
          value = left === hit || src[i] === hit || right === hit ? hit : miss;
        } else {
          const up = y > 0 ? src[i - w] : miss;
          const down = y < h - 1 ? src[i + w] : miss;
          value = up === hit || src[i] === hit || down === hit ? hit : miss;
        }
        dst[i] = value;
      }
    }
    const swap = src;
    src = dst;
    dst = swap;
  }

  return src;
}

/**
 * Anything enclosed by foreground becomes foreground. A label, a shadow inside
 * a bottle, a dark cap — all of it belongs to the package around it.
 */
function fillHoles(mask, w, h) {
  const n = w * h;
  const outside = new Uint8Array(n);
  const stack = new Int32Array(n);
  let top = 0;

  const push = (i) => {
    if (!mask[i] && !outside[i]) {
      outside[i] = 1;
      stack[top] = i;
      top += 1;
    }
  };

  for (let x = 0; x < w; x += 1) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += 1) {
    push(y * w);
    push(y * w + w - 1);
  }

  while (top > 0) {
    top -= 1;
    const i = stack[top];
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < n - w) push(i + w);
  }

  for (let i = 0; i < n; i += 1) {
    if (!mask[i] && !outside[i]) mask[i] = 1;
  }
  return mask;
}

// ---- regions --------------------------------------------------------------

/**
 * Flood-fills every foreground region, accumulating its shape and colour.
 *
 * `core` is the mask eroded back from its boundary. Shape comes from the full
 * mask, but colour is only read inside the core: the mask is grown to knit each
 * package together, so its outer ring is part surface, and averaging that in
 * washes every wrapper toward the colour of the table.
 */
function findRegions(mask, core, lab, data, w, h) {
  const n = w * h;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  const regions = [];

  for (let start = 0; start < n; start += 1) {
    if (!mask[start] || seen[start]) continue;

    let top = 0;
    stack[top] = start;
    seen[start] = 1;
    top += 1;

    let area = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    // Colour is accumulated in linear RGB, not Lab: the illumination
    // correction below is a per-channel gain, which is only a multiplication
    // in linear light.
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let colourPixels = 0;

    while (top > 0) {
      top -= 1;
      const i = stack[top];
      const x = i % w;
      const y = (i / w) | 0;

      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // Blown highlights and deep shadow say nothing about the packaging, so
      // they stay out of the colour average.
      const L = lab[i * 3];
      if (core[i] && L > 15 && L < 92) {
        sumR += GAMMA[data[i * 4]];
        sumG += GAMMA[data[i * 4 + 1]];
        sumB += GAMMA[data[i * 4 + 2]];
        colourPixels += 1;
      }

      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[top] = i - 1; top += 1; }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[top] = i + 1; top += 1; }
      if (i >= w && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; stack[top] = i - w; top += 1; }
      if (i < n - w && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; stack[top] = i + w; top += 1; }
    }

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    regions.push({
      area,
      minX,
      minY,
      maxX,
      maxY,
      boxW,
      boxH,
      fill: area / (boxW * boxH),
      cut: minX === 0 || minY === 0 || maxX === w - 1 || maxY === h - 1,
      rgb: colourPixels
        ? [sumR / colourPixels, sumG / colourPixels, sumB / colourPixels]
        : null,
    });
  }

  return regions;
}

/**
 * The surface immediately around a region, in linear RGB.
 *
 * Sunlight through cloud, the shadow of the photographer, a torch off to one
 * side — the light on a package is whatever the light on the table beside it
 * is. Measuring that ring gives us the illuminant locally, which is what makes
 * the brand colours comparable across the frame.
 */
function surroundColour(region, mask, data, w, h) {
  const pad = Math.max(4, Math.round(Math.max(region.boxW, region.boxH) * 0.3));
  const x0 = Math.max(0, region.minX - pad);
  const x1 = Math.min(w - 1, region.maxX + pad);
  const y0 = Math.max(0, region.minY - pad);
  const y1 = Math.min(h - 1, region.maxY + pad);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = y * w + x;
      if (mask[i]) continue;
      r += GAMMA[data[i * 4]];
      g += GAMMA[data[i * 4 + 1]];
      b += GAMMA[data[i * 4 + 2]];
      count += 1;
    }
  }

  // Too little bare surface around it to say anything — a package in the
  // middle of a crowded pile, usually.
  if (count < 40) return null;
  return [r / count, g / count, b / count];
}

// ---- naming ---------------------------------------------------------------

/**
 * Puts a catalogue id and a confidence on one region. A close brand-colour
 * match earns a name; anything else is filed by silhouette as an unknown
 * bottle, bag, or wrapper, always below LOW_CONFIDENCE.
 */
function classify(region, areaFraction, colour) {
  const chroma = colour ? Math.hypot(colour[1], colour[2]) : 0;

  if (colour && chroma >= MIN_CHROMA) {
    let bestId = null;
    let bestDelta = Infinity;
    for (const entry of PALETTE) {
      const d = deltaE(colour[0], colour[1], colour[2], entry.lab[0], entry.lab[1], entry.lab[2]);
      if (d < bestDelta) {
        bestDelta = d;
        bestId = entry.id;
      }
    }
    if (bestId && bestDelta <= MATCH_MAX_DELTA) {
      const cf = Math.round(90 - (bestDelta / MATCH_MAX_DELTA) * 30) - (region.cut ? 6 : 0);
      return { id: bestId, cf: clamp(cf, 52, 92) };
    }
  }

  const ratio = region.boxH / region.boxW;
  let id = 'unk1';
  if (ratio >= 1.6 && region.fill > 0.45) id = 'unk3';
  else if (areaFraction > 0.06 || region.fill < 0.55) id = 'unk2';

  let cf = 52;
  if (region.fill > 0.7) cf += 8;
  if (region.cut) cf -= 8;
  return { id, cf: clamp(cf, 36, 66) };
}

// ---- pipeline -------------------------------------------------------------

/**
 * Reads one frame.
 *
 * @param {ImageData} image  a downscaled RGBA frame
 * @returns {{ ok: boolean, boxes: Box[] }}
 *   Box = { id, cf, x, y, w, h } with x/y/w/h as fractions of the frame, so the
 *   caller can map them onto a viewfinder of any size.
 */
export function analyzeFrame(image) {
  if (!image?.width || !image?.height) return { ok: false, boxes: [] };

  const w = image.width;
  const h = image.height;
  const n = w * h;
  const data = image.data;

  const lab = new Float32Array(n * 3);
  const pixel = new Float32Array(3);
  for (let i = 0; i < n; i += 1) {
    rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], pixel);
    lab[i * 3] = pixel[0];
    lab[i * 3 + 1] = pixel[1];
    lab[i * 3 + 2] = pixel[2];
  }

  // ---- surface colour, from the border ring -------------------------------
  const band = Math.max(2, Math.round(Math.min(w, h) * BORDER_FRACTION));
  const samples = [];
  for (let y = 0; y < h; y += 2) {
    const edgeRow = y < band || y >= h - band;
    for (let x = 0; x < w; x += 2) {
      if (!edgeRow && x >= band && x < w - band) continue;
      samples.push(y * w + x);
    }
  }
  if (samples.length < 24) return { ok: false, boxes: [] };

  const channel = new Float32Array(samples.length);
  const bg = new Float32Array(3);
  for (let c = 0; c < 3; c += 1) {
    for (let s = 0; s < samples.length; s += 1) channel[s] = lab[samples[s] * 3 + c];
    bg[c] = percentile(channel.slice(), 0.5);
  }

  // The same surface in linear light, which is the reference the per-region
  // illumination correction divides by.
  const bgLinear = new Float32Array(3);
  for (let c = 0; c < 3; c += 1) {
    for (let s = 0; s < samples.length; s += 1) channel[s] = GAMMA[data[samples[s] * 4 + c]];
    bgLinear[c] = percentile(channel.slice(), 0.5);
  }

  // How noisy is that surface? A patterned tarp needs a looser threshold than
  // a plain rock slab, and this is what tells them apart.
  const spread = new Float32Array(samples.length);
  for (let s = 0; s < samples.length; s += 1) {
    const i = samples[s] * 3;
    spread[s] = deltaE(lab[i], lab[i + 1], lab[i + 2], bg[0], bg[1], bg[2]);
  }
  const threshold = clamp(percentile(spread, 0.9) * 1.6 + 5, MIN_THRESHOLD, MAX_THRESHOLD);

  // Same trick for edges: a patterned mat is full of them, so the bar for
  // "this is the rim of an object" is set by how busy the surface already is.
  const grad = edgeMagnitude(lab, w, h);
  const surfaceEdges = new Float32Array(samples.length);
  for (let s = 0; s < samples.length; s += 1) surfaceEdges[s] = grad[samples[s]];
  const edgeThreshold = clamp(percentile(surfaceEdges, 0.95) * 2.2 + 8, MIN_EDGE, MAX_EDGE);

  // ---- foreground mask ----------------------------------------------------
  let mask = new Uint8Array(n);
  let foreground = 0;
  for (let i = 0; i < n; i += 1) {
    const d = deltaE(lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2], bg[0], bg[1], bg[2]);
    if (d > threshold || grad[i] > edgeThreshold) {
      mask[i] = 1;
      foreground += 1;
    }
  }

  // Nearly everything differs from the border: either the packages fill the
  // frame edge to edge or the surface is not one colour. Either way a count
  // from this frame would be invented, so we decline to give one.
  if (foreground / n > MAX_FOREGROUND_FRACTION) return { ok: false, boxes: [] };

  // Close first, so an object outlined only by its rim becomes a loop and the
  // fill can claim its inside. Opening before that would erase the rim.
  mask = morph(mask, w, h, 2, true);
  mask = morph(mask, w, h, 2, false);
  fillHoles(mask, w, h);
  mask = morph(mask, w, h, 1, false); // open: drop what is left of the speckle
  mask = morph(mask, w, h, 1, true);

  // ---- regions → boxes ----------------------------------------------------
  const minArea = MIN_AREA_FRACTION * n;
  const maxArea = MAX_AREA_FRACTION * n;

  // morph() writes through the array it is handed, so the core is built from a
  // copy and the mask itself survives for the region pass.
  const core = morph(mask.slice(), w, h, 2, false);

  const lab3 = new Float32Array(3);
  const boxes = findRegions(mask, core, lab, data, w, h)
    .filter((region) => region.area >= minArea && region.area <= maxArea)
    .sort((left, right) => right.area - left.area)
    .slice(0, MAX_BOXES)
    .map((region) => {
      let colour = null;
      if (region.rgb) {
        // Divide out the light falling on this particular corner of the frame
        // before the packaging colour is compared to the catalogue.
        const around = surroundColour(region, mask, data, w, h) || bgLinear;
        const corrected = new Float32Array(3);
        for (let c = 0; c < 3; c += 1) {
          const gain = clamp(bgLinear[c] / Math.max(around[c], 1e-4), 0.4, 2.5);
          corrected[c] = clamp(region.rgb[c] * gain, 0, 1);
        }
        colour = linearToLab(corrected[0], corrected[1], corrected[2], lab3);
      }
      return {
        ...classify(region, region.area / n, colour),
        x: region.minX / w,
        y: region.minY / h,
        w: region.boxW / w,
        h: region.boxH / h,
      };
    });

  return { ok: true, boxes };
}

/**
 * Folds the per-frame boxes into one count per product.
 *
 * The hiker is asked for several photos of the same pile from different angles,
 * so the frames overlap: summing them would count the same wrapper twice. The
 * best single view of each product wins instead, which under-counts when
 * something never made it into frame — and that is the failure the after-hike
 * comparison is designed to surface.
 */
export function mergeFrameBoxes(frames = []) {
  const best = new Map();

  frames.forEach((boxes) => {
    const perFrame = new Map();
    (boxes || []).forEach((box) => {
      const entry = perFrame.get(box.id) || { qty: 0, cf: 0 };
      entry.qty += 1;
      entry.cf += box.cf;
      perFrame.set(box.id, entry);
    });
    perFrame.forEach((entry, id) => {
      const previous = best.get(id);
      if (!previous || entry.qty > previous.qty) best.set(id, entry);
    });
  });

  return [...best.entries()]
    .map(([id, entry]) => ({ id, qty: entry.qty, cf: Math.round(entry.cf / entry.qty) }))
    .sort((left, right) => right.qty - left.qty);
}
