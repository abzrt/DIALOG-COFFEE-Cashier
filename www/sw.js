const CACHE_NAME = 'dialog-coffee-cache-v35';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/pos.js',
  './js/finance.js',
  './js/reports.js',
  './js/auth.js',
  './js/cloud-sync.js',
  './js/updater.js',
  './js/export-pdf.js',
  './js/export-word.js',
  './libs/firebase-app.js',
  './libs/firebase-database.js',
  './libs/jspdf.umd.min.js',
  './libs/jspdf.plugin.autotable.min.js',
  './libs/jszip.min.js',
  './libs/chart.umd.js',
  './assets/dialog_logo.jpg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.url.includes('api_sync.php')) return;
  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request))
  );
});
