const CACHE_NAME = 'brick-breaker-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // adaugă și icons când le ai: '/icon-192.png', '/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).then(fetchResp => {
      const copy = fetchResp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return fetchResp;
    }).catch(() => caches.match('/index.html')))
  );
});
