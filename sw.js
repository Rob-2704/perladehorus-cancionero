const CACHE_NAME = 'cancionero-perla-0.5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './visor_2.html',
  './evento.html',
  './acordes.html',
  './404.html',
  './style.css',
  './js/acordes.js',
  './js/api-cliente.js',
  './js/modulo-acordes.js',
  './js/modulo-autoscroll.js',
  './js/modulo-transponer.js',
  './json/indice.json',
  './json/ids-canciones.json',
  './img/icono.png',
  './img/fondo.png'
];

// Instalación y precarga automática de la app y todo el cancionero
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Guardar la estructura base y recursos estáticos
      await cache.addAll(ASSETS_TO_CACHE);

      // 2. Leer el índice de canciones y precargar todos los archivos .txt automáticamente
      try {
        const respuestaIndice = await fetch('./json/indice.json');
        if (respuestaIndice.ok) {
          const datos = await respuestaIndice.json();
          if (datos && Array.isArray(datos.canciones)) {
            const promesasTxt = datos.canciones.map(async (info) => {
              const subcarpeta = info.categoria === 'general' ? 'Canciones/General' : 'Canciones';
              const rutaTxt = `${subcarpeta}/${encodeURIComponent(info.archivo)}.txt`;
              try {
                const resTxt = await fetch(rutaTxt);
                if (resTxt.ok) {
                  await cache.put(rutaTxt, resTxt);
                }
              } catch (err) {
                // Silenciar errores individuales si alguna petición falla temporalmente
              }
            });
            await Promise.all(promesasTxt);
          }
        }
      } catch (error) {
        console.error('Error al precargar las canciones en segundo plano:', error);
      }
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