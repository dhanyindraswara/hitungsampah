/**
 * Packaging detector — the single seam between the app and any counting logic.
 *
 * A detector is an object with this shape:
 *
 *   id              string   stable identifier, persisted in settings
 *   autoCounts      boolean  true if it produces counts on its own
 *   scripted        boolean  true if it replays canned data instead of reading
 *                            the camera — the camera screen hides the
 *                            viewfinder entirely for these
 *   overlay(mode)   Box[]    scripted boxes for the viewfinder ([] if none)
 *   scan(source)    Promise<Box[]> | undefined
 *                            reads one live frame or one still, for the boxes
 *                            drawn over the camera. Absent when the detector
 *                            cannot look at pixels.
 *   detect(input)   Promise<Detection[]>
 *
 *   input      { mode: 'before'|'after', attempt: number, frames: Frame[] }
 *   Frame      { id, blob, url, w, h, detections? }   captured JPEG stills
 *   Box        { id, x, y, w, h, cf }     scan boxes: fractions of the frame
 *   Detection  { id, qty, cf }            cf = confidence 0–100
 *
 * Three implementations ship today:
 *
 *   visionDetector    the default. Reads the actual camera frames on the device
 *                     — live while framing, and again on every shutter press —
 *                     and arrives at the review screen with the list filled in.
 *   manualDetector    real camera, no automatic counting. Settings → Deteksi
 *                     otomatis off, for when the surface defeats the detector.
 *   scriptedDetector  replays the scenes from the design, for demos and pitches.
 *                     Enabled by the "Mode demo" switch in Settings.
 *
 * ── Swapping in a trained model later ───────────────────────────────────────
 * Write a fourth object with the same members:
 *
 *   export const modelDetector = {
 *     id: 'model',
 *     autoCounts: true,
 *     overlay: () => [],
 *     async scan(source, opts) { return runModel(source); },   // live boxes
 *     async detect({ frames }) {
 *       const raw = await Promise.all(frames.map(runModel));   // ONNX Runtime
 *       return mergeFrameBoxes(raw);                           // Web / TFLite
 *     },
 *   };
 *
 * then add it to DETECTORS below and offer it in Settings. Anything under
 * LOW_CONFIDENCE renders as "needs a check" on the review screen, and the hiker
 * can still correct every number. No screen component has to change.
 */
import { analyzeFrame, mergeFrameBoxes } from './vision';
import { imageDataFromBlob, imageDataFromVideo, LIVE_EDGE, STILL_EDGE } from './frames';

// ── Scripted demo data ──────────────────────────────────────────────────────

// Objects visible in the before-hike frame. `lab` marks the boxes that carry a
// name tag; the rest get a bare box so labels never stack or collide.
const sceneBefore = [
  { id: 'indomie', x: 5, y: 9, w: 25, h: 13, r: 7 },
  { id: 'indomie', x: 32, y: 6, w: 25, h: 13, r: 7 },
  { id: 'aqua', x: 61, y: 5, w: 12, h: 29, r: 22 },
  { id: 'aqua', x: 77, y: 8, w: 12, h: 29, r: 22 },
  { id: 'teh', x: 5, y: 27, w: 13, h: 25, r: 18 },
  { id: 'kopiko', x: 22, y: 25, w: 17, h: 10, r: 5, lab: 1 },
  { id: 'goodday', x: 43, y: 24, w: 14, h: 17, r: 6 },
  { id: 'lemin', x: 62, y: 41, w: 12, h: 26, r: 20, lab: 1 },
  { id: 'sq', x: 5, y: 58, w: 26, h: 12, r: 5, lab: 1 },
  { id: 'unk1', x: 35, y: 46, w: 21, h: 14, r: 9 },
  { id: 'unk2', x: 34, y: 68, w: 25, h: 19, r: 11, lab: 1 },
  { id: 'teh', x: 78, y: 44, w: 13, h: 25, r: 18 },
];

// After-hike frame. The top-left object is deliberately unlabelled — it shares
// that corner with the live-count pill, and its box is large enough to read bare.
const sceneAfter = [
  { id: 'unk2', x: 6, y: 9, w: 30, h: 22, r: 12 },
  { id: 'indomie', x: 40, y: 7, w: 24, h: 12, r: 7 },
  { id: 'aqua', x: 68, y: 5, w: 12, h: 27, r: 22 },
  { id: 'teh', x: 84, y: 9, w: 12, h: 25, r: 18 },
  { id: 'kopiko', x: 8, y: 38, w: 18, h: 11, r: 5, lab: 1 },
  { id: 'goodday', x: 30, y: 34, w: 14, h: 16, r: 6 },
  { id: 'unk1', x: 50, y: 35, w: 20, h: 14, r: 9, lab: 1 },
  { id: 'lemin', x: 74, y: 41, w: 12, h: 24, r: 20 },
  { id: 'sq', x: 8, y: 57, w: 24, h: 12, r: 5, lab: 1 },
  { id: 'unk3', x: 40, y: 58, w: 12, h: 26, r: 20, lab: 1 },
  { id: 'unk1', x: 58, y: 63, w: 20, h: 15, r: 9 },
];

const baselineDetections = [
  { id: 'indomie', qty: 4, cf: 97 }, { id: 'aqua', qty: 2, cf: 95 }, { id: 'teh', qty: 3, cf: 92 },
  { id: 'kopiko', qty: 15, cf: 88 }, { id: 'goodday', qty: 2, cf: 90 }, { id: 'lemin', qty: 1, cf: 93 },
  { id: 'sq', qty: 2, cf: 86 }, { id: 'unk1', qty: 6, cf: 61 }, { id: 'unk2', qty: 4, cf: 58 },
];

// First after-hike pass: a few wrappers stayed out of frame, so the trip fails.
const afterFirstAttempt = [
  { id: 'indomie', qty: 4, cf: 96 }, { id: 'aqua', qty: 2, cf: 94 }, { id: 'teh', qty: 3, cf: 91 },
  { id: 'kopiko', qty: 11, cf: 74 }, { id: 'goodday', qty: 2, cf: 89 }, { id: 'lemin', qty: 1, cf: 92 },
  { id: 'sq', qty: 2, cf: 84 }, { id: 'unk1', qty: 4, cf: 57 }, { id: 'unk2', qty: 4, cf: 60 },
  { id: 'unk3', qty: 1, cf: 54 },
];

// Retake: everything is found, plus one item that was not in the baseline.
const afterRetake = [
  { id: 'indomie', qty: 4, cf: 96 }, { id: 'aqua', qty: 2, cf: 95 }, { id: 'teh', qty: 3, cf: 93 },
  { id: 'kopiko', qty: 15, cf: 82 }, { id: 'goodday', qty: 2, cf: 90 }, { id: 'lemin', qty: 1, cf: 93 },
  { id: 'sq', qty: 2, cf: 87 }, { id: 'unk1', qty: 6, cf: 64 }, { id: 'unk2', qty: 4, cf: 62 },
  { id: 'unk3', qty: 1, cf: 55 },
];

// ── Implementations ─────────────────────────────────────────────────────────

/**
 * Reads the real frames on the device — see `src/lib/vision.js` for how.
 *
 * `scan` is called two ways: from the camera loop with the live <video>, so the
 * hiker sees boxes land on the packages as they frame the shot, and once per
 * shutter press on the JPEG that was just captured. The still result is cached
 * on the photo, so by the time the processing screen runs `detect` the counting
 * is already done and only has to be folded together.
 */
export const visionDetector = {
  id: 'auto',
  autoCounts: true,
  scripted: false,
  overlay: () => [],

  async scan(source, { live = false } = {}) {
    const image = live
      ? imageDataFromVideo(source, LIVE_EDGE)
      : await imageDataFromBlob(source?.blob ?? source, STILL_EDGE);
    if (!image) return [];
    return analyzeFrame(image).boxes;
  },

  async detect({ frames = [] } = {}) {
    const perFrame = [];
    for (const frame of frames) {
      if (frame.detections) {
        perFrame.push(frame.detections);
      } else if (frame.blob) {
        try {
          perFrame.push(await visionDetector.scan(frame));
        } catch {
          /* one unreadable still should not sink the whole count */
        }
      }
    }
    return mergeFrameBoxes(perFrame);
  },
};

/** Real camera, human counting. No model, no guessing. */
export const manualDetector = {
  id: 'manual',
  autoCounts: false,
  scripted: false,
  overlay: () => [],
  async detect() {
    return [];
  },
};

/** Demo playback of the design's scenes. */
export const scriptedDetector = {
  id: 'demo',
  autoCounts: true,
  scripted: true,
  overlay: (mode) => (mode === 'before' ? sceneBefore : sceneAfter),
  async detect({ mode, attempt = 1 }) {
    const source = mode === 'before'
      ? baselineDetections
      : (attempt === 1 ? afterFirstAttempt : afterRetake);
    return source.map((d) => ({ ...d }));
  },
};

const DETECTORS = {
  [visionDetector.id]: visionDetector,
  [manualDetector.id]: manualDetector,
  [scriptedDetector.id]: scriptedDetector,
};

export function getDetector(id) {
  return DETECTORS[id] || visionDetector;
}

/** Milliseconds between two boxes appearing on the demo overlay. */
export const SCAN_SPEED_MS = 380;

/**
 * Gap between two live viewfinder passes. Long enough that a slow phone is idle
 * most of the time, short enough that the boxes follow the camera.
 */
export const LIVE_SCAN_MS = 650;

/** Milliseconds each of the three processing phases takes. */
export const PROCESS_PHASE_MS = 780;

/** How long the splash screen holds before the app is ready. */
export const SPLASH_MS = 1700;

/** Confidence below this reads as "needs a check" in the review list. */
export const LOW_CONFIDENCE = 70;

/** Longest edge of a captured still, in pixels. */
export const CAPTURE_MAX_EDGE = 1280;
