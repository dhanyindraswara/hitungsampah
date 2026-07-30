import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  getDetector,
  manualDetector,
  visionDetector,
  scriptedDetector,
  SCAN_SPEED_MS,
  PROCESS_PHASE_MS,
  SPLASH_MS,
} from '../lib/detector';
import { compareDetections } from '../lib/compare';
import { KEYS, readValue, writeValue, deleteValue, listKeys, estimateUsage } from '../lib/storage';
import { seedTrips, gateOptions } from '../data/seedTrips';
import { createSampleTrip } from '../lib/trip';
import { getStrings, DEFAULT_LANGUAGE } from '../data/strings';

const AppContext = createContext(null);

const initialState = {
  screen: 'splash',
  lang: DEFAULT_LANGUAGE,
  dark: false,
  demo: false,
  auto: true,
  hydrated: false,

  trips: [],
  trip: createSampleTrip(),
  active: false,

  mode: 'before',
  attempt: 1,
  revealed: 0,
  phase: 0,
  photos: [],

  items: [],
  baseline: null,
  after: null,

  manual: false,
  verified: false,
  officerPick: null,

  sheet: null,
  q: '',
  hq: '',
  filter: 'all',
};

/** Object URLs are only valid while the page lives — release them on reset. */
function releasePhotos(photos = []) {
  photos.forEach((photo) => photo.url && URL.revokeObjectURL(photo.url));
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true };

    case 'ready':
      return { ...state, screen: state.screen === 'splash' ? 'home' : state.screen };

    case 'navigate':
      return { ...state, screen: action.screen, sheet: null };

    case 'startCamera':
      releasePhotos(state.photos);
      return {
        ...state,
        screen: 'cam',
        mode: action.mode,
        revealed: 0,
        photos: [],
        ...(action.attempt ? { attempt: action.attempt } : null),
      };

    case 'reveal': {
      if (state.revealed >= action.total) return state;
      return { ...state, revealed: state.revealed + 1 };
    }

    case 'capture':
      return { ...state, photos: [...state.photos, action.photo] };

    // The detector's answer for one still, filed against the photo it came
    // from. Arrives a moment after the capture itself, since reading the frame
    // is async and the shutter should not wait for it.
    case 'photoDetections':
      return {
        ...state,
        photos: state.photos.map((photo) =>
          photo.id === action.id ? { ...photo, detections: action.detections } : photo,
        ),
      };

    case 'dropPhoto': {
      const photo = state.photos.find((p) => p.id === action.id);
      if (photo?.url) URL.revokeObjectURL(photo.url);
      return { ...state, photos: state.photos.filter((p) => p.id !== action.id) };
    }

    case 'process':
      return { ...state, screen: 'proc', phase: 0 };

    case 'processPhase':
      return { ...state, phase: Math.min(2, state.phase + 1) };

    case 'reviewReady':
      return { ...state, screen: 'review', items: action.items };

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
      return { ...state, sheet: action.sheet, q: '' };

    case 'closeSheet':
      return { ...state, sheet: null };

    case 'setQuery':
      return { ...state, q: action.value };

    case 'addProduct': {
      const existing = state.items.find((i) => i.id === action.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1, cf: 100 } : i))
        : [...state.items, { id: action.id, qty: 1, cf: 100 }];
      return { ...state, items, sheet: null };
    }

    case 'saveReview':
      return state.mode === 'before'
        ? { ...state, baseline: state.items, active: true, screen: 'home' }
        : { ...state, after: state.items, screen: 'compare' };

    case 'confirmManual':
      return { ...state, manual: true, screen: 'pass' };

    case 'finishTrip':
      releasePhotos(state.photos);
      return {
        ...state,
        screen: 'home',
        trips: action.trips,
        trip: createSampleTrip(),
        active: false,
        attempt: 1,
        manual: false,
        verified: false,
        officerPick: null,
        items: [],
        baseline: null,
        after: null,
        photos: [],
        sheet: null,
      };

    case 'verify':
      return { ...state, verified: true };

    case 'pickHiker':
      return { ...state, officerPick: action.entry };

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

    case 'toggleDemo':
      return { ...state, demo: !state.demo };

    case 'toggleAuto':
      return { ...state, auto: !state.auto };

    case 'clearData':
      releasePhotos(state.photos);
      return {
        ...initialState,
        hydrated: true,
        lang: state.lang,
        dark: state.dark,
        demo: state.demo,
        auto: state.auto,
        screen: 'settings',
        trips: [],
        trip: createSampleTrip(),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = state.hydrated;
  // Demo playback wins if it is on; otherwise the hiker chooses between the
  // on-device detector and counting by hand.
  const detectorId = state.demo
    ? scriptedDetector.id
    : state.auto
      ? visionDetector.id
      : manualDetector.id;
  const detector = useMemo(() => getDetector(detectorId), [detectorId]);

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
          demo: settings?.demo ?? false,
          auto: settings?.auto ?? true,
        },
      });
      if (!trips) writeValue(KEYS.trips, seedTrips);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeValue(KEYS.settings, {
        lang: state.lang,
        dark: state.dark,
        demo: state.demo,
        auto: state.auto,
      });
    }
  }, [hydrated, state.lang, state.dark, state.demo, state.auto]);

  useEffect(() => {
    if (hydrated) writeValue(KEYS.trips, state.trips);
  }, [hydrated, state.trips]);

  // ---- Timed transitions ---------------------------------------------------
  useEffect(() => {
    if (state.screen !== 'splash') return undefined;
    const id = setTimeout(() => dispatch({ type: 'ready' }), SPLASH_MS);
    return () => clearTimeout(id);
  }, [state.screen]);

  // Demo overlay: one more box lights up every scan tick until the frame is
  // fully read. The manual detector has no overlay, so this does nothing.
  useEffect(() => {
    if (state.screen !== 'cam') return undefined;
    const total = detector.overlay(state.mode).length;
    if (!total) return undefined;
    let revealed = 0;
    const id = setInterval(() => {
      revealed += 1;
      dispatch({ type: 'reveal', total });
      if (revealed >= total) clearInterval(id);
    }, SCAN_SPEED_MS);
    return () => clearInterval(id);
  }, [state.screen, state.mode, state.attempt, detector]);

  // Processing: three phases of theatre, then the detector's real answer.
  useEffect(() => {
    if (state.screen !== 'proc') return undefined;
    let cancelled = false;

    if (state.phase < 2) {
      const id = setTimeout(() => dispatch({ type: 'processPhase' }), PROCESS_PHASE_MS);
      return () => clearTimeout(id);
    }

    const id = setTimeout(async () => {
      const items = await detector.detect({
        mode: state.mode,
        attempt: state.attempt,
        frames: state.photos,
      });
      if (!cancelled) dispatch({ type: 'reviewReady', items });
    }, PROCESS_PHASE_MS);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [state.screen, state.phase, state.mode, state.attempt, state.photos, detector]);

  // ---- Derived -------------------------------------------------------------
  const t = useMemo(() => getStrings(state.lang), [state.lang]);

  const comparison = useMemo(
    () => compareDetections(state.baseline ?? [], state.after ?? [], { manualOverride: state.manual }),
    [state.baseline, state.after, state.manual],
  );

  const comparisonRef = useRef(comparison);
  comparisonRef.current = comparison;
  const stateRef = useRef(state);
  stateRef.current = state;
  const detectorRef = useRef(detector);
  detectorRef.current = detector;

  const actions = useMemo(
    () => ({
      navigate: (screen) => dispatch({ type: 'navigate', screen }),
      startBefore: () => dispatch({ type: 'startCamera', mode: 'before' }),
      scanAfter: () => dispatch({ type: 'startCamera', mode: 'after' }),
      retake: () => dispatch({ type: 'startCamera', mode: 'after', attempt: 2 }),
      backToCamera: (mode) => dispatch({ type: 'startCamera', mode }),
      capture: (photo) => dispatch({ type: 'capture', photo }),
      attachDetections: (id, detections) => dispatch({ type: 'photoDetections', id, detections }),
      dropPhoto: (id) => dispatch({ type: 'dropPhoto', id }),

      // A detector that counts earns its processing screen — where the stills
      // it has already read are folded into one list. Manual counting goes
      // straight to the list the hiker is about to fill in.
      finishCapture: () => {
        if (detectorRef.current.autoCounts) {
          dispatch({ type: 'process' });
        } else {
          dispatch({ type: 'reviewReady', items: [] });
        }
      },

      inc: (id) => dispatch({ type: 'bumpItem', id, delta: 1 }),
      dec: (id) => dispatch({ type: 'bumpItem', id, delta: -1 }),
      remove: (id) => dispatch({ type: 'removeItem', id }),
      openSheet: (sheet) => dispatch({ type: 'openSheet', sheet }),
      closeSheet: () => dispatch({ type: 'closeSheet' }),
      setQuery: (value) => dispatch({ type: 'setQuery', value }),
      addProduct: (id) => dispatch({ type: 'addProduct', id }),

      saveReview: () => {
        const { trip, mode, photos } = stateRef.current;
        // Stills stay on the device, filed under the trip they belong to.
        if (photos.length) {
          writeValue(
            `${KEYS.photoPrefix}${trip.id}:${mode}`,
            photos.map((photo) => ({ blob: photo.blob, w: photo.w, h: photo.h })),
          );
        }
        dispatch({ type: 'saveReview' });
      },

      toPass: () => dispatch({ type: 'navigate', screen: 'pass' }),
      confirmManual: () => dispatch({ type: 'confirmManual' }),
      verify: () => dispatch({ type: 'verify' }),
      pickHiker: (entry) => dispatch({ type: 'pickHiker', entry }),
      patchTrip: (field, value) => dispatch({ type: 'patchTrip', field, value }),
      setGate: (value) => dispatch({ type: 'patchTrip', field: 'gate', value }),
      setGroup: (delta) =>
        dispatch({
          type: 'patchTrip',
          field: 'group',
          value: Math.min(20, Math.max(1, stateRef.current.trip.group + delta)),
        }),
      setHistoryQuery: (value) => dispatch({ type: 'setHistoryQuery', value }),
      setFilter: (value) => dispatch({ type: 'setFilter', value }),
      setLang: (value) => dispatch({ type: 'setLang', value }),
      toggleDark: () => dispatch({ type: 'toggleDark' }),
      toggleDemo: () => dispatch({ type: 'toggleDemo' }),
      toggleAuto: () => dispatch({ type: 'toggleAuto' }),

      finishTrip: () => {
        const { trip, trips, baseline, after } = stateRef.current;
        const cmp = comparisonRef.current;
        // Nothing was scanned (the officer screen can be opened straight from
        // Home), so there is no trip to file — just reset.
        if (!cmp.baseTotal) {
          dispatch({ type: 'finishTrip', trips });
          return;
        }
        const completed = {
          id: trip.id,
          mtn: trip.mtn,
          gate: trip.gate,
          date: trip.climb,
          pct: cmp.pct,
          items: cmp.baseTotal,
          hiker: trip.hiker,
          group: trip.group,
          baseline,
          after,
        };
        dispatch({ type: 'finishTrip', trips: [completed, ...trips] });
      },

      clearAllData: async () => {
        const keys = await listKeys();
        await Promise.all(keys.filter((key) => key !== KEYS.settings).map(deleteValue));
        await writeValue(KEYS.trips, []);
        dispatch({ type: 'clearData' });
      },

      storageReport: async () => {
        const keys = await listKeys();
        return {
          trips: stateRef.current.trips.length,
          photoSets: keys.filter((key) => String(key).startsWith(KEYS.photoPrefix)).length,
          bytes: await estimateUsage(),
        };
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, t, comparison, actions, gateOptions, detector }),
    [state, t, comparison, actions, detector],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
