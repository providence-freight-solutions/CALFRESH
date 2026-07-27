// =====================================================================
// sw.js — app shell only.
// Supabase requests are deliberately never cached: a dispatcher must
// never see a stale appointment time.
// Bump CACHE when you deploy a new console build.
// =====================================================================

const CACHE = 'cf-console-v3';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Anything off-origin (i.e. Supabase) goes straight to the network.
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  // Network first so a redeploy is picked up immediately;
  // cache is only a fallback for being offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
