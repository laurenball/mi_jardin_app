const CACHE_NAME = 'sanctuario-de-aves-shell-v43';
const PLANT_IMAGES = [
  './assets/plants/aljaba-1.jpg',
  './assets/plants/aljaba-2.jpg',
  './assets/plants/araucaria-1.jpg',
  './assets/plants/araucaria-2.jpg',
  './assets/plants/araza-2.jpg',
  './assets/plants/araza-2.jpg',
  './assets/plants/araza-amarillo-1.jpg',
  './assets/plants/araza-rojo-1.jpg',
  './assets/plants/canelon-1.jpg',
  './assets/plants/canelon-2.jpg',
  './assets/plants/canelon-3.jpg',
  './assets/plants/caraguata-1.jpg',
  './assets/plants/caraguata-2.jpg',
  './assets/plants/carqueja-2.jpg',
  './assets/plants/carqueja-3.jpg',
  './assets/plants/ceibo-2.jpg',
  './assets/plants/ceibo-3.jpg',
  './assets/plants/ceibo-4.jpg',
  './assets/plants/cerella-1.jpg',
  './assets/plants/cerella-2.jpg',
  './assets/plants/chal-chal-1.jpg',
  './assets/plants/chal-chal-2.jpg',
  './assets/plants/chal-chal-3.jpg',
  './assets/plants/chanar-1.jpg',
  './assets/plants/chanar-2.jpg',
  './assets/plants/chilto-1.jpg',
  './assets/plants/chilto-2.jpg',
  './assets/plants/cola-de-zorro-1.jpg',
  './assets/plants/cola-de-zorro-2.jpg',
  './assets/plants/cola-de-zorro-3.jpg',
  './assets/plants/congorosa-1.jpg',
  './assets/plants/congorosa-3.jpg',
  './assets/plants/coronillo-2.jpg',
  './assets/plants/coronillo-3.jpg',
  './assets/plants/cortadera-1.jpg',
  './assets/plants/cortadera-4.jpg',
  './assets/plants/dicliptera-1.jpg',
  './assets/plants/dicliptera-2.jpg',
  './assets/plants/espinillo-1.jpg',
  './assets/plants/espinillo-2.jpg',
  './assets/plants/espinillo-3.jpg',
  './assets/plants/feijoa-1.jpg',
  './assets/plants/feijoa-2.jpg',
  './assets/plants/feijoa-3.jpg',
  './assets/plants/flechilla-1.jpg',
  './assets/plants/flechilla-3.jpg',
  './assets/plants/flechilla-4.jpg',
  './assets/plants/flor-de-papagayo-1.jpg',
  './assets/plants/flor-de-papagayo-2.jpg',
  './assets/plants/fumo-bravo-1.jpg',
  './assets/plants/fumo-bravo-2.jpg',
  './assets/plants/guaran-amarillo-1.jpg',
  './assets/plants/guaran-amarillo-2.jpg',
  './assets/plants/guaviyo-1.jpg',
  './assets/plants/guaviyo-2.jpg',
  './assets/plants/guayaba-1.jpg',
  './assets/plants/guayaba-2.jpg',
  './assets/plants/iochroma-1.jpg',
  './assets/plants/iochroma-2.jpg',
  './assets/plants/lagrima-de-reina-1.jpg',
  './assets/plants/lagrima-de-reina-2.jpg',
  './assets/plants/lantana-4.jpg',
  './assets/plants/lantana-5.jpg',
  './assets/plants/lantana-6.jpg',
  './assets/plants/laurel-criollo-1.jpg',
  './assets/plants/laurel-criollo-2.jpg',
  './assets/plants/laurel-de-rio-1.jpg',
  './assets/plants/laurel-de-rio-2.jpg',
  './assets/plants/malva-del-campo-1.jpg',
  './assets/plants/malva-del-campo-2.jpg',
  './assets/plants/marcela-1.jpg',
  './assets/plants/marcela-2.jpg',
  './assets/plants/marcela-3.jpg',
  './assets/plants/margarita-punzo-1.jpg',
  './assets/plants/margarita-punzo-2.jpg',
  './assets/plants/margarita-punzo-3.jpg',
  './assets/plants/mato-guayabo-colorado-1.jpg',
  './assets/plants/mato-guayabo-colorado-2.jpg',
  './assets/plants/mercurio-1.jpg',
  './assets/plants/mercurio-2.jpg',
  './assets/plants/mistol-1.jpg',
  './assets/plants/mistol-2.jpg',
  './assets/plants/molle-2.jpg',
  './assets/plants/molle-3.jpg',
  './assets/plants/murta-arrayan-1.jpg',
  './assets/plants/murta-arrayan-2.jpg',
  './assets/plants/nangapiri-3.jpg',
  './assets/plants/nangapiri-4.jpg',
  './assets/plants/nangapiri-negro-1.jpg',
  './assets/plants/nangapiri-negro-2.jpg',
  './assets/plants/pasionaria-1.jpg',
  './assets/plants/pasionaria-2.jpg',
  './assets/plants/pasionaria-3.jpg',
  './assets/plants/salvia-guaranitica-1.jpg',
  './assets/plants/salvia-guaranitica-2.jpg',
  './assets/plants/salvia-guaranitica-3.jpg',
  './assets/plants/salvia-rastrera-1.jpg',
  './assets/plants/salvia-rastrera-2.jpg',
  './assets/plants/santa-lucia-morada-1.jpg',
  './assets/plants/sauco-1.jpg',
  './assets/plants/sauco-2.jpg',
  './assets/plants/sauco-3.jpg',
  './assets/plants/sen-del-campo-1.jpg',
  './assets/plants/sen-del-campo-2.jpg',
  './assets/plants/sen-del-campo-3.jpg',
  './assets/plants/sombra-de-toro-1.jpg',
  './assets/plants/sombra-de-toro-2.jpg',
  './assets/plants/sombra-de-toro-3.jpg',
  './assets/plants/tala-1.jpg',
  './assets/plants/tala-4.jpg',
  './assets/plants/tala-5.jpg',
  './assets/plants/tala-6.jpg',
  './assets/plants/talilla-1.jpg',
  './assets/plants/talilla-2.jpg',
  './assets/plants/tipa-blanca-1.jpg',
  './assets/plants/tipa-blanca-2.jpg',
  './assets/plants/ubajay-1.jpg',
  './assets/plants/ubajay-2.jpg',
  './assets/plants/vara-de-la-justicia-1.jpg',
  './assets/plants/vara-de-la-justicia-2.jpg',
  './assets/plants/verbena-1.jpg',
  './assets/plants/verbena-2.jpg',
  './assets/plants/verbena-3.jpg',
  './assets/plants/verbena-morada-1.jpg',
  './assets/plants/verbena-morada-2.jpg',
  './assets/plants/vinagrillo-rosado-1.jpg',
  './assets/plants/vinagrillo-rosado-2.jpg'
];
const APP_SHELL = ['./','./index.html','./styles.css?v=42','./app.js?v=43','./db.js','./starter-plants.js?v=43','./manifest.webmanifest','./assets/icon.svg'];

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
