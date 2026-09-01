// Service Worker Version: 1.3
const CACHE_NAME = 'botflow-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes("/api/stream") || event.request.url.includes("/api/events")) return;
  if (event.request.url.includes("/api/")) {
    if (event.request.method !== "GET") return;
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open("botflow-api-cache-v1").then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return new Response(JSON.stringify({ error: "Offline mode. Data not available." }), { status: 503, headers: { "Content-Type": "application/json" } });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      });
    })
  );
});

// Push event
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New message received',
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: {
          url: data.url || '/'
        },
        vibrate: [100, 50, 100],
        requireInteraction: true
      };

      event.waitUntil(
        self.registration.showNotification(data.title || "BotFlow Premium", options)
      );
    } catch (e) {
      console.error('Push error:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen || client.url === new URL(urlToOpen, self.location.origin).href) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
