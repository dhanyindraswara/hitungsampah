import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { APP_VERSION } from '../lib/version';

export default function Settings() {
  const { state, t, actions } = useApp();

  const rows = [
    { k: t.sOffline, sub: t.sOfflineSub.replace('{n}', String(state.trips.length)) },
    { k: t.sExport, sub: t.sExportSub },
    { k: t.sAbout, sub: t.sAboutSub },
    { k: t.sPrivacy, sub: t.sPrivacySub },
  ];

  const languages = [
    { v: 'id', label: 'Bahasa Indonesia' },
    { v: 'en', label: 'English' },
  ];

  return (
    <div className="screen screen--settings">
      <div className="screen-title">{t.settingsTitle}</div>

      <div className="eyebrow" style={{ marginTop: 20 }}>{t.language}</div>
      <div className="segmented" role="group" aria-label={t.language}>
        {languages.map((option) => {
          const active = state.lang === option.v;
          return (
            <button
              key={option.v}
              type="button"
              className="segmented__option"
              aria-pressed={active}
              style={{
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-muted)',
                boxShadow: active ? 'var(--shadow-md)' : 'none',
              }}
              onClick={() => actions.setLang(option.v)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="settings-list">
        <div className="settings-row">
          <div>
            <div className="settings-row__title">{t.darkMode}</div>
            <div className="settings-row__sub">{t.darkNote}</div>
          </div>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={state.dark}
            aria-label={t.darkMode}
            style={{ background: state.dark ? 'var(--brand)' : 'var(--line-chip)' }}
            onClick={actions.toggleDark}
          >
            <span className="switch__knob" style={{ left: state.dark ? 24 : 3 }} />
          </button>
        </div>

        {rows.map((row) => (
          <div key={row.k} className="settings-row">
            <div>
              <div className="settings-row__title">{row.k}</div>
              <div className="settings-row__sub">{row.sub}</div>
            </div>
            <Icon name="chevronRight" size={19} stroke="#C2C8C2" style={{ flex: 'none' }} />
          </div>
        ))}
      </div>

      <div
        className="panel-mint"
        style={{ marginTop: 22, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}
      >
        <Icon name="install" size={20} stroke="#14563C" style={{ flex: 'none', marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{t.installTitle}</div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'var(--text-mint-ink)',
              textWrap: 'pretty',
            }}
          >
            {t.installSub}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11.5, color: 'var(--text-fainter)' }}>
        Trash Return Tracker · {APP_VERSION}
      </div>
    </div>
  );
}
