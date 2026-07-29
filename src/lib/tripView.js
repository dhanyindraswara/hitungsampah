// Presentation helpers shared by Home and History.

/** A trip reads as complete only when every baseline item came back. */
export function decorateTrip(trip, t) {
  const complete = trip.pct >= 100;
  return {
    ...trip,
    tint: complete ? '#EAF6EF' : '#FDF1E3',
    ink: complete ? '#1E7A4F' : '#B8791F',
    label: complete ? t.labelPass : t.labelFail,
    bar: `${trip.pct}%`,
  };
}

/** Selected pill = solid brand; unselected = quiet outline. */
export function chipStyle(active) {
  return active
    ? { background: '#14563C', color: '#FFFFFF', borderColor: '#14563C' }
    : { background: '#FFFFFF', color: '#4A4A4A', borderColor: '#DDE2DD' };
}

export function tripStats(trips) {
  if (!trips.length) return { trips: 0, items: 0, avg: '0%' };
  return {
    trips: trips.length,
    items: trips.reduce((sum, trip) => sum + trip.items, 0),
    avg: `${Math.round(trips.reduce((sum, trip) => sum + trip.pct, 0) / trips.length)}%`,
  };
}
