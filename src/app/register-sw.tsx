'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ SW registered:', registration);
          
          // Check for updates every 30 seconds
          setInterval(() => {
            registration.update();
          }, 30000);
          
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

      // Listen for cache update messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('🔄 Cache cleared, reloading...');
          setTimeout(() => window.location.reload(), 500);
        }
      });

      // Reload when new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 New SW active, reloading...');
        window.location.reload();
      });
    }
  }, []);

  return null;
}
