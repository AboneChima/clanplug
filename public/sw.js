// Service Worker for Push Notifications
// Version: 2.0.1 - Message Push Notifications
const SW_VERSION = '2.0.1';

console.log('🔄 Service Worker loaded, version:', SW_VERSION);

self.addEventListener('push', function(event) {
  console.log('🔔 PUSH EVENT RECEIVED in Service Worker');
  console.log('📅 Service Worker Version:', SW_VERSION);
  
  const data = event.data?.json() || {};
  console.log('📦 Push data:', data);
  
  const title = data.title || 'ClanPlug Notification';
  
  // Determine if persistent based on tag
  const isPersistent = data.tag === 'transaction' || data.tag === 'escrow';
  
  const options = {
    body: data.message || data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'notification',
    data: data,
    vibrate: [200, 100, 200],
    requireInteraction: isPersistent, // Only important notifications stay
    silent: false,
    timestamp: data.timestamp || Date.now(),
    dir: 'ltr',
  };

  console.log('🔔 Showing notification with title:', title);
  console.log('🔔 Notification options:', options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('✅ Notification displayed successfully'))
      .catch(err => console.error('❌ Failed to show notification:', err))
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
