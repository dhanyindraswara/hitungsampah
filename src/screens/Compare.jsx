import { useMemo } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { sortByStatus } from '../lib/compare';
import { findProduct, productLabel } from '../data/catalog';

const STATUS_STYLE = {
  matched: { dot: '#2FA36B', border: '#DCE9E1', key: 'stMatched' },
  missing: { dot: '#D08A1E', border: '#F2E2C6', key: 'stMissing' },
  extra: { dot: '#3568B0', border: '#DCE5F2', key: 'stExtra' },
};

export default function Compare() {
  const { state, t, comparison, actions } = useApp();
  const complete = comparison.pct >= 100;
  const ringColor = complete ? '#2FA36B' : '#D08A1E';

  const rows = useMemo(
    () =>
      sortByStatus(comparison.rows).map((row) => {
        const style = STATUS_STYLE[row.status];
        return {
          ...row,
          ...style,
          label: productLabel(findProduct(row.id), t),
          statusLabel: t[style.key],
        };
      }),
    [comparison.rows, t],
  );

  return (
    <>
      <div className="screen screen--compare">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.015em' }}>{t.compareTitle}</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{state.trip.id}</span>
        </div>

        <div
          className="glass glass--strong"
          style={{
            marginTop: 18,
            padding: '24px 18px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'pop .34s var(--ease-out-quint) both',
          }}
        >
          <div
            className="ring"
            style={{ background: `conic-gradient(${ringColor} ${comparison.pct}%, #E4E9E5 0)` }}
            role="img"
            aria-label={`${comparison.pct}% ${t.returned}`}
          >
            <div className="ring__core">
              <div className="ring__pct" style={{ color: ringColor }}>
                {comparison.pct}%
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  maxWidth: 100,
                  lineHeight: 1.3,
                }}
              >
                {t.returned}
              </div>
            </div>
          </div>

          <div className="sum-grid">
            <div className="sum-tile" style={{ background: 'var(--surface-mint-soft)' }}>
              <div className="sum-tile__value" style={{ color: 'var(--brand-bright)' }}>
                {comparison.matched}
              </div>
              <div className="sum-tile__label" style={{ color: 'var(--text-mint-ink)' }}>{t.matched}</div>
            </div>
            <div className="sum-tile" style={{ background: 'var(--warn-bg)' }}>
              <div className="sum-tile__value" style={{ color: 'var(--warn-ink)' }}>
                {comparison.missing}
              </div>
              <div className="sum-tile__label" style={{ color: 'var(--warn-label)' }}>{t.missingS}</div>
            </div>
            <div className="sum-tile" style={{ background: 'var(--info-bg)' }}>
              <div className="sum-tile__value" style={{ color: 'var(--info-ink)' }}>
                {comparison.extra}
              </div>
              <div className="sum-tile__label" style={{ color: 'var(--info-label)' }}>{t.extraS}</div>
            </div>
          </div>
        </div>

        {!complete ? (
          <div className="notice" style={{ marginTop: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                background: 'var(--warn-icon-bg)',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <Icon name="warning" size={20} stroke="#A9761C" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em' }}>{t.failTitle}</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--warn-body)',
                  textWrap: 'pretty',
                }}
              >
                {t.failSub}
              </div>
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          <div style={{ fontSize: 15.5, fontWeight: 700 }}>{t.itemBreakdown}</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{t.before}</span>
            <span>{t.after}</span>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <div key={row.id} className="compare-row" style={{ border: `1px solid ${row.border}` }}>
              <div className="compare-row__bar" style={{ background: row.dot }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="compare-row__name">{row.label}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: row.dot }}>
                  {row.statusLabel}
                </div>
              </div>
              <div className="compare-row__counts">
                <span style={{ minWidth: 26, textAlign: 'right', fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {row.before}
                </span>
                <Icon name="arrowRight" size={15} stroke="#C2C8C2" strokeWidth={2.2} />
                <span style={{ minWidth: 26, textAlign: 'right', fontSize: 17, fontWeight: 800, color: row.dot }}>
                  {row.after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dock">
        <div className="dock__inner dock__inner--stack">
          {complete ? (
            <button type="button" className="btn btn-primary" onClick={actions.toPass}>
              {t.seeResult}
              <Icon name="arrowRight" size={19} stroke="#D6FD91" strokeWidth={2.2} />
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={actions.retake}>
                <Icon name="camera" size={20} stroke="#D6FD91" />
                {t.retake}
              </button>
              <button type="button" className="btn btn-secondary" onClick={actions.confirmManual}>
                {t.confirmManual}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
