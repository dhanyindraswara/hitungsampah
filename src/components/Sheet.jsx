import { useEffect } from 'react';
import Icon from './Icon';

/** Bottom sheet: scrim click, Escape and the close button all dismiss it. */
export default function Sheet({ title, subtitle, onClose, closeLabel, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-scrim" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-.01em' }}>{title}</div>
            {subtitle ? (
              <div style={{ marginTop: 3, fontSize: 12.5, color: 'var(--text-muted)' }}>{subtitle}</div>
            ) : null}
          </div>
          <button type="button" className="qty-btn btn-quiet" aria-label={closeLabel} onClick={onClose}>
            <Icon name="close" size={18} stroke="#1F1F1F" strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
