'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[lead2b] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[lead2b] ServiceWorker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
