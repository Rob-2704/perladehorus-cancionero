const DATABASE_URL = 'https://rondalla-f04a4-default-rtdb.firebaseio.com';
const FIREBASE_VERSION = '10.8.0';
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA3g3DmWC_mYrA2RFj75sOoX9kolmzKINA",
    authDomain: "rondalla-f04a4.firebaseapp.com",
    databaseURL: DATABASE_URL,
    projectId: "rondalla-f04a4",
    storageBucket: "rondalla-f04a4.firebasestorage.app",
    messagingSenderId: "835273996097",
    appId: "1:835273996097:web:f1258c2f461ef6613513c0"
};

const IDB_NOMBRE = 'cancionero-perla';
const IDB_VERSION = 1;
const STORAGE_KEY_CANCIONES = 'cache_canciones_perla_v1'; // copia antigua (se migra a IndexedDB)
const STORAGE_KEY_EVENTOS = 'cache_eventos_perla';
const STORAGE_KEY_AVISOS = 'cache_avisos_perla';

const TIMEOUT_REST_MS = 12000;
const TIMEOUT_SDK_MS = 10000;
const REFRESCO_MIN_MS = 60000; // al volver a la pestaña, no sincronizar si hace menos de 1 min

const ESTADOS_VALIDOS = ['terminada', 'revisar', 'pendiente'];
const CATEGORIAS_VALIDAS = ['rondalla', 'general'];

// ───────────────────────── Utilidades ─────────────────────────

export function escaparHTML(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function conTimeout(promesa, ms, mensaje = 'Tiempo de espera agotado') {
    let temporizador;
    const limite = new Promise((_, rechazar) => {
        temporizador = setTimeout(() => rechazar(new Error(mensaje)), ms);
    });
    return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

function aObjeto(crudo) {
    if (!crudo || typeof crudo !== 'object') return {};
    if (Array.isArray(crudo)) {
        const salida = {};
        crudo.forEach((v, i) => { if (v !== null && v !== undefined) salida[String(i)] = v; });
        return salida;
    }
    return crudo;
}

// ───────────────────────── Estado de guardado (indicador del index) ─────────────────────────

let callbacksEstadoGuardado = [];
let estadoActualGuardado = 'guardando';

export function alCambiarEstadoGuardado(callback) {
    callbacksEstadoGuardado.push(callback);
    callback(estadoActualGuardado);
}

function notificarEstadoGuardado(nuevoEstado) {
    if (nuevoEstado === estadoActualGuardado) return;
    estadoActualGuardado = nuevoEstado;
    callbacksEstadoGuardado.forEach(cb => { try { cb(nuevoEstado); } catch (_) {} });
}

// ───────────────────────── Aviso de datos actualizados ─────────────────────────
// Las páginas pueden suscribirse para re-renderizar cuando llegue una versión más nueva:
//   alActualizarDatos((coleccion, datos) => { if (coleccion === 'canciones') ... });

const callbacksDatos = [];

export function alActualizarDatos(callback) {
    callbacksDatos.push(callback);
    return () => {
        const i = callbacksDatos.indexOf(callback);
        if (i !== -1) callbacksDatos.splice(i, 1);
    };
}

function notificarDatos(coleccion, datos) {
    callbacksDatos.forEach(cb => { try { cb(coleccion, datos); } catch (_) {} });
}

// ───────────────────────── Firebase SDK (solo como respaldo) ─────────────────────────

let promesaFirebase = null;

async function obtenerBaseDatosFirebase() {
    if (!promesaFirebase) {
        promesaFirebase = (async () => {
            const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
            const [appModule, dbModule] = await Promise.all([
                import(`${base}firebase-app.js`),
                import(`${base}firebase-database.js`)
            ]);
            const app = appModule.getApps().length === 0
                ? appModule.initializeApp(FIREBASE_CONFIG)
                : appModule.getApps()[0];
            return { db: dbModule.getDatabase(app), dbModule };
        })();
        promesaFirebase.catch(() => { promesaFirebase = null; });
    }
    return promesaFirebase;
}

// ───────────────────────── Lectura remota ─────────────────────────

// REST directo primero (rápido y ligero); SDK de Firebase como respaldo.
async function leerRemoto(ruta) {
    if (!/^[A-Za-z0-9_\-\/]+$/.test(ruta)) throw new Error('Ruta inválida');
    if (!navigator.onLine) throw new Error('Sin conexión');

    try {
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_REST_MS);
        try {
            const respuesta = await fetch(`${DATABASE_URL}/${ruta}.json`, {
                signal: controlador.signal,
                cache: 'no-store',
                credentials: 'omit'
            });
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            return await respuesta.json();
        } finally {
            clearTimeout(temporizador);
        }
    } catch (errorRest) {
        if (!navigator.onLine) throw errorRest;
        const { db, dbModule } = await obtenerBaseDatosFirebase();
        const snapshot = await conTimeout(dbModule.get(dbModule.ref(db, ruta)), TIMEOUT_SDK_MS);
        return snapshot.val();
    }
}

// ───────────────────────── IndexedDB (canciones) ─────────────────────────

let promesaIDB = null;

function abrirIDB() {
    if (promesaIDB) return promesaIDB;
    promesaIDB = new Promise((resolver, rechazar) => {
        if (typeof indexedDB === 'undefined') { rechazar(new Error('IndexedDB no disponible')); return; }
        const peticion = indexedDB.open(IDB_NOMBRE, IDB_VERSION);
        peticion.onupgradeneeded = () => {
            const db = peticion.result;
            if (!db.objectStoreNames.contains('canciones')) db.createObjectStore('canciones', { keyPath: 'idC' });
            if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        };
        peticion.onsuccess = () => {
            const db = peticion.result;
            db.onversionchange = () => { db.close(); promesaIDB = null; };
            resolver(db);
        };
        peticion.onerror = () => rechazar(peticion.error);
        peticion.onblocked = () => rechazar(new Error('IndexedDB bloqueada'));
    });
    promesaIDB.catch(() => { promesaIDB = null; });
    return promesaIDB;
}

// Valida y normaliza lo que llega de la base de datos (o de una copia vieja).
function normalizarCanciones(crudo) {
    const salida = {};
    const texto = (v) => (typeof v === 'string' ? v : (v === null || v === undefined ? '' : String(v)));

    for (const [clave, c] of Object.entries(aObjeto(crudo))) {
        if (!c || typeof c !== 'object') continue;
        const id = String(clave).trim();
        if (!/^\d+$/.test(id) || Number(id) <= 0) continue;

        salida[id] = {
            idC: id,
            nombreC: texto(c.nombreC),
            arreglos: texto(c.arreglos),
            estado: ESTADOS_VALIDOS.includes(c.estado) ? c.estado : 'terminada',
            categoria: CATEGORIAS_VALIDAS.includes(c.categoria) ? c.categoria : 'rondalla',
            contenido: texto(c.contenido)
        };
    }
    return salida;
}

// Escritura atómica: si algo falla, la transacción se cancela y la copia anterior queda intacta.
async function guardarCancionesLocal(canciones) {
    try {
        const db = await abrirIDB();
        await new Promise((resolver, rechazar) => {
            const tx = db.transaction(['canciones', 'meta'], 'readwrite');
            const almacen = tx.objectStore('canciones');
            almacen.clear();
            Object.values(canciones).forEach(c => almacen.put(c));
            tx.objectStore('meta').put(Date.now(), 'actualizado');
            tx.oncomplete = () => resolver();
            tx.onerror = () => rechazar(tx.error);
            tx.onabort = () => rechazar(tx.error || new Error('Transacción cancelada'));
        });
        try { localStorage.removeItem(STORAGE_KEY_CANCIONES); } catch (_) {}
    } catch (_) {
        // Respaldo: localStorage (puede fallar por cuota; entonces solo queda en memoria)
        try { localStorage.setItem(STORAGE_KEY_CANCIONES, JSON.stringify(canciones)); }
        catch (e) { console.warn('No se pudo guardar la copia local de canciones.'); }
    }
}

async function guardarUnaCancionLocal(cancion) {
    try {
        const db = await abrirIDB();
        await new Promise((resolver, rechazar) => {
            const tx = db.transaction('canciones', 'readwrite');
            tx.objectStore('canciones').put(cancion);
            tx.oncomplete = () => resolver();
            tx.onerror = () => rechazar(tx.error);
            tx.onabort = () => rechazar(tx.error);
        });
    } catch (_) {}
}

async function leerCancionesLocal() {
    try {
        const db = await abrirIDB();
        const lista = await new Promise((resolver, rechazar) => {
            const peticion = db.transaction('canciones').objectStore('canciones').getAll();
            peticion.onsuccess = () => resolver(peticion.result || []);
            peticion.onerror = () => rechazar(peticion.error);
        });
        if (lista.length > 0) {
            const mapa = {};
            lista.forEach(c => { if (c && c.idC) mapa[c.idC] = c; });
            const normalizadas = normalizarCanciones(mapa);
            if (Object.keys(normalizadas).length > 0) return normalizadas;
        }
    } catch (_) {}

    // Migración desde la copia antigua en localStorage
    try {
        const guardado = localStorage.getItem(STORAGE_KEY_CANCIONES);
        if (guardado) {
            const normalizadas = normalizarCanciones(JSON.parse(guardado));
            if (Object.keys(normalizadas).length > 0) {
                guardarCancionesLocal(normalizadas); // migra a IndexedDB en segundo plano
                return normalizadas;
            }
        }
    } catch (_) {}

    return null;
}

// ───────────────────────── Canciones ─────────────────────────

let datosCanciones = null; // { idC: registro }
let promesaCanciones = null;
let sincronizandoCanciones = null;
let ultimaSincronizacion = 0;

function sincronizarCanciones() {
    if (sincronizandoCanciones) return sincronizandoCanciones;

    sincronizandoCanciones = (async () => {
        const habiaDatos = !!datosCanciones && Object.keys(datosCanciones).length > 0;
        try {
            const remotas = normalizarCanciones(await leerRemoto('canciones'));
            ultimaSincronizacion = Date.now();

            // Protección: nunca borrar la copia local por una respuesta vacía o inválida
            if (Object.keys(remotas).length === 0) {
                notificarEstadoGuardado('completado');
                return datosCanciones || {};
            }

            // Sin cambios: no se reescribe nada
            if (habiaDatos && JSON.stringify(remotas) === JSON.stringify(datosCanciones)) {
                notificarEstadoGuardado('completado');
                return datosCanciones;
            }

            notificarEstadoGuardado('guardando');
            datosCanciones = remotas;           // la interfaz ya puede usar lo nuevo
            notificarDatos('canciones', datosCanciones);
            await guardarCancionesLocal(remotas);
            notificarEstadoGuardado('completado');
            return datosCanciones;
        } catch (err) {
            console.warn('No se pudo sincronizar canciones, se usa la copia local.', err && err.message);
            notificarEstadoGuardado('offline');
            return datosCanciones || {};
        } finally {
            sincronizandoCanciones = null;
        }
    })();

    return sincronizandoCanciones;
}

function cargarCanciones() {
    if (!promesaCanciones) {
        promesaCanciones = (async () => {
            const local = await leerCancionesLocal();

            if (local) {
                datosCanciones = local;
                notificarEstadoGuardado(navigator.onLine ? 'completado' : 'offline');
                if (navigator.onLine) sincronizarCanciones(); // sin esperar
                return datosCanciones;
            }

            if (!navigator.onLine) {
                datosCanciones = {};
                notificarEstadoGuardado('offline');
                return datosCanciones;
            }

            await sincronizarCanciones(); // primera vez: no hay nada local que mostrar
            datosCanciones = datosCanciones || {};
            return datosCanciones;
        })();

        // Si no se obtuvo nada, permitir reintentar en la siguiente llamada
        promesaCanciones.then(d => { if (!d || Object.keys(d).length === 0) promesaCanciones = null; });
    }
    return promesaCanciones;
}

export async function obtenerCanciones() {
    await cargarCanciones();
    return Object.values(datosCanciones || {}).map(c => ({
        idC: c.idC,
        nombreC: c.nombreC,
        arreglos: c.arreglos,
        estado: c.estado,
        categoria: c.categoria
    }));
}

export async function obtenerContenidoCancion(idC) {
    await cargarCanciones();
    const id = String(idC ?? '').trim();
    let c = datosCanciones ? datosCanciones[id] : null;

    // Canción más nueva que la copia local: se pide solo esa
    if (!c && navigator.onLine && /^\d+$/.test(id)) {
        try {
            const normalizada = normalizarCanciones({ [id]: await leerRemoto(`canciones/${id}`) })[id];
            if (normalizada) {
                c = normalizada;
                datosCanciones = { ...(datosCanciones || {}), [id]: c };
                guardarUnaCancionLocal(c);
            }
        } catch (_) {}
    }

    if (!c) return { error: 'Canción no encontrada' };

    return {
        idC: id,
        nombreC: c.nombreC,
        contenido: c.contenido,
        ytID: '',
        arreglos: c.arreglos,
        categoria: c.categoria,
        estado: c.estado
    };
}

// ───────────────────────── Eventos y avisos (colecciones pequeñas) ─────────────────────────

function crearColeccion({ nombre, ruta, claveLS }) {
    let datos = null;
    let promesa = null;
    let sincronizando = null;

    function leerLocal() {
        try {
            const guardado = localStorage.getItem(claveLS);
            if (guardado) {
                const objeto = aObjeto(JSON.parse(guardado));
                if (Object.keys(objeto).length > 0) return objeto;
            }
        } catch (_) {}
        return null;
    }

    function sincronizar() {
        if (sincronizando) return sincronizando;
        sincronizando = (async () => {
            try {
                const remoto = aObjeto(await leerRemoto(ruta));
                if (!datos || JSON.stringify(remoto) !== JSON.stringify(datos)) {
                    datos = remoto;
                    try { localStorage.setItem(claveLS, JSON.stringify(remoto)); } catch (_) {}
                    notificarDatos(nombre, datos);
                }
            } catch (err) {
                console.warn(`No se pudo sincronizar ${nombre}, se usa la copia local.`, err && err.message);
            } finally {
                sincronizando = null;
            }
            return datos || {};
        })();
        return sincronizando;
    }

    async function obtener() {
        if (datos) return datos;
        if (!promesa) {
            promesa = (async () => {
                const local = leerLocal();
                if (local) {
                    datos = local;
                    if (navigator.onLine) sincronizar(); // sin esperar
                    return datos;
                }
                if (navigator.onLine) await sincronizar();
                return datos || {};
            })();
            promesa.then(() => { if (!datos) promesa = null; });
        }
        return promesa;
    }

    return { obtener, sincronizar };
}

const coleccionEventos = crearColeccion({ nombre: 'eventos', ruta: 'eventos', claveLS: STORAGE_KEY_EVENTOS });
const coleccionAvisos = crearColeccion({ nombre: 'avisos', ruta: 'anuncios', claveLS: STORAGE_KEY_AVISOS });

export function obtenerEventos() { return coleccionEventos.obtener(); }
export function obtenerAvisos() { return coleccionAvisos.obtener(); }

export async function obtenerEvento(idE) {
    const todos = await obtenerEventos();
    const id = String(idE ?? '');
    return todos[id] || Object.values(todos).find(e => e && String(e.idE) === id) || null;
}

// Fuerza una sincronización inmediata (útil tras guardar cambios desde el panel de administración).
export function sincronizarAhora() {
    return Promise.allSettled([
        sincronizarCanciones(),
        coleccionEventos.sincronizar(),
        coleccionAvisos.sincronizar()
    ]);
}

// ───────────────────────── Arranque ─────────────────────────

async function pedirAlmacenamientoPersistente() {
    // Evita que el navegador borre la copia local cuando falte espacio
    try {
        if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) {
            await navigator.storage.persist();
        }
    } catch (_) {}
}

if (typeof window !== 'undefined') {
    const refrescarTodo = () => { sincronizarAhora(); };

    window.addEventListener('online', refrescarTodo);
    window.addEventListener('offline', () => notificarEstadoGuardado('offline'));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine &&
            Date.now() - ultimaSincronizacion > REFRESCO_MIN_MS) {
            refrescarTodo();
        }
    });

    pedirAlmacenamientoPersistente();

    // Precarga en paralelo al iniciar
    cargarCanciones().catch(() => {});
    obtenerEventos().catch(() => {});
    obtenerAvisos().catch(() => {});
}