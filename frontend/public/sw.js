const CACHE_NAME = 'ice-facture-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation of the new SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Network First strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Return response if valid
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Clone and cache the new response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
