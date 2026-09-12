const CACHE_NAME = 'my-garden-shell-v15';
const PLANT_IMAGES = [
  './assets/plants/araza-1.jpg',
  './assets/plants/araza-2.jpg',
  './assets/plants/araza-3.jpg',
  './assets/plants/carqueja-1.jpg',
  './assets/plants/carqueja-2.jpg',
  './assets/plants/carqueja-3.jpg',
  './assets/plants/ceibo-1.jpg',
  './assets/plants/ceibo-2.jpg',
  './assets/plants/ceibo-3.jpg',
  './assets/plants/cola-de-zorro-1.jpg',
  './assets/plants/cola-de-zorro-2.jpg',
  './assets/plants/cola-de-zorro-3.jpg',
  './assets/plants/congorosa-1.jpg',
  './assets/plants/congorosa-2.jpg',
  './assets/plants/congorosa-3.jpg',
  './assets/plants/coronillo-1.jpg',
  './assets/plants/coronillo-2.jpg',
  './assets/plants/coronillo-3.jpg',
  './assets/plants/cortadera-1.jpg',
  './assets/plants/cortadera-2.jpg',
  './assets/plants/cortadera-3.jpg',
  './assets/plants/dicliptera-1.jpg',
  './assets/plants/dicliptera-2.jpg',
  './assets/plants/feijoa-1.jpg',
  './assets/plants/feijoa-2.jpg',
  './assets/plants/feijoa-3.jpg',
  './assets/plants/flechilla-1.jpg',
  './assets/plants/flechilla-2.jpg',
  './assets/plants/flechilla-3.jpg',
  './assets/plants/lantana-1.jpg',
  './assets/plants/lantana-2.jpg',
  './assets/plants/lantana-3.jpg',
  './assets/plants/marcela-1.jpg',
  './assets/plants/marcela-2.jpg',
  './assets/plants/marcela-3.jpg',
  './assets/plants/molle-1.jpg',
  './assets/plants/molle-2.jpg',
  './assets/plants/molle-3.jpg',
  './assets/plants/nangapiri-1.jpg',
  './assets/plants/nangapiri-2.jpg',
  './assets/plants/nangapiri-3.jpg',
  './assets/plants/pasionaria-1.jpg',
  './assets/plants/pasionaria-2.jpg',
  './assets/plants/pasionaria-3.jpg',
  './assets/plants/salvia-guaranitica-1.jpg',
  './assets/plants/salvia-guaranitica-2.jpg',
  './assets/plants/salvia-guaranitica-3.jpg',
  './assets/plants/sen-del-campo-1.jpg',
  './assets/plants/sen-del-campo-2.jpg',
  './assets/plants/sen-del-campo-3.jpg',
  './assets/plants/tala-1.jpg',
  './assets/plants/tala-2.jpg',
  './assets/plants/tala-3.jpg'
];
const APP_SHELL = ['./','./index.html','./styles.css','./app.js','./db.js','./starter-plants.js','./manifest.webmanifest','./assets/icon.svg', ...PLANT_IMAGES];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const oldKeys = keys.filter(key => key !== CACHE_NAME);
    await Promise.all(oldKeys.map(key => caches.delete(key)));
    await self.clients.claim();
    if (oldKeys.length > 0) {
      const clients = await self.clients.matchAll({type: 'window'});
      clients.forEach(client => client.postMessage({type: 'NEW_VERSION_READY'}));
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }
  event.respondWith(cacheFirstAsset(event.request));
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, {cache: 'no-store'});
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return await cache.match(request) || await cache.match('./index.html') || await cache.match('./');
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).origin === self.location.origin) cache.put(request, response.clone());
  return response;
}
