// Shkolla-Kos Service Worker
// Strategjia:
// - Navigim (HTML): network-first GJITHMONE — siguron qe perdoruesi merr versionin me te ri
// - Asete me hash (JS/CSS chunks): cache-first — emrat ndryshojne ne cdo build
// - API Supabase: network-first, fallback cache
// - Imazhe: cache-first

const VERSION = 'shkolla-v2';
const STATIC_CACHE = `static-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const IMAGE_CACHE = `img-${VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

  // Navigim (HTML): GJITHMONE network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Supabase API: network-first
  if (url.hostname.endsWith('.supabase.co')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Imazhe: cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // JS/CSS me hash ne emer (assets/chunk-AbC123.js): cache-first sepse emri ndryshon ne cdo build
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Te gjitha te tjerat same-origin: network-first
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
