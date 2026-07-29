import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';

export default function Pass() {
  const { state, t, comparison, actions } = useApp();
  const { trip } = state;

  const summary = [
    { k: t.fMountain, v: trip.mtn },
    { k: t.fGate, v: trip.gate },
    { k: t.tripId, v: trip.id },
    { k: t.totalItems, v: `${comparison.baseTotal} ${t.itemsShort}` },
    { k: t.returned, v: `${comparison.pct}%` },
    { k: t.fGroup, v: `${trip.group} ${t.people}` },
  ];

  return (
    <>
      <div className="screen screen--pass">
        <div className="pass-medal">
          <div className="pass-medal__halo" />
          <div className="pass-medal__orbit" />
          <div className="pass-medal__disc">
            <Icon name="check" size={54} stroke="#D6FD91" strokeWidth={2.4} />
          </div>
        </div>

        <div className="lime-chip" style={{ marginTop: 10 }}>
          {state.manual ? t.passChipManual : t.passChip}
        </div>

        <h1
          style={{
            margin: '16px 0 0',
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-.03em',
            lineHeight: 1.15,
            textWrap: 'balance',
          }}
        >
          {t.passTitle}
        </h1>
        <p
          style={{
            margin: '10px 6px 0',
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
            maxWidth: 320,
            textWrap: 'pretty',
          }}
        >
          {t.passSub}
        </p>

        <div
          className="glass glass--strong"
          style={{ marginTop: 26, width: '100%', padding: 18, textAlign: 'left' }}
        >
          <div className="eyebrow">{t.tripSummary}</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {summary.map((row) => (
              <div key={row.k} className="kv-row">
                <span className="kv-row__key">{row.k}</span>
                <span className="kv-row__value">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dock">
        <div className="dock__inner dock__inner--stack">
          <button type="button" className="btn btn-primary" onClick={() => actions.navigate('officer')}>
            <Icon name="shieldCheck" size={20} stroke="#D6FD91" />
            {t.showOfficer}
          </button>
          <button type="button" className="btn btn-secondary" onClick={actions.finishTrip}>
            {t.finish}
          </button>
        </div>
      </div>
    </>
  );
}
