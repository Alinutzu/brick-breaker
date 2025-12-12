// Service Worker auto-scope pentru GitHub Pages (project sites)
const SW_SCOPE = self.location.pathname.replace(/\/service-worker\.js$/, '');
const CACHE_NAME = 'brick-breaker-cache-v4';
const ASSETS = [
  `${SW_SCOPE}/`,
  `${SW_SCOPE}/index.html`,
  `${SW_SCOPE}/manifest.json`,
  `${SW_SCOPE}/icon-192.png`,
  `${SW_SCOPE}/icon-512.png`,
  `${SW_SCOPE}/levels.js`,
  `${SW_SCOPE}/game.js`,
  `${SW_SCOPE}/pwa.js`
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => {
      const isNavRequest = req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html');
      if (cached) return cached;
      return fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return resp;
        })
        .catch(() => {
          if (isNavRequest) {
            return caches.match(`${SW_SCOPE}/index.html`);
          }
          return caches.match(req);
        });
    })
  );
});
