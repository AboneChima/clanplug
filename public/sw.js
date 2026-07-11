// Service Worker to force cache bypass - UPDATED VERSION
const CACHE_VERSION = 'v5-' + Date.now();
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

console.log('🚀 SW: Loaded version', CACHE_VERSION);
