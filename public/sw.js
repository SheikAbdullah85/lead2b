// lead2b Progressive Web App Service Worker - High Reliability Offline Engine
const CACHE_NAME = 'lead2b-cache-v4';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/demo',
  '/app/dashboard',
  '/app/scan',
  '/app/lead/new',
  '/app/lead/card',
  '/app/leads',
  '/app/followups',
  '/app/settings',
  '/manifest.json',
  '/offline.html',
  '/brand/lead2b-logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching completed with partial cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip external APIs & Supabase Auth/PostgREST
  if (url.origin.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Navigation Requests (HTML Pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: Match exact page, clean path, or closest parent app shell
          const cached = await caches.match(event.request);
          if (cached) return cached;

          const cleanUrl = url.origin + url.pathname;
          const cleanCached = await caches.match(cleanUrl);
          if (cleanCached) return cleanCached;

          if (url.pathname.startsWith('/app/lead/new')) {
            const newLeadShell = await caches.match('/app/lead/new');
            if (newLeadShell) return newLeadShell;
          }

          if (url.pathname.startsWith('/app/lead/card')) {
            const cardShell = await caches.match('/app/lead/card');
            if (cardShell) return cardShell;
          }

          if (url.pathname.startsWith('/app/scan')) {
            const scanShell = await caches.match('/app/scan');
            if (scanShell) return scanShell;
          }

          if (url.pathname.startsWith('/app/')) {
            const dashShell = await caches.match('/app/dashboard');
            if (dashShell) return dashShell;
          }

          return (await caches.match('/offline.html')) || new Response('Offline', { status: 200, headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  // 3. Static Assets & Next.js Bundles (Cache-first with network fallback & auto-cache)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/brand/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Next.js RSC Flight Payloads (?_rsc=...) or JSON data
  if (url.searchParams.has('_rsc') || url.pathname.includes('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // Match without query string if RSC payload not individually cached
          const cleanUrl = url.origin + url.pathname;
          const cleanCached = await caches.match(cleanUrl);
          if (cleanCached) return cleanCached;

          return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
        })
    );
    return;
  }

  // 5. Default Network-first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
