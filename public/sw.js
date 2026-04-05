// Service Worker Version: 1.1
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Push Data:', data);
      const options = {
        body: data.body || 'New message received',
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: {
          url: data.url || '/'
        },
        vibrate: [100, 50, 100],
        requireInteraction: true,
        tag: data.tag || 'telegram-notification'
      };

      event.waitUntil(
        self.registration.showNotification(data.title || "UserBot Pro", options)
      );
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  console.log('[Service Worker] Opening URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If it's a Telegram link, always open a new window/tab to be safe
      if (urlToOpen.startsWith('http')) {
        return clients.openWindow(urlToOpen);
      }

      // For internal app links, try to focus existing window
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
