const CACHE_NAME = 'cancionero-perla-0.7';

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

// Estrategia de respuesta optimizada para el manejo offline de vistas con parámetros
self.addEventListener('fetch', (event) => {
  // Omitir peticiones a Firebase Realtime Database para que siempre intenten conectar a la BD si hay red
  if (event.request.url.includes('firebaseio.com')) {
    return;
  }

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Manejar rutas con parámetros (ej. visor?idC=... o evento?idE=...) entregando la plantilla base cacheada
      if (url.pathname.includes('visor')) {
        return caches.match('./visor.html').then(res => res || fetch(event.request));
      }
      if (url.pathname.includes('evento')) {
        return caches.match('./evento.html').then(res => res || fetch(event.request));
      }

      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Fallback de navegación general para otras páginas si no hay red
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});