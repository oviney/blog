---
layout: null
---
/**
 * Service Worker for Ouray Viney's Blog
 * Strategy:
 *   - Cache-first for static assets (CSS, fonts, images)
 *   - Network-first for HTML pages (fresh content when online)
 *   - Offline fallback page when both fail
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE  = 'static-' + CACHE_VERSION;
const PAGES_CACHE   = 'pages-'  + CACHE_VERSION;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '{{ "/" | relative_url }}',
  '{{ "/blog/" | relative_url }}',
  '{{ "/assets/css/styles.css" | relative_url }}',
  '{{ "/assets/images/blog-default.svg" | relative_url }}',
  '{{ "/favicon.svg" | relative_url }}'
];

// Install: pre-cache static shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: purge old caches
self.addEventListener('activate', event => {
  const allowed = [STATIC_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !allowed.includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for pages
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isAsset = /\.(css|js|woff2?|ttf|svg|png|webp|jpg|jpeg|gif|ico)(\?.*)?$/.test(url.pathname);

  if (isAsset) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // Network-first strategy for HTML pages
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
