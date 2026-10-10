const CACHE_ESTATICO = 'cancionero-estatico-v2';
const CACHE_DINAMICO = 'cancionero-dinamico-v2';

// Archivos principales de la interfaz base
const ARCHIVOS_A_CACHEAR = [
    './',
    './index.html',
    './acordes.html',
    './visor.html',
    './evento.html',
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

// Evento de instalación: guarda los archivos estáticos base
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_ESTATICO)
            .then((cache) => cache.addAll(ARCHIVOS_A_CACHEAR))
    );
    self.skipWaiting();
});

// Evento de activación: limpia cachés obsoletos
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombresCaches) => {
            return Promise.all(
                nombresCaches.map((nombre) => {
                    if (nombre !== CACHE_ESTATICO && nombre !== CACHE_DINAMICO) {
                        return caches.delete(nombre);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Evento fetch: intercepta peticiones locales y de Firebase
self.addEventListener('fetch', (evento) => {
    const url = new URL(evento.request.url);

    if (url.origin === location.origin || url.hostname.includes('firebaseio.com')) {
        evento.respondWith(
            fetch(evento.request)
                .then((respuestaRed) => {
                    return caches.open(CACHE_DINAMICO).then((cache) => {
                        cache.put(evento.request, respuestaRed.clone());
                        return respuestaRed;
                    });
                })
                .catch(() => {
                    return caches.match(evento.request).then((respuestaCache) => {
                        if (respuestaCache) return respuestaCache;
                        if (evento.request.mode === 'navigate') {
                            return caches.match('./404.html');
                        }
                    });
                })
        );
    } else {
        evento.respondWith(
            caches.match(evento.request).then((respuesta) => {
                return respuesta || fetch(evento.request);
            })
        );
    }
});
