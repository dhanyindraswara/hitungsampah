import { findProduct } from '../data/catalog';

const escape = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Trips as CSV, one row per trip plus one row per item where the breakdown was
 * recorded. Built and downloaded entirely on the device — no server involved,
 * so it works at the gate with no signal.
 */
export function tripsToCsv(trips, t) {
  const rows = [[
    'trip_id', 'hiker', 'mountain', 'gate', 'date', 'group_size',
    'returned_pct', 'baseline_items', 'row_type', 'product', 'qty_before', 'qty_after',
  ]];

  trips.forEach((trip) => {
    rows.push([
      trip.id, trip.hiker || '', trip.mtn, trip.gate, trip.date, trip.group || '',
      trip.pct, trip.items, 'trip', '', '', '',
    ]);

    if (!trip.baseline) return;
    const ids = [...new Set([
      ...trip.baseline.map((i) => i.id),
      ...(trip.after || []).map((i) => i.id),
    ])];
    ids.forEach((id) => {
      const product = findProduct(id);
      rows.push([
        trip.id, trip.hiker || '', trip.mtn, trip.gate, trip.date, trip.group || '',
        trip.pct, trip.items, 'item',
        product.key ? t[product.key] : product.name,
        trip.baseline.find((i) => i.id === id)?.qty || 0,
        (trip.after || []).find((i) => i.id === id)?.qty || 0,
      ]);
    });
  });

  return rows.map((row) => row.map(escape).join(',')).join('\n');
}

export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before dropping the blob.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
