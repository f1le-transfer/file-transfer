const log = (info, color='green') => console.log(`%c${info}`, `color: ${color};`)

const cacheName = 'file-transfer-assets'
const appShellFiles = [
  '/index.html',
  '/index.js'
]

caches.deleteAll = async () => {
  const keyList = await caches.keys()
  await Promise.all(keyList.map(async (key) => {
    // if (key === cacheName) { return; }
    await caches.delete(key);
  }))
}

// Installing Service Worker
self.addEventListener('install', (e) => {
  log('[Service Worker] Install.');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    log('[Service Worker] Caching all: app shell and content.');
    await cache.addAll(appShellFiles);
  })());
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});

// Clear out the old cache that we don't need anymore
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    log('[Service Worker] Clear old cache.')
    caches.deleteAll()
  })());
});