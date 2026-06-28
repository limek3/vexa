/* КликБук PWA service worker.
   Стратегия специально консервативная: кэшируем только статику,
   API/auth/dashboard HTML не кладём в кэш, чтобы не получить устаревшие
   или пользовательские данные из прошлого сеанса. */
const CACHE_VERSION = 'clickbook-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_URLS = [
  '/offline',
  '/favicon.ico',
  '/icons/pwa-icon-192.png',
  '/icons/pwa-icon-512.png',
  '/icons/pwa-maskable-192.png',
  '/icons/pwa-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => (key.startsWith('clickbook-pwa-') && key !== STATIC_CACHE ? caches.delete(key) : undefined))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isSensitiveRoute =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/review/') ||
    url.pathname.includes('/telegram') ||
    url.pathname.includes('/vk');

  if (isSensitiveRoute) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match('/offline');
        return offlinePage || Response.error();
      })
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/brand/') ||
    url.pathname.startsWith('/images/') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image';

  if (!isStaticAsset) return;

  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkFetch;
}
