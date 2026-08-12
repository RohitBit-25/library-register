// Library Register — Service Worker v2
// Caches app shell + static assets for offline support.
// v2: stopped caching /api/* — see the fetch handler.

// Bumping this name is what purges the v1 caches (which contain member PII)
// from every device via the activate handler below.
const CACHE_NAME = 'library-register-v2';
// Public shells only. Admin routes are excluded: middleware redirects them for
// anonymous visitors, and a redirect response would make cache.addAll reject,
// failing the whole install.
const STATIC_ASSETS = [
  '/landing',
  '/browse',
  '/my-requests',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // NEVER cache API responses. v1 cached every 200 GET, which meant an admin's
  // full member list (names, phones) persisted in CacheStorage after logout and
  // was served to the next person on that device while offline — and a cached
  // {"isAdmin":true} from /api/auth/check could revive a stale admin session.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigation requests, fall back to the public landing shell.
          if (event.request.mode === 'navigate') {
            return caches.match('/landing').then(
              (shell) => shell || new Response('Offline', { status: 503 })
            );
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
