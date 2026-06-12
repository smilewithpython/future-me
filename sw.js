/* Future Me — Service Worker */
const CACHE = 'future-me-v1';
const SHELL  = ['./','./index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

/* Tapped a scheduled notification → open / focus the app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const messageId = e.notification.data?.messageId;

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        if (list.length) {
          const c = list[0];
          c.postMessage({ type: 'NOTIF_CLICKED', messageId });
          return c.focus();
        }
        return self.clients.openWindow('./');
      })
  );
});
