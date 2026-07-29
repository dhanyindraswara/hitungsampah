import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { detector, SCAN_SPEED_MS, PROCESS_PHASE_MS, SPLASH_MS } from '../lib/detector';
import { compareDetections } from '../lib/compare';
import { KEYS, readValue, writeValue } from '../lib/storage';
import { seedTrips, gateOptions } from '../data/seedTrips';
import { createSampleTrip } from '../lib/trip';
import { getStrings, DEFAULT_LANGUAGE } from '../data/strings';

const AppContext = createContext(null);

const initialState = {
  screen: 'splash',
  lang: DEFAULT_LANGUAGE,
  dark: false,
  hydrated: false,

  trips: [],
  trip: createSampleTrip(),
  active: false,

  mode: 'before',
  attempt: 1,
  revealed: 0,
  shots: 0,
  phase: 0,

  items: [],
  baseline: null,
  after: null,

  manual: false,
  verified: false,

  sheet: false,
  q: '',
  hq: '',
  filter: 'all',
};

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true };

    case 'ready':
      return { ...state, screen: state.screen === 'splash' ? 'home' : state.screen };

    case 'navigate':
      return { ...state, screen: action.screen, sheet: false };

    case 'startCamera':
      return {
        ...state,
        screen: 'cam',
        mode: action.mode,
        revealed: 0,
        shots: 0,
        ...(action.attempt ? { attempt: action.attempt } : null),
      };

    case 'reveal': {
      const total = detector.scene(state.mode, state.attempt).length;
      if (state.revealed >= total) return state;
      return { ...state, revealed: state.revealed + 1 };
    }

    case 'capture':
      return { ...state, shots: state.shots + 1 };

    case 'process':
      return { ...state, screen: 'proc', phase: 0, shots: Math.max(1, state.shots) };

    case 'processPhase':
      return { ...state, phase: Math.min(2, state.phase + 1) };

    case 'processDone':
      return { ...state, screen: 'review', items: detector.detect(state.mode, state.attempt) };

    case 'bumpItem':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: Math.max(0, i.qty + action.delta), cf: 100 } : i,
        ),
      };

    case 'removeItem':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case 'openSheet':
      return { ...state, sheet: true, q: '' };

    case 'closeSheet':
      return { ...state, sheet: false };

    case 'setQuery':
      return { ...state, q: action.value };

    case 'addProduct': {
      const existing = state.items.find((i) => i.id === action.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1, cf: 100 } : i))
        : [...state.items, { id: action.id, qty: 1, cf: 100 }];
      return { ...state, items, sheet: false };
    }

    case 'saveReview':
      return state.mode === 'before'
        ? { ...state, baseline: state.items, active: true, screen: 'home' }
        : { ...state, after: state.items, screen: 'compare' };

    case 'confirmManual':
      return { ...state, manual: true, screen: 'pass' };

    case 'finishTrip':
      return {
        ...state,
        screen: 'home',
        trips: action.trips,
        trip: createSampleTrip(),
        active: false,
        attempt: 1,
        manual: false,
        verified: false,
        items: [],
        baseline: null,
        after: null,
        shots: 0,
      };

    case 'verify':
      return { ...state, verified: true };

    case 'patchTrip':
      return { ...state, trip: { ...state.trip, [action.field]: action.value } };

    case 'setHistoryQuery':
      return { ...state, hq: action.value };

    case 'setFilter':
      return { ...state, filter: action.value };

    case 'setLang':
      return { ...state, lang: action.value };

    case 'toggleDark':
      return { ...state, dark: !state.dark };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = state.hydrated;

  // ---- Load from device storage -------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [trips, settings] = await Promise.all([
        readValue(KEYS.trips, null),
        readValue(KEYS.settings, null),
      ]);
      if (cancelled) return;
      dispatch({
        type: 'hydrate',
        payload: {
          trips: trips ?? seedTrips,
          lang: settings?.lang ?? DEFAULT_LANGUAGE,
          dark: settings?.dark ?? false,
        },
      });
      if (!trips) writeValue(KEYS.trips, seedTrips);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) writeValue(KEYS.settings, { lang: state.lang, dark: state.dark });
  }, [hydrated, state.lang, state.dark]);

  useEffect(() => {
    if (hydrated) writeValue(KEYS.trips, state.trips);
  }, [hydrated, state.trips]);

  // ---- Timed transitions ---------------------------------------------------
  useEffect(() => {
    if (state.screen !== 'splash') return undefined;
    const id = setTimeout(() => dispatch({ type: 'ready' }), SPLASH_MS);
    return () => clearTimeout(id);
  }, [state.screen]);

  // Live overlay: one more box lights up every scan tick until the frame is
  // fully read, mirroring on-device inference streaming its results.
  useEffect(() => {
    if (state.screen !== 'cam') return undefined;
    const total = detector.scene(state.mode, state.attempt).length;
    let revealed = 0;
    const id = setInterval(() => {
      revealed += 1;
      dispatch({ type: 'reveal' });
      if (revealed >= total) clearInterval(id);
    }, SCAN_SPEED_MS);
    return () => clearInterval(id);
  }, [state.screen, state.mode, state.attempt]);

  useEffect(() => {
    if (state.screen !== 'proc') return undefined;
    const id = setTimeout(
      () => dispatch({ type: state.phase >= 2 ? 'processDone' : 'processPhase' }),
      PROCESS_PHASE_MS,
    );
    return () => clearTimeout(id);
  }, [state.screen, state.phase]);

  // ---- Derived -------------------------------------------------------------
  const t = useMemo(() => getStrings(state.lang), [state.lang]);

  const comparison = useMemo(
    () => compareDetections(state.baseline ?? [], state.after ?? [], { manualOverride: state.manual }),
    [state.baseline, state.after, state.manual],
  );

  const comparisonRef = useRef(comparison);
  comparisonRef.current = comparison;
  const tripRef = useRef(state.trip);
  tripRef.current = state.trip;
  const tripsRef = useRef(state.trips);
  tripsRef.current = state.trips;

  const actions = useMemo(
    () => ({
      navigate: (screen) => dispatch({ type: 'navigate', screen }),
      startBefore: () => dispatch({ type: 'startCamera', mode: 'before' }),
      scanAfter: () => dispatch({ type: 'startCamera', mode: 'after' }),
      retake: () => dispatch({ type: 'startCamera', mode: 'after', attempt: 2 }),
      backToCamera: (mode) => dispatch({ type: 'startCamera', mode }),
      capture: () => dispatch({ type: 'capture' }),
      finishCapture: () => dispatch({ type: 'process' }),
      inc: (id) => dispatch({ type: 'bumpItem', id, delta: 1 }),
      dec: (id) => dispatch({ type: 'bumpItem', id, delta: -1 }),
      remove: (id) => dispatch({ type: 'removeItem', id }),
      openSheet: () => dispatch({ type: 'openSheet' }),
      closeSheet: () => dispatch({ type: 'closeSheet' }),
      setQuery: (value) => dispatch({ type: 'setQuery', value }),
      addProduct: (id) => dispatch({ type: 'addProduct', id }),
      saveReview: () => dispatch({ type: 'saveReview' }),
      toPass: () => dispatch({ type: 'navigate', screen: 'pass' }),
      confirmManual: () => dispatch({ type: 'confirmManual' }),
      verify: () => dispatch({ type: 'verify' }),
      patchTrip: (field, value) => dispatch({ type: 'patchTrip', field, value }),
      setGate: (value) => dispatch({ type: 'patchTrip', field: 'gate', value }),
      setGroup: (delta) =>
        dispatch({
          type: 'patchTrip',
          field: 'group',
          value: Math.min(20, Math.max(1, tripRef.current.group + delta)),
        }),
      setHistoryQuery: (value) => dispatch({ type: 'setHistoryQuery', value }),
      setFilter: (value) => dispatch({ type: 'setFilter', value }),
      setLang: (value) => dispatch({ type: 'setLang', value }),
      toggleDark: () => dispatch({ type: 'toggleDark' }),
      finishTrip: () => {
        const trip = tripRef.current;
        const cmp = comparisonRef.current;
        // Nothing was scanned (the officer screen can be opened straight from
        // Home), so there is no trip to file — just reset.
        if (!cmp.baseTotal) {
          dispatch({ type: 'finishTrip', trips: tripsRef.current });
          return;
        }
        const completed = {
          id: trip.id,
          mtn: trip.mtn,
          gate: trip.gate,
          date: trip.climb,
          pct: cmp.pct,
          items: cmp.baseTotal,
        };
        dispatch({ type: 'finishTrip', trips: [completed, ...tripsRef.current] });
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, t, comparison, actions, gateOptions }),
    [state, t, comparison, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
