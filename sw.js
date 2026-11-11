const CACHE = 'seance-v9';
const CORE = [
  './',
  './index.html',
  './program.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('seance-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      const url = new URL(e.request.url);
      // met en cache les ressources du même domaine + les polices Google
      if (res.ok && url.origin === location.origin) {
        const c = await caches.open(CACHE);
        c.put(e.request, res.clone());
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
