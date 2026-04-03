// Copyright (c) 2026 Spirit Infinity - Tous droits réservés
const SPIRIT_SW_CACHE = 'spirit-sw-v3';

self.addEventListener('install', function (event) {
  event.waitUntil(
    Promise.resolve().then(function () {
      if (!self.registration.active) return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== SPIRIT_SW_CACHE) return caches.delete(k);
          return Promise.resolve();
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});

function spiritSwIconUrl() {
  try {
    return new URL('favicon.ico', self.registration.scope).href;
  } catch (e) {
    return '';
  }
}

/** Web Push : payload JSON { title, body, url } */
self.addEventListener('push', function (event) {
  var title = 'Spirit Infinity';
  var body = 'Nouvelle alerte sur ton compte.';
  var url = '/';
  try {
    if (event.data) {
      var j = event.data.json();
      if (j && j.title) title = String(j.title);
      if (j && j.body) body = String(j.body);
      if (j && j.url) url = String(j.url);
    }
  } catch (e1) {
    try {
      if (event.data) body = String(event.data.text());
    } catch (e2) {}
  }
  var iconUrl = spiritSwIconUrl();
  var opts = {
    body: body,
    tag: 'spirit-push-' + String(Date.now()),
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    data: { url: url }
  };
  if (iconUrl) opts.icon = iconUrl;
  event.waitUntil(
    Promise.resolve()
      .then(function () {
        return self.registration.showNotification(title, opts);
      })
      .catch(function (err) {
        console.error('[spirit-sw] showNotification', err);
        return self.registration.showNotification(title, {
          body: body,
          tag: 'spirit-fallback-' + String(Date.now()),
          data: { url: url }
        });
      })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var openUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  try {
    if (typeof openUrl === 'string' && openUrl.indexOf('/') === 0 && openUrl.indexOf('//') !== 0) {
      openUrl = new URL(openUrl, self.registration.scope).href;
    }
  } catch (e) {}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      var i;
      for (i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if (c.url && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(openUrl);
    })
  );
});
