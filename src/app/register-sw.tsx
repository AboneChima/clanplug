'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker (don't unregister on every load - causes refresh loops!)
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ SW registered:', registration);
          
          // Only check for updates once per hour (not every 60 seconds)
          setInterval(() => {
            registration.update();
          }, 3600000); // 1 hour
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New SW version available');
                  // Don't auto-activate - let user refresh manually
                  console.log('💡 Refresh the page to get the latest version');
                }
              });
            }
          });
        })
        .catch(err => console.error('❌ SW registration failed:', err));

      // Listen for cache update messages (but don't reload)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('🔄 Cache cleared by SW');
        }
      });
    }
  }, []);

  return null;
}
