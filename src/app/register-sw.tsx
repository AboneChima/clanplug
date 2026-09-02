'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // First, unregister ALL old service workers to fix current issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('🗑️ Unregistered old SW');
          });
        });
        
        // Clear all caches
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName).then(() => {
              console.log('🗑️ Deleted cache:', cacheName);
            });
          });
        });
        
        // Register new service worker after cleanup
        setTimeout(() => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('✅ SW registered:', registration);
              
              // Check for updates every 60 seconds
              setInterval(() => {
                registration.update();
              }, 60000);
              
              // Listen for updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('🔄 New SW version available, activating...');
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  });
                }
              });
            })
            .catch(err => console.error('❌ SW registration failed:', err));
        }, 1000);
      });

      // Listen for cache update messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('🔄 Cache cleared by SW');
        }
      });

      // Reload when new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('🔄 New SW active, reloading page...');
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
