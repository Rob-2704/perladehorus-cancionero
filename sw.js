const CACHE_NAME = 'cancionero-perla-1.7';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './visor.html',
  './evento.html',
  './acordes.html',
  './admin-canciones.html',
  './admin-eventos.html',
  './admin-avisos.html',
  './editor-cancion.html',
  './admin.html',
  './404.html',
  './style.css',
  './js/acordes.js',
  './js/api-cliente.js',
  './js/auth-guard.js',
  './js/modulo-acordes.js',
  './js/modulo-audio-acorde.js',
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

// Estrategia Network First: Prioriza la red para obtener siempre los cambios frescos
self.addEventListener('fetch', (event) => {
  // Omitir peticiones a Firebase Realtime Database para que siempre intenten conectar a la BD si hay red
  if (event.request.url.includes('firebaseio.com')) {
    return;
  }

  const url = new URL(event.request.url);

  // Manejo específico para rutas con parámetros o vistas dinámicas (visor / evento) con respaldo offline
  if (url.pathname.includes('visor')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => networkResponse)
        .catch(() => caches.match('./visor.html').then(res => res || caches.match('./index.html')))
    );
    return;
  }
  
  if (url.pathname.includes('evento')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => networkResponse)
        .catch(() => caches.match('./evento.html').then(res => res || caches.match('./index.html')))
    );
    return;
  }

  // Estrategia general Network First para archivos estáticos y páginas
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback de navegación general si no hay red ni caché específica
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});