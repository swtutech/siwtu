/* SIWTU PWA service worker. Navigation is network-first so new frontend
   versions/configuration are not trapped behind stale cache. */
const CACHE = 'siwtu-pwa-v2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: req.mode === 'navigate' ? 'no-store' : 'default' });
      if (fresh && fresh.ok) {
        const copy = fresh.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      }
      return fresh;
    } catch (_) {
      return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
    }
  })());
});
