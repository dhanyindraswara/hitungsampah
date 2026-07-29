/**
 * Compares the before-hike baseline against what came back down.
 *
 * Per product: matched = min(after, before). Anything short of the baseline is
 * missing; anything above it is extra and never counts against the hiker.
 * The returned percentage is matched items over baseline items.
 */
export function compareDetections(baseline = [], after = [], { manualOverride = false } = {}) {
  const ids = [];
  baseline.forEach((i) => ids.includes(i.id) || ids.push(i.id));
  after.forEach((i) => ids.includes(i.id) || ids.push(i.id));

  let baseTotal = 0;
  let matched = 0;
  let missing = 0;
  let extra = 0;

  const rows = ids.map((id) => {
    const before = baseline.find((i) => i.id === id)?.qty || 0;
    const afterQty = after.find((i) => i.id === id)?.qty || 0;
    baseTotal += before;
    matched += Math.min(afterQty, before);
    if (afterQty < before) missing += before - afterQty;
    if (afterQty > before) extra += afterQty - before;
    return {
      id,
      before,
      after: afterQty,
      status: afterQty >= before ? (afterQty > before ? 'extra' : 'matched') : 'missing',
    };
  });

  const pct = manualOverride ? 100 : (baseTotal ? Math.round((matched / baseTotal) * 100) : 0);

  return {
    rows,
    pct,
    baseTotal,
    matched: manualOverride ? baseTotal : matched,
    missing: manualOverride ? 0 : missing,
    extra,
  };
}

/** Missing items float to the top of the breakdown so they are seen first. */
export function sortByStatus(rows) {
  return [...rows].sort(
    (a, b) => (a.status === 'missing' ? -1 : 0) - (b.status === 'missing' ? -1 : 0),
  );
}
