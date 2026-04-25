// Country Cycles Killearn — KEEF
// Service worker for offline support. Cache-first for assets, network-first
// for the HTML shell so updates land quickly.

const CACHE = 'keef-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './assets/icons/logo.svg',
  './src/app.js',
  './src/triage/content.js',
  './src/triage/escalation.js',
  './src/triage/tree.js',
  './src/triage/engine.js',
  './assets/keef/wave.png',
  './assets/keef/tablet.png',
  './assets/keef/wrench_thumb.png',
  './assets/keef/back_view.png',
  './assets/keef/idea.png',
  './assets/keef/thinking.png',
  './assets/keef/magnify.png',
  './assets/keef/stop.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML / shell: network first, cache fallback
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./'))),
    );
    return;
  }

  // Assets: cache first, network fallback
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })),
  );
});
