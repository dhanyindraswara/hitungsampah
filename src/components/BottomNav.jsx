import Icon from './Icon';
import { useApp } from '../state/AppContext';

const TABS = [
  { screen: 'home', icon: 'home', key: 'navHome' },
  { screen: 'history', icon: 'mountain', key: 'navTrips' },
  { screen: 'settings', icon: 'settings', key: 'navSettings' },
];

export default function BottomNav() {
  const { state, t, actions } = useApp();

  return (
    <nav className="tabbar" aria-label={t.mainNav}>
      <div className="tabbar__inner">
        {TABS.map((tab) => {
          const active = state.screen === tab.screen;
          const ink = active ? '#14563C' : '#8A918A';
          return (
            <button
              key={tab.screen}
              type="button"
              className="tabbar__tab"
              aria-current={active ? 'page' : undefined}
              style={{ background: active ? 'var(--surface-mint)' : 'transparent' }}
              onClick={() => actions.navigate(tab.screen)}
            >
              <Icon name={tab.icon} size={22} stroke={ink} />
              <span className="tabbar__label" style={{ color: ink }}>
                {t[tab.key]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
