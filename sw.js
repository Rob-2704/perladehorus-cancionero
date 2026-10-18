const CACHE_NAME = 'cancionero-perla-0.6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './visor.html',
  './evento.html',
  './acordes.html',
  './admin-canciones.html',
  './admin-eventos.html',
  './editor-cancion.html',
  './404.html',
  './style.css',
  './js/acordes.js',
  './js/api-cliente.js',
  './js/modulo-acordes.js',
  './js/modulo-autoscroll.js',
  './js/modulo-transponer.js',
  './img/icono.png',
  './img/fondo.png'
];

// Instalación y precarga de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de versiones antiguas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de respuesta: Buscar primero en caché, si no, ir a la red
self.addEventListener('fetch', (event) => {
  // Omitir peticiones a Firebase Realtime Database para que siempre obtengan datos frescos de la BD
  if (event.request.url.includes('firebaseio.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Si no hay red y el recurso no está en caché
      });
    })
  );
});