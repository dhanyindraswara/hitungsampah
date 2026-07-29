import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { findProduct, productShortLabel } from '../data/catalog';
import { tagPlacement } from '../lib/overlay';
import { useCamera } from '../lib/useCamera';

let photoSeq = 0;

/** The simulated scene, drawn only when the demo detector is active. */
function DemoScene({ boxes, revealed }) {
  return boxes.map((box, index) => (
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
  ));
}

/** Shown in place of the viewfinder when the camera cannot start. */
function CameraNotice({ title, body, actionLabel, onAction }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          background: 'rgba(255,255,255,.12)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="camera" size={26} stroke="#D6FD91" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.66)', maxWidth: 280 }}>
        {body}
      </div>
      {onAction ? (
        <button
          type="button"
          style={{
            marginTop: 4,
            height: 42,
            padding: '0 20px',
            borderRadius: 999,
            background: 'var(--lime)',
            color: 'var(--brand-deep)',
            fontSize: 14,
            fontWeight: 700,
          }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function Camera() {
  const { state, t, actions, detector } = useApp();
  const { mode, attempt, revealed, photos } = state;
  const demo = detector.autoCounts;

  const [grid, setGrid] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const { videoRef, status, capture, torchAvailable, torchOn, toggleTorch } = useCamera(!demo, retryNonce);

  const scene = useMemo(() => {
    if (!demo) return [];
    return detector.overlay(mode).map((box) => {
      const product = findProduct(box.id);
      return {
        ...box,
        colorFrom: product.c,
        colorTo: product.c2,
        name: productShortLabel(product, t),
        confidence: 0,
        placement: tagPlacement(box),
      };
    });
  }, [demo, detector, mode, t]);

  // Demo tags quote the scripted confidence; resolved lazily so the overlay and
  // the review list always agree.
  const [confidences, setConfidences] = useState({});
  useEffect(() => {
    if (!demo) return undefined;
    let cancelled = false;
    detector.detect({ mode, attempt, frames: [] }).then((items) => {
      if (!cancelled) setConfidences(Object.fromEntries(items.map((i) => [i.id, i.cf])));
    });
    return () => {
      cancelled = true;
    };
  }, [demo, detector, mode, attempt]);

  const live = status === 'live';
  const canShoot = demo || live;
  const canFinish = demo || photos.length > 0;

  const onShutter = async () => {
    if (demo) {
      // No camera in demo mode — the scripted frame stands in for a still.
      actions.capture({ id: `demo-${(photoSeq += 1)}`, url: null, w: 0, h: 0 });
      return;
    }
    const shot = await capture();
    if (shot) actions.capture({ id: `p-${(photoSeq += 1)}`, ...shot });
  };

  const last = photos[photos.length - 1];

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
          <button
            type="button"
            className="camera__tool"
            aria-label={t.flashLabel}
            aria-pressed={torchOn}
            disabled={!torchAvailable}
            title={torchAvailable ? t.flashLabel : t.flashUnavailable}
            style={{
              background: torchOn ? 'var(--lime)' : 'rgba(255,255,255,.12)',
              opacity: torchAvailable ? 1 : 0.38,
              cursor: torchAvailable ? 'pointer' : 'not-allowed',
            }}
            onClick={toggleTorch}
          >
            <Icon name="flash" size={19} stroke={torchOn ? '#173D26' : '#fff'} />
          </button>
          <button
            type="button"
            className="camera__tool"
            aria-label={t.gridLabel}
            aria-pressed={grid}
            style={{ background: grid ? 'var(--lime)' : 'rgba(255,255,255,.12)' }}
            onClick={() => setGrid((on) => !on)}
          >
            <Icon name="grid" size={19} stroke={grid ? '#173D26' : '#fff'} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="camera__hint">
        <Icon name="info" size={17} stroke="#D6FD91" style={{ flex: 'none', marginTop: 1 }} />
        <span>{mode === 'before' ? t.camBeforeHint : t.camAfterHint}</span>
      </div>

      <div className="camera__viewfinder">
        {!demo ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: live ? 1 : 0,
              transition: 'opacity .18s var(--ease-standard)',
            }}
          />
        ) : null}

        <div className="camera__vignette" />

        {demo ? (
          <>
            <DemoScene
              boxes={scene.map((box) => ({ ...box, confidence: confidences[box.id] ?? 70 }))}
              revealed={revealed}
            />
            <div className="camera__sweep" />
          </>
        ) : null}

        {grid ? (
          <div className="camera__grid" aria-hidden="true">
            <span style={{ left: '33.33%' }} />
            <span style={{ left: '66.66%' }} />
            <span style={{ top: '33.33%' }} />
            <span style={{ top: '66.66%' }} />
          </div>
        ) : null}

        {!demo && status === 'denied' ? (
          <CameraNotice
            title={t.camDeniedTitle}
            body={t.camDeniedBody}
            actionLabel={t.camRetry}
            onAction={() => setRetryNonce((n) => n + 1)}
          />
        ) : null}
        {!demo && (status === 'unsupported' || status === 'error') ? (
          <CameraNotice
            title={t.camUnsupportedTitle}
            body={t.camUnsupportedBody}
            actionLabel={t.camRetry}
            onAction={() => setRetryNonce((n) => n + 1)}
          />
        ) : null}
        {!demo && status === 'starting' ? (
          <CameraNotice title={t.camStarting} body={t.camStartingBody} />
        ) : null}

        <div className="camera__pill camera__pill--live" aria-live="polite">
          <span
            className="camera__live-dot"
            style={{ background: demo || live ? 'var(--lime)' : '#C2C8C2' }}
          />
          {demo ? `${Math.min(revealed, scene.length)} ${t.found}` : t[`camStatus_${status}`] || t.camStatus_idle}
        </div>

        {photos.length > 0 ? (
          <div className="camera__pill camera__pill--shots">
            <Icon name="image" size={15} stroke="#fff" />
            {photos.length} {t.photos}
          </div>
        ) : null}
      </div>

      <div className="camera__controls">
        <div className="camera__controls-row">
          <button
            type="button"
            className="camera__side-btn"
            style={{
              background: 'rgba(255,255,255,.12)',
              opacity: last ? 1 : 0.38,
              overflow: 'hidden',
              padding: 0,
            }}
            disabled={!last}
            aria-label={t.dropLastPhoto}
            onClick={() => last && actions.dropPhoto(last.id)}
          >
            {last?.url ? (
              <img
                src={last.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Icon name="image" size={22} stroke="#fff" strokeWidth={1.9} />
            )}
          </button>

          <button
            type="button"
            className="camera__shutter"
            disabled={!canShoot}
            style={{ opacity: canShoot ? 1 : 0.5 }}
            aria-label={mode === 'before' ? t.camBefore : t.camAfter}
            onClick={onShutter}
          >
            <span className="camera__shutter-core">
              <Icon name="camera" size={26} stroke="#D6FD91" />
            </span>
          </button>

          <button
            type="button"
            className="camera__side-btn"
            style={{ background: 'var(--lime)', opacity: canFinish ? 1 : 0.4 }}
            disabled={!canFinish}
            aria-label={t.done}
            onClick={actions.finishCapture}
          >
            <Icon name="check" size={24} stroke="#173D26" strokeWidth={2.6} />
          </button>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
          {canFinish ? t.camFooter : t.camNeedPhoto}
        </div>
      </div>
    </div>
  );
}
