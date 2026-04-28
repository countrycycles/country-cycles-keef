// Country Cycles Killearn — KEEF
// Service worker for offline support.
//
// Strategy:
//   • HTML, CSS, JS, manifest → network-first (fresh updates always land).
//   • Images / fonts → stale-while-revalidate (fast paint, refreshed in bg).
//   • Offline → fallback to cached copy.
//
// Bump CACHE on every deploy that touches CSS/JS so iOS reliably evicts.

const CACHE = 'keef-v13';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './assets/icons/mark.png',
  './assets/icons/mark.svg',
  './assets/icons/logo.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './src/app.js',
  './src/sound.js',
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
  './assets/sounds/keef_01_hello.mp4',
  './assets/sounds/keef_02_question.mp4',
  './assets/sounds/keef_03_success.mp4',
  './assets/sounds/keef_04_loading.mp4',
  './assets/sounds/keef_05_tip.mp4',
  './assets/sounds/keef_06_unsure.mp4',
  './assets/sounds/keef_07_scan.mp4',
  './assets/sounds/keef_08_stop.mp4',
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

function isFreshness(url) {
  // Anything that defines layout/behaviour gets network-first so updates
  // land on the very next page load.
  return /\.(html|css|js|webmanifest|json)$/.test(url.pathname) ||
         url.pathname === '/' ||
         url.pathname.endsWith('/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first: HTML, CSS, JS, manifest. Falls back to cache offline.
  if (req.mode === 'navigate' || isFreshness(url)) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./'))),
    );
    return;
  }

  // Stale-while-revalidate: images and other static assets.
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkPromise = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || networkPromise;
    }),
  );
});
