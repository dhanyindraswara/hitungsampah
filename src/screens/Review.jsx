import { useMemo, useRef } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { catalog, findProduct, productLabel } from '../data/catalog';
import { LOW_CONFIDENCE } from '../lib/detector';
import { GPS_PLACEHOLDER, formatTime } from '../lib/session';
import Sheet from '../components/Sheet';

function AddItemSheet() {
  const { state, t, actions } = useApp();
  const query = state.q.trim().toLowerCase();
  const results = catalog
    .map((product) => ({ ...product, label: productLabel(product, t) }))
    .filter((product) => !query || product.label.toLowerCase().includes(query));

  return (
    <Sheet title={t.addManual} onClose={actions.closeSheet} closeLabel={t.close}>
      <div className="search-box" style={{ marginTop: 14, background: 'var(--surface-quiet)' }}>
        <Icon name="search" size={19} stroke="#7A7A7A" />
        <input
          className="search-box__input"
          value={state.q}
          placeholder={t.searchProduct}
          aria-label={t.searchProduct}
          onChange={(e) => actions.setQuery(e.target.value)}
        />
      </div>

      <div className="sheet__list">
        {results.map((product) => (
          <button
            key={product.id}
            type="button"
            className="sheet__row"
            onClick={() => actions.addProduct(product.id)}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                flex: 'none',
                background: `linear-gradient(135deg,${product.c} 0%,${product.c2} 100%)`,
              }}
            />
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{product.label}</span>
            <Icon name="plus" size={18} stroke="#14563C" strokeWidth={2.2} />
          </button>
        ))}
        {!results.length ? (
          <div style={{ padding: '18px 4px', fontSize: 13.5, color: 'var(--text-muted)' }}>
            {t.noProduct}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}

/** The stills that back this count. They never leave the device. */
function PhotoStrip() {
  const { state, t } = useApp();
  const shots = state.photos.filter((photo) => photo.url);
  if (!shots.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {state.photos.length} {t.photos} · {t.photosLocal}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {shots.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            style={{
              width: 76,
              height: 76,
              flex: 'none',
              objectFit: 'cover',
              borderRadius: 16,
              border: '1px solid var(--line)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Review() {
  const { state, t, actions, detector } = useApp();
  const capturedAt = useRef(formatTime());

  const items = useMemo(
    () =>
      state.items.map((item) => {
        const product = findProduct(item.id);
        const low = item.cf < LOW_CONFIDENCE;
        return {
          ...item,
          label: productLabel(product, t),
          c: product.c,
          c2: product.c2,
          badgeBg: low ? 'var(--warn-bg)' : 'var(--surface-mint-soft)',
          badgeFg: low ? 'var(--warn-ink)' : 'var(--brand-bright)',
          badgeLabel: low ? t.lowConf : t.goodConf,
        };
      }),
    [state.items, t],
  );

  const total = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <div className="screen screen--review">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="icon-btn icon-btn--back"
            aria-label={t.back}
            onClick={() => actions.backToCamera(state.mode)}
          >
            <Icon name="chevronLeft" size={22} stroke="#1F1F1F" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.015em' }}>
              {detector.autoCounts ? t.reviewTitle : t.countTitle}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>
              {state.mode === 'before' ? t.stageBefore : t.stageAfter}
            </div>
          </div>
        </div>

        <div
          className="glass"
          style={{ marginTop: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}
        >
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: 'var(--brand)' }}>
              {total}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{t.totalItems}</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--line)' }} />
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: 'var(--brand)' }}>
              {items.length}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{t.kinds}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'right', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t.gpsNote}
            <br />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {GPS_PLACEHOLDER} · {capturedAt.current}
            </span>
          </div>
        </div>

        <PhotoStrip />

        <p
          style={{
            margin: '20px 2px 12px',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            textWrap: 'pretty',
          }}
        >
          {detector.autoCounts ? t.reviewSub : t.countSub}
        </p>

        {!items.length ? (
          <div
            style={{
              padding: '26px 20px',
              borderRadius: 22,
              border: '1px dashed var(--line-dashed)',
              background: 'rgba(255,255,255,.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t.countEmpty}</div>
            <div
              style={{
                marginTop: 5,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'var(--text-muted)',
                textWrap: 'pretty',
              }}
            >
              {t.countEmptySub}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => (
              <div key={item.id} className="card item-card">
                <div
                  className="item-card__thumb"
                  style={{ background: `linear-gradient(135deg,${item.c} 0%,${item.c2} 100%)` }}
                >
                  <div className="item-card__gloss" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-card__name">{item.label}</div>
                  <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="conf-badge" style={{ background: item.badgeBg, color: item.badgeFg }}>
                      {item.cf}%
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{item.badgeLabel}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
                  <button
                    type="button"
                    className="qty-btn btn-quiet"
                    aria-label={`${item.label} −`}
                    onClick={() => actions.dec(item.id)}
                  >
                    <Icon name="minus" size={17} stroke="#1F1F1F" strokeWidth={2.4} />
                  </button>
                  <div className="item-card__qty">{item.qty}</div>
                  <button
                    type="button"
                    className="qty-btn btn-mint"
                    aria-label={`${item.label} +`}
                    onClick={() => actions.inc(item.id)}
                  >
                    <Icon name="plus" size={17} stroke="#14563C" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label={`${t.remove} ${item.label}`}
                    onClick={() => actions.remove(item.id)}
                  >
                    <Icon name="trash" size={17} stroke="#B9433A" strokeWidth={1.9} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="add-manual" onClick={() => actions.openSheet('add')}>
          <Icon name="plus" size={18} stroke="#14563C" strokeWidth={2.2} />
          {t.addManual}
        </button>
      </div>

      <div className="dock">
        <div className="dock__inner">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!items.length}
            style={{ opacity: items.length ? 1 : 0.45 }}
            onClick={actions.saveReview}
          >
            {state.mode === 'before' ? t.saveBaseline : t.saveAfter}
          </button>
        </div>
      </div>

      {state.sheet === 'add' ? <AddItemSheet /> : null}
    </>
  );
}
