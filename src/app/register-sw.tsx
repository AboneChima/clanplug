'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ SW registered:', registration);
          
          // Force update on every page load
          registration.update();
          
          // If there's an update, activate it immediately
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New SW available, reloading...');
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch(err => console.error('❌ SW registration failed:', err));
    }
  }, []);

  return null;
}
