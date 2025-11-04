// public/service-worker.js

const CACHE_NAME = 'striven-v1';

// Install event
self.addEventListener('install', event => {
  console.log('✅ Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

// Handle local notifications from the app
self.addEventListener('message', event => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    
    console.log('🔔 Showing notification:', title);
    
    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/vite.svg',
      badge: '/vite.svg',
      tag: tag || 'striven-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false
    }).then(() => {
      console.log('✅ Notification shown successfully');
    }).catch(error => {
      console.error('❌ Error showing notification:', error);
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('👆 Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (let client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

console.log('✅ Service Worker script loaded');