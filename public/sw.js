// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'ClanPlug Notification';
  const options = {
    body: data.message || data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'notification',
    data: data,
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If a window is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    fetch('/api/push/resubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldEndpoint: event.oldSubscription?.endpoint,
        newEndpoint: event.newSubscription?.endpoint,
        newKeys: event.newSubscription?.toJSON()
      })
    })
  );
});
