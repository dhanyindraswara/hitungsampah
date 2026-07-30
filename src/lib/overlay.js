/**
 * Where a detection tag sits relative to its bounding box.
 *
 * Tags normally hang above the box and align to its left edge. Two cases move
 * them: boxes near the top of the frame would push their tag off-screen (or
 * into the row above), so the tag drops inside the box; boxes near the right
 * edge right-align instead so the tag never clips.
 */
/**
 * Maps detection boxes onto the viewfinder.
 *
 * The <video> is drawn with `object-fit: cover`, so the frame the detector read
 * is scaled up and cropped before it reaches the screen. Without undoing that,
 * every box would sit slightly off its package — the taller the crop, the
 * further off. Boxes cropped out of view are dropped.
 *
 * @param boxes   detections with x/y/w/h as fractions of the source frame
 * @param source  { w, h } natural size of the video
 * @param view    { w, h } size of the viewfinder element
 * @returns the same boxes with x/y/w/h as percentages of the viewfinder
 */
export function fitCover(boxes, source, view) {
  if (!source?.w || !source?.h || !view?.w || !view?.h) return [];

  const scale = Math.max(view.w / source.w, view.h / source.h);
  const drawnW = source.w * scale;
  const drawnH = source.h * scale;
  const offsetX = (drawnW - view.w) / 2;
  const offsetY = (drawnH - view.h) / 2;

  return boxes
    .map((box) => ({
      ...box,
      x: ((box.x * drawnW - offsetX) / view.w) * 100,
      y: ((box.y * drawnH - offsetY) / view.h) * 100,
      w: ((box.w * drawnW) / view.w) * 100,
      h: ((box.h * drawnH) / view.h) * 100,
    }))
    .filter((box) => box.x + box.w > 3 && box.x < 97 && box.y + box.h > 3 && box.y < 97);
}

export function tagPlacement(box) {
  const nearRight = box.x + box.w > 64;
  const nearTop = box.y < 15;
  return {
    top: nearTop ? '6px' : '-25px',
    left: nearTop ? '6px' : nearRight ? 'auto' : '-2px',
    right: nearTop ? 'auto' : nearRight ? '-2px' : 'auto',
    maxWidth: nearTop ? 'none' : '170px',
  };
}
