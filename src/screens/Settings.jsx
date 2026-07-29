import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Sheet from '../components/Sheet';
import { useApp } from '../state/AppContext';
import { APP_VERSION } from '../lib/version';
import { tripsToCsv, downloadText } from '../lib/export';

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Switch({ on, label, onToggle }) {
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{ background: on ? 'var(--brand)' : 'var(--line-chip)' }}
      onClick={onToggle}
    >
      <span className="switch__knob" style={{ left: on ? 24 : 3 }} />
    </button>
  );
}

function OfflineSheet() {
  const { t, actions } = useApp();
  const [report, setReport] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    actions.storageReport().then((value) => !cancelled && setReport(value));
    return () => {
      cancelled = true;
    };
  }, [actions]);

  const rows = [
    { k: t.tripsStored, v: report ? `${report.trips} ${t.tripsUnit}` : '…' },
    { k: t.photoSets, v: report ? String(report.photoSets) : '…' },
    { k: t.storageUsed, v: report ? formatBytes(report.bytes) ?? t.unknownSize : '…' },
  ];

  return (
    <Sheet title={t.sOffline} subtitle={t.offlineSheetSub} onClose={actions.closeSheet} closeLabel={t.close}>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.k} className="kv-row">
            <span className="kv-row__key">{row.k}</span>
            <span className="kv-row__value">{row.v}</span>
          </div>
        ))}
      </div>

      {confirming ? (
        <div className="notice" style={{ marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t.clearConfirmTitle}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5, color: 'var(--warn-body)' }}>
              {t.clearConfirmBody}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: 44, fontSize: 14 }}
                onClick={() => setConfirming(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn"
                style={{ height: 44, fontSize: 14, background: 'var(--danger)', color: '#fff' }}
                onClick={actions.clearAllData}
              >
                {t.clearNow}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 18, color: 'var(--danger)', borderColor: '#E8CFCB' }}
          onClick={() => setConfirming(true)}
        >
          {t.clearData}
        </button>
      )}
    </Sheet>
  );
}

function TextSheet({ title, body }) {
  const { t, actions } = useApp();
  return (
    <Sheet title={title} onClose={actions.closeSheet} closeLabel={t.close}>
      <div
        style={{
          marginTop: 14,
          fontSize: 13.5,
          lineHeight: 1.65,
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-line',
          textWrap: 'pretty',
        }}
      >
        {body}
      </div>
    </Sheet>
  );
}

export default function Settings() {
  const { state, t, actions } = useApp();
  const [exported, setExported] = useState(false);

  const exportTrips = () => {
    if (!state.trips.length) return;
    downloadText(`hitungsampah-${state.trips.length}-trip.csv`, tripsToCsv(state.trips, t));
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const rows = [
    {
      key: 'offline',
      title: t.sOffline,
      sub: t.sOfflineSub.replace('{n}', String(state.trips.length)),
      onClick: () => actions.openSheet('offline'),
    },
    {
      key: 'export',
      title: t.sExport,
      sub: exported ? t.exportDone : state.trips.length ? t.sExportSub : t.exportEmpty,
      onClick: exportTrips,
      disabled: !state.trips.length,
      icon: 'install',
    },
    { key: 'about', title: t.sAbout, sub: t.sAboutSub, onClick: () => actions.openSheet('about') },
    { key: 'privacy', title: t.sPrivacy, sub: t.sPrivacySub, onClick: () => actions.openSheet('privacy') },
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
            <div className="settings-row__title">{t.demoMode}</div>
            <div className="settings-row__sub">{t.demoModeSub}</div>
          </div>
          <Switch on={state.demo} label={t.demoMode} onToggle={actions.toggleDemo} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__title">{t.darkMode}</div>
            <div className="settings-row__sub">{t.darkNote}</div>
          </div>
          <Switch on={state.dark} label={t.darkMode} onToggle={actions.toggleDark} />
        </div>

        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            className="settings-row settings-row--action"
            disabled={row.disabled}
            style={{ opacity: row.disabled ? 0.5 : 1 }}
            onClick={row.onClick}
          >
            <div style={{ textAlign: 'left' }}>
              <div className="settings-row__title">{row.title}</div>
              <div className="settings-row__sub">{row.sub}</div>
            </div>
            <Icon name={row.icon || 'chevronRight'} size={19} stroke="#C2C8C2" style={{ flex: 'none' }} />
          </button>
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

      {state.sheet === 'offline' ? <OfflineSheet /> : null}
      {state.sheet === 'about' ? <TextSheet title={t.sAbout} body={t.aboutBody.replace('{v}', APP_VERSION)} /> : null}
      {state.sheet === 'privacy' ? <TextSheet title={t.sPrivacy} body={t.privacyBody} /> : null}
    </div>
  );
}
