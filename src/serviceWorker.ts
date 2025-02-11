/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const SW_VERSION = '1.0.0';

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(SW_VERSION).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Empêcher TypeScript de se plaindre à propos du contexte d'exportation
export {}; 