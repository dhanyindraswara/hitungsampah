import { useMemo } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { detector } from '../lib/detector';
import { findProduct, productShortLabel } from '../data/catalog';
import { tagPlacement } from '../lib/overlay';

export default function Camera() {
  const { state, t, actions } = useApp();
  const { mode, attempt, revealed, shots } = state;

  const scene = useMemo(() => {
    const detections = detector.detect(mode, attempt);
    return detector.scene(mode, attempt).map((box) => {
      const product = findProduct(box.id);
      return {
        ...box,
        colorFrom: product.c,
        colorTo: product.c2,
        name: productShortLabel(product, t),
        confidence: detections.find((d) => d.id === box.id)?.cf ?? 70,
        placement: tagPlacement(box),
      };
    });
  }, [mode, attempt, t]);

  const liveCount = Math.min(revealed, scene.length);

  return (
    <div className="camera">
      <div className="camera__bar">
        <button
          type="button"
          className="icon-btn icon-btn--back"
          aria-label={t.back}
          onClick={() => actions.navigate('home')}
        >
          <Icon name="chevronLeft" size={22} stroke="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff' }}>
            {mode === 'before' ? t.camBefore : t.camAfter}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
            {state.trip.mtn} · {state.trip.id}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="camera__tool">
            <Icon name="flash" size={19} stroke="#fff" />
          </div>
          <div className="camera__tool">
            <Icon name="grid" size={19} stroke="#fff" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="camera__hint">
        <Icon name="info" size={17} stroke="#D6FD91" style={{ flex: 'none', marginTop: 1 }} />
        <span>{mode === 'before' ? t.camBeforeHint : t.camAfterHint}</span>
      </div>

      <div className="camera__viewfinder">
        <div className="camera__vignette" />

        {scene.map((box, index) => (
          <div
            key={`${box.id}-${index}`}
            className="camera__object"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              borderRadius: box.r,
              background: `linear-gradient(135deg,${box.colorFrom} 0%,${box.colorTo} 100%)`,
            }}
          >
            <div className="camera__gloss" style={{ borderRadius: box.r }} />
            {index < revealed ? (
              <div className="camera__box" style={{ borderRadius: box.r + 6 }}>
                {box.lab ? (
                  <div className="camera__tag" style={box.placement}>
                    {box.name}
                    <span style={{ opacity: 0.62 }}>{box.confidence}%</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}

        <div className="camera__sweep" />

        <div className="camera__pill camera__pill--live" aria-live="polite">
          <span className="camera__live-dot" />
          {liveCount} {t.found}
        </div>

        {shots > 0 ? (
          <div className="camera__pill camera__pill--shots">
            <Icon name="image" size={15} stroke="#fff" />
            {shots} {t.photos}
          </div>
        ) : null}
      </div>

      <div className="camera__controls">
        <div className="camera__controls-row">
          <button
            type="button"
            className="camera__side-btn"
            style={{ background: 'rgba(255,255,255,.12)' }}
            aria-label={t.photos}
            onClick={actions.capture}
          >
            <Icon name="image" size={22} stroke="#fff" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            className="camera__shutter"
            aria-label={mode === 'before' ? t.camBefore : t.camAfter}
            onClick={actions.capture}
          >
            <span className="camera__shutter-core">
              <Icon name="camera" size={26} stroke="#D6FD91" />
            </span>
          </button>
          <button
            type="button"
            className="camera__side-btn"
            style={{ background: 'var(--lime)' }}
            aria-label={t.done}
            onClick={actions.finishCapture}
          >
            <Icon name="check" size={24} stroke="#173D26" strokeWidth={2.6} />
          </button>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
          {t.camFooter}
        </div>
      </div>
    </div>
  );
}
