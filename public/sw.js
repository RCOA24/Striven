const CACHE_NAME = 'striven-v3';

// Install event: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients to control them immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clear old caches if any
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event: Network First for HTML, Cache First for assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML), try network first, then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For assets (JS, CSS, Images), try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

// --- Advanced PWA Capabilities ---

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered', event.tag);
  // Logic to sync data when online would go here
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered', event.tag);
  // Logic to update content in background
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Striven Update';
  const options = {
    body: data.body || 'New activity available.',
    icon: '/icon-192.png',
    badge: '/icon-96.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});