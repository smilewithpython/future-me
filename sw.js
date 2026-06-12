/* Future Me — Service Worker */
const CACHE  = 'future-me-v2';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k)   { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network-first: always try fresh, fall back to cache when offline */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || caches.match('index.html');
      });
    })
  );
});

/* Tapped a scheduled notification → open / focus the app */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var messageId = e.notification.data && e.notification.data.messageId;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        if (list.length) {
          var c = list[0];
          c.postMessage({ type: 'NOTIF_CLICKED', messageId: messageId });
          return c.focus();
        }
        return self.clients.openWindow('./');
      })
  );
});
