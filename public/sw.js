/* Offline shell for Trash Return Tracker.
 *
 * The app is local-first: detection, storage and comparison all run on the
 * device, so once the shell is cached the whole flow works with no signal —
 * which is the normal condition at a trailhead gate.
 *
 * Strategy:
 *   navigations   → network first, fall back to the cached shell
 *   same-origin GET → stale-while-revalidate (hashed build assets, fonts, icons)
 */
const CACHE = 'trt-v2';
// Absolute forms of the two shell entries, resolved once against the
// worker's scope so lookups match what install() stored.
const SHELL_HTML = new URL('./index.html', self.location).pathname;
const SHELL_ROOT = new URL('./', self.location).pathname;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL_HTML, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_HTML).then((cached) => cached || caches.match(SHELL_ROOT))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
