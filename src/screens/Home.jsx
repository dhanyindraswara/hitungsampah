import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { decorateTrip, tripStats } from '../lib/tripView';

function ActiveTripCard() {
  const { state, t, actions } = useApp();
  const baseTotal = (state.baseline || []).reduce((sum, item) => sum + item.qty, 0);

  return (
    <div
      className="glass"
      style={{ marginTop: 22, padding: 18, animation: 'fu .35s var(--ease-out-quint) both' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="eyebrow">{t.activeTrip}</span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'var(--lime)',
            color: 'var(--brand-deep)',
          }}
        >
          {t.stepAfterDue}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: 19, fontWeight: 800, letterSpacing: '-.01em' }}>
        {state.trip.mtn}
      </div>
      <div style={{ marginTop: 3, fontSize: 13, color: 'var(--text-muted)' }}>
        {state.trip.id} · {state.trip.gate}
      </div>
      <div style={{ margin: '16px 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: 'linear-gradient(90deg,#2FA36B 0 50%,#E6E8EC 50% 100%)',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 18, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--brand)' }}>
          <Icon name="check" size={15} stroke="#2FA36B" strokeWidth={3} />
          {t.stepBefore} · {baseTotal} {t.itemsShort}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              border: '2px solid var(--line-step)',
              display: 'inline-block',
            }}
          />
          {t.stepAfter}
        </span>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-primary--md"
        style={{ marginTop: 16 }}
        onClick={actions.scanAfter}
      >
        <Icon name="camera" size={20} stroke="#D6FD91" />
        {t.scanAfterCta}
      </button>
    </div>
  );
}

export default function Home() {
  const { state, t, actions } = useApp();
  const stats = tripStats(state.trips);
  const recent = state.trips.slice(0, 2).map((trip) => decorateTrip(trip, t));

  return (
    <div className="screen screen--home">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ width: 44, height: 44 }}>
            <Icon name="mountain" size={24} stroke="#D6FD91" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.15 }}>
              Trash Return Tracker
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{t.tagline}</div>
          </div>
        </div>
        <button
          type="button"
          className="icon-btn icon-btn--shield"
          aria-label={t.officerTitle}
          onClick={() => actions.navigate('officer')}
        >
          <Icon name="shieldCheck" size={21} stroke="#14563C" />
        </button>
      </div>

      <p
        style={{
          margin: '22px 2px 0',
          fontSize: 27,
          fontWeight: 800,
          letterSpacing: '-.025em',
          lineHeight: 1.18,
          textWrap: 'balance',
        }}
      >
        {t.homeHead}
      </p>
      <p
        style={{
          margin: '8px 2px 0',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          textWrap: 'pretty',
        }}
      >
        {t.homeSub}
      </p>

      {state.active ? (
        <ActiveTripCard />
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-primary--xl"
          style={{ marginTop: 24 }}
          onClick={() => actions.navigate('newtrip')}
        >
          <Icon name="camera" size={23} stroke="#D6FD91" />
          {t.start}
        </button>
      )}

      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { value: stats.trips, label: t.stTrips },
          { value: stats.items, label: t.stItems },
          { value: stats.avg, label: t.stAvg },
        ].map((tile) => (
          <div key={tile.label} className="glass glass--tile stat-tile">
            <div className="stat-tile__value">{tile.value}</div>
            <div className="stat-tile__label">{tile.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div className="section-title">{t.recent}</div>
        <button type="button" className="link-btn" onClick={() => actions.navigate('history')}>
          {t.seeAll}
          <Icon name="arrowRight" size={15} stroke="#14563C" strokeWidth={2.2} />
        </button>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recent.map((trip) => (
          <button
            key={trip.id}
            type="button"
            className="card card--lift recent-row"
            onClick={() => actions.navigate('history')}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: trip.tint,
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <Icon name="mountain" size={22} stroke={trip.ink} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>{trip.mtn}</div>
              <div style={{ marginTop: 2, fontSize: 12.5, color: 'var(--text-muted)' }}>
                {trip.date} · {trip.items} {t.itemsShort}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: trip.ink }}>{trip.pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
