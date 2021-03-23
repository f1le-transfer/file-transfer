console.log('[Service Worker] This service worker do something...')
const log = (info, color='green') => console.log(`%c${info}`, `color: ${color};`)

const CACHE_NAME = 'sw-cache-example';
const toCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa.js',
  '/status.js',
  '/img/1.png',
];

self.addEventListener('install', function(event) {
  log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        log('[Service Worker] Caching all: app shell and content');
        return cache.addAll(toCache)
      })
      .then(self.skipWaiting())
  )
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        log(`[Service Worker] Fetched resource ${event.request.url}`);
        return caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(event.request)
          })
      })
  )
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            log('[ServiceWorker] Removing old cache', key)
            return caches.delete(key)
          }
        }))
      })
      .then(() => self.clients.claim())
  )
})
