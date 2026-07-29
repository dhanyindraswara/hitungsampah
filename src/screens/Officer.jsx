import { useMemo, useRef } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { qrGrid } from '../lib/qr';
import { gateQueue } from '../data/seedTrips';
import { formatTime } from '../lib/session';

export default function Officer() {
  const { state, t, comparison, actions } = useApp();
  const { trip } = state;
  const complete = comparison.pct >= 100;
  const grid = useMemo(() => qrGrid(trip.id), [trip.id]);
  const signedAt = useRef(null);
  if (state.verified && !signedAt.current) signedAt.current = formatTime();

  const details = [
    { k: t.fHiker, v: trip.hiker },
    { k: t.tripId, v: trip.id },
    { k: t.fMountain, v: `${trip.mtn} · ${trip.gate}` },
    { k: t.fGroup, v: `${trip.group} ${t.people}` },
    { k: t.returned, v: `${comparison.pct}% (${comparison.matched}/${comparison.baseTotal})` },
  ];

  const verdictLabel = state.manual ? t.passChipManual : complete ? t.labelPass : t.labelFail;

  return (
    <>
      <div className="screen screen--officer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="icon-btn icon-btn--back"
            aria-label={t.back}
            onClick={() => actions.navigate(state.after ? 'pass' : 'home')}
          >
            <Icon name="chevronLeft" size={22} stroke="#1F1F1F" />
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.015em' }}>{t.officerTitle}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{t.officerSub}</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: 28,
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div className="qr-card">
            <div className="qr-grid" role="img" aria-label={`${t.tripId} ${trip.id}`}>
              {grid.map((row, r) => (
                <div key={r} className="qr-grid__row">
                  {row.map((on, c) => (
                    <div
                      key={c}
                      className="qr-grid__cell"
                      style={{ background: on ? '#14563C' : '#FFFFFF' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, letterSpacing: '.02em' }}>{trip.id}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.qrHint}</div>
        </div>

        <div className="glass glass--quiet" style={{ marginTop: 14, padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {details.map((row) => (
              <div key={row.k} className="kv-row">
                <span className="kv-row__key">{row.k}</span>
                <span className="kv-row__value">{row.v}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.verdict}</span>
            <span
              className="status-pill"
              style={{
                background: complete ? 'var(--surface-mint-soft)' : 'var(--warn-bg)',
                color: complete ? 'var(--brand-bright)' : 'var(--warn-ink)',
              }}
            >
              {verdictLabel}
            </span>
          </div>
        </div>

        {state.verified ? (
          <div
            style={{
              marginTop: 14,
              padding: 18,
              borderRadius: 24,
              background: 'var(--surface-mint-soft)',
              border: '1px solid var(--ok-line-strong)',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              animation: 'fu .3s var(--ease-out-quint) both',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                background: 'var(--brand)',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <Icon name="check" size={24} stroke="#D6FD91" strokeWidth={2.6} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em', color: 'var(--brand)' }}>
                {t.verified}
              </div>
              <div style={{ marginTop: 3, fontSize: 12.5, color: 'var(--text-mint-ink)' }}>
                {t.signedBy} · Pos {trip.gate} · {signedAt.current}
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 22, fontSize: 15.5, fontWeight: 700 }}>{t.queue}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gateQueue.map((entry) => (
            <div key={entry.id} className="queue-row">
              <div className="queue-row__avatar">{entry.ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{entry.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                  {entry.id} · {entry.group}
                </div>
              </div>
              <span
                className="queue-row__status"
                style={{
                  background:
                    entry.st === 'qVerified'
                      ? 'var(--surface-mint-soft)'
                      : entry.st === 'qScanning'
                        ? 'var(--surface-mint)'
                        : 'var(--surface-quiet)',
                  color:
                    entry.st === 'qVerified'
                      ? 'var(--brand-bright)'
                      : entry.st === 'qScanning'
                        ? 'var(--brand)'
                        : 'var(--text-muted)',
                }}
              >
                {t[entry.st]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dock">
        <div className="dock__inner">
          <button
            type="button"
            className="btn btn-verify"
            style={{
              background: state.verified ? '#FFFFFF' : 'var(--brand)',
              color: state.verified ? 'var(--brand)' : '#FFFFFF',
            }}
            onClick={state.verified ? actions.finishTrip : actions.verify}
          >
            {state.verified ? t.done : t.verify}
          </button>
        </div>
      </div>
    </>
  );
}
