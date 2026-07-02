// Vietnamese Flashcards — offline service worker.
// HTML: network-first (updates land immediately, cache is the offline fallback).
// Everything else (icons, fonts): cache-first with background fill.
const CACHE = 'viet-cards-v1';
const ASSETS = ['./flashcards.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(res => res || caches.match('./flashcards.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(res => res || fetch(req).then(res2 => {
        const copy = res2.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res2;
      }))
    );
  }
});
