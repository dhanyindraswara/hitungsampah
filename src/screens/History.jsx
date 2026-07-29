import { useState } from 'react';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import { useApp } from '../state/AppContext';
import { chipStyle, decorateTrip } from '../lib/tripView';
import { findProduct, productLabel } from '../data/catalog';
import { compareDetections, sortByStatus } from '../lib/compare';

const STATUS_INK = { matched: '#2FA36B', missing: '#D08A1E', extra: '#3568B0' };

/** Per-item breakdown for a finished trip, when the trip recorded one. */
function TripSheet({ trip, onClose }) {
  const { t } = useApp();
  const rows = trip.baseline
    ? sortByStatus(compareDetections(trip.baseline, trip.after || []).rows)
    : [];

  const summary = [
    { k: t.fHiker, v: trip.hiker || '—' },
    { k: t.fMountain, v: `${trip.mtn} · ${trip.gate}` },
    { k: t.fClimb, v: trip.date },
    { k: t.fGroup, v: trip.group ? `${trip.group} ${t.people}` : '—' },
    { k: t.returned, v: `${trip.pct}%` },
    { k: t.totalItems, v: `${trip.items} ${t.itemsShort}` },
  ];

  return (
    <Sheet title={trip.mtn} subtitle={trip.id} onClose={onClose} closeLabel={t.close}>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {summary.map((row) => (
          <div key={row.k} className="kv-row">
            <span className="kv-row__key">{row.k}</span>
            <span className="kv-row__value">{row.v}</span>
          </div>
        ))}
      </div>

      {rows.length ? (
        <>
          <div style={{ marginTop: 18, fontSize: 13.5, fontWeight: 700 }}>{t.itemBreakdown}</div>
          <div className="sheet__list">
            {rows.map((row) => (
              <div key={row.id} className="sheet__row" style={{ cursor: 'default' }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                  {productLabel(findProduct(row.id), t)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.before}</span>
                <Icon name="arrowRight" size={14} stroke="#C2C8C2" strokeWidth={2.2} />
                <span style={{ fontSize: 15, fontWeight: 800, color: STATUS_INK[row.status] }}>
                  {row.after}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.55, color: 'var(--text-muted)' }}>
          {t.noBreakdown}
        </div>
      )}
    </Sheet>
  );
}

export default function History() {
  const { state, t, actions } = useApp();
  const [open, setOpen] = useState(null);
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
          <button
            key={trip.id}
            type="button"
            className="card card--lift trip-card"
            style={{ width: '100%', textAlign: 'left', display: 'block' }}
            onClick={() => setOpen(trip)}
          >
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
          </button>
        ))}
        {!trips.length ? (
          <div
            style={{
              padding: '30px 20px',
              borderRadius: 22,
              border: '1px dashed var(--line-dashed)',
              textAlign: 'center',
              fontSize: 13.5,
              color: 'var(--text-muted)',
            }}
          >
            {t.noTrips}
          </div>
        ) : null}
      </div>

      {open ? <TripSheet trip={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
