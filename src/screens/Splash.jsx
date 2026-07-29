import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';

export default function Splash() {
  const { t } = useApp();
  return (
    <div className="screen screen--center">
      <div className="brand-mark brand-mark--splash">
        <Icon name="mountainDetail" size={42} stroke="#D6FD91" strokeWidth={1.9} />
      </div>
      <div style={{ textAlign: 'center', animation: 'fu .6s var(--ease-out-quint) .1s both' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>Trash Return Tracker</div>
        <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)' }}>{t.tagline}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        <div className="spinner" />
        {t.loading}
      </div>
    </div>
  );
}
