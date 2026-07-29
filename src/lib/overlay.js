/**
 * Where a detection tag sits relative to its bounding box.
 *
 * Tags normally hang above the box and align to its left edge. Two cases move
 * them: boxes near the top of the frame would push their tag off-screen (or
 * into the row above), so the tag drops inside the box; boxes near the right
 * edge right-align instead so the tag never clips.
 */
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
