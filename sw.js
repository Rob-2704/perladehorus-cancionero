const VERSION = '1.74';
const CACHE_APP = `cancionero-app-${VERSION}`;
const CACHE_CDN = 'cancionero-cdn-v1';
const CACHE_MUESTRAS = 'cancionero-muestras-v1';
const CACHE_AUDIO_META = 'cancionero-audio-meta-v1';
const CACHES_VALIDAS = [CACHE_APP, CACHE_CDN, CACHE_MUESTRAS, CACHE_AUDIO_META];

const ASSETS_TO_CACHE = [
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
  './afinador.html',
  './style.css',
  './manifest.json',
  './js/core-app.js',
  './js/core-acordes.js',
  './js/modulo-afinador.js',
  './js/modulo-autoscroll.js',
  './img/icono.png',
  './img/fondo.png'
];

const CRITICOS = ['./index.html', './visor.html', './style.css', './js/core-app.js'];

const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/10.8.0/';
const CDN_PRECARGA = [
  `${FIREBASE_BASE}firebase-app.js`,
  `${FIREBASE_BASE}firebase-database.js`,
  `${FIREBASE_BASE}firebase-auth.js`,
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

const FUENTES_CSS = [
  'https://fonts.googleapis.com/css2?family=Sono:MONO@0..1&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0&display=swap'
];

const TTL_AUDIO_EXISTE_MS = 7 * 24 * 60 * 60 * 1000;
const TTL_AUDIO_NO_EXISTE_MS = 30 * 60 * 1000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    const resultados = await Promise.allSettled(
      ASSETS_TO_CACHE.map(url => cache.add(new Request(url, { cache: 'reload' })))
    );
    const fallosCriticos = ASSETS_TO_CACHE.filter(
      (url, i) => resultados[i].status === 'rejected' && CRITICOS.includes(url)
    );
    if (fallosCriticos.length > 0) {
      throw new Error('No se pudieron precargar archivos críticos: ' + fallosCriticos.join(', '));
    }
    await precalentarCDN();
  })());
  self.skipWaiting();
});

async function precalentarCDN() {
  try {
    const cache = await caches.open(CACHE_CDN);
    await Promise.allSettled(CDN_PRECARGA.map(async (url) => {
      const respuesta = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (respuesta.ok) await cache.put(url, respuesta);
    }));

    for (const css of FUENTES_CSS) {
      try {
        const respuesta = await fetch(css, { mode: 'cors', credentials: 'omit' });
        if (!respuesta.ok) continue;
        await cache.put(css, respuesta.clone());
        const texto = await respuesta.text();
        const urls = [...texto.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
        await Promise.allSettled(urls.map(async (u) => {
          const f = await fetch(u, { mode: 'cors', credentials: 'omit' });
          if (f.ok) await cache.put(u, f);
        }));
      } catch (_) {}
    }
  } catch (_) {}
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(claves => Promise.all(
        claves.filter(c => !CACHES_VALIDAS.includes(c)).map(c => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

function claveDePagina(url) {
  let ruta = url.pathname;
  if (ruta.endsWith('/')) ruta += 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(ruta.split('/').pop())) ruta += '.html';
  return new Request(url.origin + ruta);
}

async function sinRedireccion(respuesta) {
  if (!respuesta.redirected) return respuesta;
  const cuerpo = await respuesta.blob();
  return new Response(cuerpo, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: respuesta.headers
  });
}

async function responderPagina(event, url) {
  const clave = claveDePagina(url);
  const cache = await caches.open(CACHE_APP);
  const enCache = await cache.match(clave);

  const red = fetch(new Request(clave.url, { cache: 'no-cache' }))
    .then(async (respuesta) => {
      if (!respuesta.ok) return respuesta;
      const limpia = await sinRedireccion(respuesta);
      await cache.put(clave, limpia.clone());
      return limpia;
    })
    .catch(() => null);

  if (enCache) {
    event.waitUntil(red);
    return enCache;
  }

  const respuesta = await red;
  if (respuesta) return respuesta;
  const inicio = await cache.match(new URL('./index.html', self.registration.scope).href);
  return inicio || Response.error();
}

async function responderRecurso(event) {
  const peticion = event.request;
  const cache = await caches.open(CACHE_APP);
  const enCache = (await cache.match(peticion)) || (await cache.match(peticion, { ignoreSearch: true }));

  const red = fetch(peticion.url, { cache: 'no-cache' })
    .then(async (respuesta) => {
      if (respuesta.ok) await cache.put(peticion, respuesta.clone());
      return respuesta;
    })
    .catch(() => null);

  if (enCache) {
    event.waitUntil(red);
    return enCache;
  }

  return (await red) || Response.error();
}

async function responderCacheFirst(event, nombreCache) {
  const cache = await caches.open(nombreCache);
  const enCache = await cache.match(event.request);
  if (enCache) return enCache;

  const respuesta = await fetch(event.request);
  if (respuesta.ok || respuesta.type === 'opaque') {
    event.waitUntil(cache.put(event.request, respuesta.clone()));
  }
  return respuesta;
}

async function responderFuenteCSS(event) {
  const url = event.request.url;
  const cache = await caches.open(CACHE_CDN);
  const enCache = await cache.match(url);

  const red = fetch(url, { mode: 'cors', credentials: 'omit' })
    .then(async (respuesta) => {
      if (respuesta.ok) await cache.put(url, respuesta.clone());
      return respuesta;
    })
    .catch(() => null);

  if (enCache) {
    event.waitUntil(red);
    return enCache;
  }
  return (await red) || Response.error();
}

async function responderExistenciaAudio(event) {
  const cache = await caches.open(CACHE_AUDIO_META);
  const clave = new Request(event.request.url);
  const previo = await cache.match(clave);

  const consultar = async () => {
    try {
      const respuesta = await fetch(event.request);
      if (respuesta.ok || respuesta.status === 404) {
        await cache.put(clave, new Response(null, {
          status: 200,
          headers: { 'x-existe': respuesta.ok ? '200' : '404', 'x-t': String(Date.now()) }
        }));
        return respuesta.ok ? 200 : 404;
      }
    } catch (_) {}
    return null;
  };

  if (previo) {
    const estado = Number(previo.headers.get('x-existe')) === 200 ? 200 : 404;
    const edad = Date.now() - Number(previo.headers.get('x-t') || 0);
    const ttl = estado === 200 ? TTL_AUDIO_EXISTE_MS : TTL_AUDIO_NO_EXISTE_MS;
    if (edad >= ttl) event.waitUntil(consultar());
    return new Response(null, { status: estado });
  }

  const estado = await consultar();
  return new Response(null, { status: estado === null ? 404 : estado });
}

self.addEventListener('fetch', (event) => {
  const peticion = event.request;
  const url = new URL(peticion.url);
  const mismoOrigen = url.origin === self.location.origin;

  if (mismoOrigen && url.pathname.includes('/Grabaciones/')) {
    if (peticion.method === 'HEAD') event.respondWith(responderExistenciaAudio(event));
    return;
  }

  if (peticion.method !== 'GET' || peticion.headers.has('range')) return;

  if (!mismoOrigen) {
    if (url.hostname === 'fonts.googleapis.com') {
      event.respondWith(responderFuenteCSS(event));
    } else if (
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'cdnjs.cloudflare.com' ||
      (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
    ) {
      event.respondWith(responderCacheFirst(event, CACHE_CDN));
    }
    return;
  }

  if (url.pathname.includes('/samples/')) {
    event.respondWith(responderCacheFirst(event, CACHE_MUESTRAS));
    return;
  }

  if (peticion.mode === 'navigate') {
    event.respondWith(responderPagina(event, url));
    return;
  }

  event.respondWith(responderRecurso(event));
});