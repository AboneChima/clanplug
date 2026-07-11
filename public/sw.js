// Service Worker to force cache bypass
const CACHE_VERSION = 'v4-' + Date.now();

self.addEventListener('install', (event) => {
  console.log('SW: Installing version', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: All caches cleared');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Force network-first for all HTML/JS files
  if (event.request.url.includes('/_next/') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

console.log('SW: Loaded version', CACHE_VERSION);
