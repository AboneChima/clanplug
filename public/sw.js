// Service Worker to force cache bypass AND handle push notifications
const CACHE_VERSION = 'v6-feed-fix-' + Date.now();
const CACHE_NAME = `clanplug-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('🔄 SW: Installing NEW version', CACHE_VERSION);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating NEW version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL old caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW: All old caches cleared, claiming clients');
      // Immediately take control of all pages
      return self.clients.claim();
    }).then(() => {
      // Force reload all open tabs to get fresh code
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          console.log('🔄 SW: Reloading client', client.url);
          client.postMessage({ type: 'CACHE_UPDATED' });
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for HTML and JS files
  if (
    event.request.mode === 'navigate' || 
    url.pathname.includes('/_next/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).catch((error) => {
        console.error('SW: Fetch failed, trying cache:', error);
        return caches.match(event.request);
      })
    );
  } else {
    // For other resources (images, videos), use cache-first with network fallback
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Don't cache if it's an error response
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          return fetchResponse;
        });
      })
    );
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('📨 SW: Push notification received');
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/',
    tag: 'notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        url: data.url || notificationData.url,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || notificationData.requireInteraction,
        silent: data.silent || notificationData.silent,
        vibrate: data.vibrate || notificationData.vibrate,
        timestamp: data.timestamp || notificationData.timestamp,
        data: data // Store full data for click handler
      };
      console.log('📦 SW: Notification data:', notificationData);
    } catch (error) {
      console.error('❌ SW: Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp,
      data: {
        url: notificationData.url,
        ...notificationData.data
      }
    })
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ SW: Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Focus existing window and navigate
            return client.focus().then((client) => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('🚀 SW: Loaded version', CACHE_VERSION);

