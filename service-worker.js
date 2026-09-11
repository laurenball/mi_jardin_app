const CACHE_NAME = 'my-garden-shell-v9';
const PLANT_IMAGES = [
  './assets/plants/araza.jpg',
  './assets/plants/carqueja.jpg',
  './assets/plants/ceibo.jpg',
  './assets/plants/cola-de-zorro.jpg',
  './assets/plants/congorosa.jpg',
  './assets/plants/coronillo.jpg',
  './assets/plants/cortadera.jpg',
  './assets/plants/dicliptera.jpg',
  './assets/plants/feijoa.jpg',
  './assets/plants/flechilla.jpg',
  './assets/plants/lantana.jpg',
  './assets/plants/marcela.jpg',
  './assets/plants/molle.jpg',
  './assets/plants/nangapiri.jpg',
  './assets/plants/pasionaria.jpg',
  './assets/plants/salvia-guaranitica.jpg',
  './assets/plants/sen-del-campo.jpg',
  './assets/plants/tala.jpg'
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
