const CACHE_NAME = 'timsy-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network First for API, Stale-While-Revalidate for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-http requests (like chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Strategy: Stale-While-Revalidate
  // Serve from cache immediately, then update cache from network
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Check if response is valid before caching
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
           // Network failed
           // If we have a cached response, return it (handled below)
           // If no cache and it's a navigation request, could return a custom offline page
        });

      return cachedResponse || fetchPromise;
    })
  );
});