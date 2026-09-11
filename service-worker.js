const CACHE_NAME = 'my-garden-shell-v8';
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
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });
