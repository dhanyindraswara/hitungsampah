import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { chipStyle } from '../lib/tripView';

function Field({ label, optional, name, value, onChange }) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {optional ? <span className="field__optional"> ({optional})</span> : null}
      </span>
      <input
        className="field__input"
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </label>
  );
}

export default function NewTrip() {
  const { state, t, actions, gateOptions } = useApp();
  const { trip } = state;
  const patch = actions.patchTrip;

  return (
    <>
      <div className="screen screen--newtrip">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="icon-btn icon-btn--back"
            aria-label={t.back}
            onClick={() => actions.navigate('home')}
          >
            <Icon name="chevronLeft" size={22} stroke="#1F1F1F" />
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>{t.newTrip}</div>
        </div>

        <div
          className="panel-mint"
          style={{
            marginTop: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="eyebrow">{t.tripId}</div>
            <div style={{ marginTop: 3, fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>
              {trip.id}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mint-ink)', textAlign: 'right', lineHeight: 1.35 }}>
            {t.autoGen}
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t.fHiker} name="hiker" value={trip.hiker} onChange={patch} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.fPhone} name="phone" value={trip.phone} onChange={patch} />
            <Field label={t.fId} optional={t.optional} name="nik" value={trip.nik} onChange={patch} />
          </div>

          <Field label={t.fMountain} name="mtn" value={trip.mtn} onChange={patch} />

          <div>
            <span className="field__label">{t.fGate}</span>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {gateOptions.map((gate) => {
                const style = chipStyle(trip.gate === gate);
                return (
                  <button
                    key={gate}
                    type="button"
                    className="chip"
                    style={{ ...style, border: `1px solid ${style.borderColor}` }}
                    aria-pressed={trip.gate === gate}
                    onClick={() => actions.setGate(gate)}
                  >
                    {gate}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.fClimb} name="climb" value={trip.climb} onChange={patch} />
            <Field label={t.fReturn} name="ret" value={trip.ret} onChange={patch} />
          </div>

          <div>
            <span className="field__label">{t.fGroup}</span>
            <div className="field__stepper">
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>
                {trip.group} {t.people}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="step-btn btn-quiet"
                  aria-label={`${t.fGroup} −`}
                  onClick={() => actions.setGroup(-1)}
                >
                  <Icon name="minus" size={18} stroke="#1F1F1F" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  className="step-btn btn-mint"
                  aria-label={`${t.fGroup} +`}
                  onClick={() => actions.setGroup(1)}
                >
                  <Icon name="plus" size={18} stroke="#14563C" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>

          <label className="field">
            <span className="field__label">
              {t.fNotes} <span className="field__optional">({t.optional})</span>
            </span>
            <textarea
              className="field__textarea"
              name="notes"
              rows={3}
              value={trip.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="dock">
        <div className="dock__inner">
          <button type="button" className="btn btn-primary" onClick={actions.startBefore}>
            {t.continueCam}
            <Icon name="arrowRight" size={19} stroke="#D6FD91" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}
