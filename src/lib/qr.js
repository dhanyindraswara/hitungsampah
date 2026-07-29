/**
 * Renders a deterministic 21×21 QR-style grid for a trip ID: three finder
 * squares plus a stable data field derived from the ID. It is a visual stand-in
 * for the checkpoint code — swap in a real QR encoder when the officer app
 * actually scans it.
 */
const SIZE = 21;

function hashSeed(text) {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 9973;
  return h;
}

export function qrGrid(tripId = '') {
  const seed = hashSeed(tripId);

  const inFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= SIZE - 7) || (r >= SIZE - 7 && c < 7);

  const isOn = (r, c) => {
    if (inFinder(r, c)) {
      const rr = r < 7 ? r : r - (SIZE - 7);
      const cc = c < 7 ? c : c - (SIZE - 7);
      const d = Math.max(Math.abs(rr - 3), Math.abs(cc - 3));
      return d === 3 || d <= 1;
    }
    return (r * 73 + c * 151 + seed * 31 + ((r * c) % 17) * 11) % 7 < 3;
  };

  const rows = [];
  for (let r = 0; r < SIZE; r += 1) {
    const cells = [];
    for (let c = 0; c < SIZE; c += 1) cells.push(isOn(r, c));
    rows.push(cells);
  }
  return rows;
}
