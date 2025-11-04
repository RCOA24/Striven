// public/service-worker.js

const CACHE_NAME = 'striven-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/vite.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache install error:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(err => console.log('Fetch error:', err))
  );
});

// Handle push notifications from server
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Striven - Tracking Active';
  const options = {
    body: data.body || 'Your activity is being tracked',
    icon: '/icons/vite.svg',
    badge: '/icons/vite.svg',
    tag: 'striven-tracking',
    requireInteraction: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle local notifications from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/icons/vite.svg',
      badge: '/icons/vite.svg',
      tag: tag || 'striven-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If app is already open, focus it
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});