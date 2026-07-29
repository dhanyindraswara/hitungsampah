import { useApp } from '../state/AppContext';
import { detector } from '../lib/detector';
import { findProduct } from '../data/catalog';

const PROGRESS = ['34%', '68%', '94%'];

export default function Processing() {
  const { state, t } = useApp();
  const scene = detector.scene(state.mode, state.attempt);
  const message = [t.proc1, t.proc2, t.proc3][state.phase] || t.proc3;

  return (
    <div className="screen screen--center" style={{ gap: 24 }}>
      <div className="proc__thumb">
        {scene.map((box, index) => (
          <div
            key={`${box.id}-${index}`}
            style={{
              position: 'absolute',
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              borderRadius: 4,
              background: findProduct(box.id).c,
              opacity: 0.9,
            }}
          />
        ))}
        <div className="proc__shimmer" />
      </div>

      <div style={{ textAlign: 'center' }} aria-live="polite">
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.01em' }}>{message}</div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-muted)' }}>
          {state.shots} {t.photos} · {t.onDevice}
        </div>
      </div>

      <div className="proc__track">
        <div className="proc__fill" style={{ width: PROGRESS[state.phase] || '94%' }} />
      </div>
    </div>
  );
}
