import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { chipStyle, decorateTrip } from '../lib/tripView';

export default function History() {
  const { state, t, actions } = useApp();
  const query = state.hq.trim().toLowerCase();

  const trips = state.trips
    .filter((trip) => !query || trip.mtn.toLowerCase().includes(query) || trip.id.toLowerCase().includes(query))
    .filter((trip) => {
      if (state.filter === 'all') return true;
      return state.filter === 'pass' ? trip.pct >= 100 : trip.pct < 100;
    })
    .map((trip) => decorateTrip(trip, t));

  const filters = [
    { v: 'all', label: t.fAll },
    { v: 'pass', label: t.fPass },
    { v: 'fail', label: t.fFail },
  ];

  return (
    <div className="screen screen--history">
      <div className="screen-title">{t.historyTitle}</div>

      <div className="search-box card" style={{ marginTop: 14, boxShadow: 'var(--shadow-sm)' }}>
        <Icon name="search" size={19} stroke="#7A7A7A" />
        <input
          className="search-box__input"
          value={state.hq}
          placeholder={t.searchTrips}
          aria-label={t.searchTrips}
          onChange={(e) => actions.setHistoryQuery(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {filters.map((filter) => {
          const style = chipStyle(state.filter === filter.v);
          return (
            <button
              key={filter.v}
              type="button"
              className="chip chip--filter"
              style={{ ...style, border: `1px solid ${style.borderColor}` }}
              aria-pressed={state.filter === filter.v}
              onClick={() => actions.setFilter(filter.v)}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trips.map((trip) => (
          <div key={trip.id} className="card card--lift trip-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: trip.tint,
                  display: 'grid',
                  placeItems: 'center',
                  flex: 'none',
                }}
              >
                <Icon name="mountain" size={23} stroke={trip.ink} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="trip-card__title">{trip.mtn}</div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {trip.gate} · {trip.date}
                </div>
                <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="trip-card__track">
                    <div className="trip-card__fill" style={{ width: trip.bar, background: trip.ink }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: trip.ink }}>{trip.pct}%</span>
                </div>
              </div>
            </div>
            <div className="trip-card__footer">
              <span className="trip-card__badge" style={{ background: trip.tint, color: trip.ink }}>
                {trip.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                {trip.id} · {trip.items} {t.itemsShort}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
