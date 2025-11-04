// public/service-worker.js

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Tracking Active';
  const options = {
    body: data.body || 'Your run is still being tracked. Steps: ' + (data.steps ?? 'unknown'),
    icon: 'icons/vite.svg', // use your app icon here
    badge: 'icons/vite.svg'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// For local notification from within your app (not push)
self.addEventListener('message', event => {
  const { title, body, steps } = event.data;
  self.registration.showNotification(title, {
    body: body || `Steps: ${steps}`,
    icon: 'icons/vite.svg'
  });
});
