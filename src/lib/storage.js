/**
 * Local-first storage. Everything the app knows lives in IndexedDB on the
 * device — no account, no upload. A tiny key/value store is enough at this
 * size, and it keeps the app working with no signal at the trailhead gate.
 */
const DB_NAME = 'trash-return-tracker';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore(mode, run) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve(req?.result);
  });
}

// Private browsing and locked-down browsers can refuse IndexedDB entirely.
// The app must still run, so reads fall back to the default and writes no-op.
export async function readValue(key, fallback) {
  try {
    const value = await withStore('readonly', (store) => store.get(key));
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export async function writeValue(key, value) {
  try {
    await withStore('readwrite', (store) => store.put(value, key));
    return true;
  } catch {
    return false;
  }
}

export async function deleteValue(key) {
  try {
    await withStore('readwrite', (store) => store.delete(key));
    return true;
  } catch {
    return false;
  }
}

export async function listKeys() {
  try {
    return (await withStore('readonly', (store) => store.getAllKeys())) || [];
  } catch {
    return [];
  }
}

/** Bytes this origin is using, when the browser is willing to say. */
export async function estimateUsage() {
  try {
    const { usage } = await navigator.storage.estimate();
    return usage ?? null;
  } catch {
    return null;
  }
}

export const KEYS = {
  trips: 'trips',
  settings: 'settings',
  activeTrip: 'activeTrip',
  photoPrefix: 'photos:',
};
