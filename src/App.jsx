import { useApp } from './state/AppContext';
import BottomNav from './components/BottomNav';
import Splash from './screens/Splash';
import Home from './screens/Home';
import NewTrip from './screens/NewTrip';
import Camera from './screens/Camera';
import Processing from './screens/Processing';
import Review from './screens/Review';
import Compare from './screens/Compare';
import Pass from './screens/Pass';
import Officer from './screens/Officer';
import History from './screens/History';
import Settings from './screens/Settings';

const SCREENS = {
  splash: Splash,
  home: Home,
  newtrip: NewTrip,
  cam: Camera,
  proc: Processing,
  review: Review,
  compare: Compare,
  pass: Pass,
  officer: Officer,
  history: History,
  settings: Settings,
};

// The tab bar only belongs to the three top-level destinations; task flows
// (camera, review, comparison) own the full screen.
const TABBED_SCREENS = ['home', 'history', 'settings'];

export default function App() {
  const { state } = useApp();
  const Screen = SCREENS[state.screen] || Home;

  return (
    <div className="app-shell">
      <div className="frame">
        <div className="halo halo--primary" />
        <div className="halo halo--teal" />
        <Screen />
        {TABBED_SCREENS.includes(state.screen) ? <BottomNav /> : null}
      </div>
    </div>
  );
}
