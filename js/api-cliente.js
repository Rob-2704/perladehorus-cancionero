const DB_URL = 'https://rondalla-f04a4-default-rtdb.firebaseio.com';

const STORAGE_KEY = 'cache_canciones_perla_v1';
const IDB_NOMBRE = 'perla-cache';
const IDB_TABLA = 'kv';
const PREFIJO_CANCION = 'c:';
const CLAVE_ANTIGUA_IDB = 'canciones_v2';

const TIMEOUT_LISTA_MS = 20000;
const TIMEOUT_CANCION_MS = 10000;
const TIMEOUT_NODO_MS = 3000;
const ESPERA_CANCION_CON_CACHE_MS = 1500; 
const MIN_ENTRE_SINCRONIZACIONES_MS = 60000;

// ───────── Estado de guardado ─────────

let callbacksEstadoGuardado = [];
let estadoActualGuardado = 'guardando';

export function alCambiarEstadoGuardado(callback) {
    callbacksEstadoGuardado.push(callback);
    callback(estadoActualGuardado);
}

function notificarEstadoGuardado(nuevoEstado) {
    if (nuevoEstado === estadoActualGuardado) return;
    estadoActualGuardado = nuevoEstado;
    callbacksEstadoGuardado.forEach(cb => { try { cb(nuevoEstado); } catch (e) {} });
}

const callbacksActualizacion = [];
export function alActualizarCanciones(callback) {
    callbacksActualizacion.push(callback);
}

// ───────── IndexedDB ─────────

let conexionIDB = null;

function abrirIDB() {
    if (!conexionIDB) {
        conexionIDB = new Promise((resolver, rechazar) => {
            if (typeof indexedDB === 'undefined') return rechazar(new Error('Sin IndexedDB'));
            const peticion = indexedDB.open(IDB_NOMBRE, 1);
            peticion.onupgradeneeded = () => {
                if (!peticion.result.objectStoreNames.contains(IDB_TABLA)) {
                    peticion.result.createObjectStore(IDB_TABLA);
                }
            };
            peticion.onsuccess = () => resolver(peticion.result);
            peticion.onerror = () => rechazar(peticion.error);
        }).catch(error => {
            conexionIDB = null;
            throw error;
        });
    }
    return conexionIDB;
}

function transaccionIDB(modo, operacion) {
    return abrirIDB().then(db => new Promise((resolver, rechazar) => {
        const tx = db.transaction(IDB_TABLA, modo);
        let resultado;
        try {
            resultado = operacion(tx.objectStore(IDB_TABLA));
        } catch (e) {
            return rechazar(e);
        }
        tx.oncomplete = () => resolver(
            (typeof IDBRequest !== 'undefined' && resultado instanceof IDBRequest) ? resultado.result : resultado
        );
        tx.onerror = () => rechazar(tx.error);
        tx.onabort = () => rechazar(tx.error);
    }));
}

const idbLeer = clave => transaccionIDB('readonly', s => s.get(clave));

const idbEscribir = (pares, borrar = []) => transaccionIDB('readwrite', s => {
    pares.forEach(([clave, valor]) => s.put(valor, clave));
    borrar.forEach(clave => s.delete(clave));
});

const idbLeerPrefijo = prefijo => transaccionIDB('readonly', s => {
    const salida = {};
    const cursor = s.openCursor(IDBKeyRange.bound(prefijo, prefijo + '\uffff'));
    cursor.onsuccess = () => {
        const actual = cursor.result;
        if (actual) {
            salida[String(actual.key).slice(prefijo.length)] = actual.value;
            actual.continue();
        }
    };
    return salida;
});

// ───────── Datos ─────────

function normalizarCanciones(datos) {
    const salida = {};
    if (!datos || typeof datos !== 'object') return salida;
    const entradas = Array.isArray(datos)
        ? datos.map((valor, i) => [String(i), valor])
        : Object.entries(datos);
    for (const [id, cancion] of entradas) {
        if (id === '0') continue;
        if (cancion && typeof cancion === 'object') salida[id] = cancion;
    }
    return salida;
}

const mismaCancion = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function calcularCambios(anterior, nuevo) {
    const cambiadas = [];
    const eliminadas = [];
    for (const id in nuevo) {
        if (!anterior || !(id in anterior) || !mismaCancion(anterior[id], nuevo[id])) cambiadas.push(id);
    }
    if (anterior) {
        for (const id in anterior) if (!(id in nuevo)) eliminadas.push(id);
    }
    return { cambiadas, eliminadas };
}

let cacheCanciones = null;       
let cacheEstaEnIDB = false;      

async function leerCacheLocal() {
    try {
        const porCancion = await idbLeerPrefijo(PREFIJO_CANCION);
        if (Object.keys(porCancion).length > 0) return { datos: porCancion, enIDB: true };

        const antiguo = await idbLeer(CLAVE_ANTIGUA_IDB);
        if (antiguo && typeof antiguo === 'object') return { datos: normalizarCanciones(antiguo), enIDB: false };
    } catch (e) {}

    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) return { datos: normalizarCanciones(JSON.parse(guardado)), enIDB: false };
    } catch (e) {}

    return null;
}

async function guardarCacheLocal(nuevo, cambios, hayBaseEnIDB) {
    const pares = [];
    const borrar = [];

    const aEscribir = hayBaseEnIDB ? cambios.cambiadas : Object.keys(nuevo);
    aEscribir.forEach(id => pares.push([PREFIJO_CANCION + id, nuevo[id]]));
    if (hayBaseEnIDB) cambios.eliminadas.forEach(id => borrar.push(PREFIJO_CANCION + id));
    else borrar.push(CLAVE_ANTIGUA_IDB); 

    pares.push(['meta:ultima', Date.now()]);

    try {
        await idbEscribir(pares, borrar);
        cacheEstaEnIDB = true;
    } catch (e) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
        } catch (e2) {
            console.warn('No se pudo guardar el caché local:', e2);
        }
    }
}

// ───────── Red ─────────

async function pedirJSON(url, timeoutMs) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
    try {
        const respuesta = await fetch(url, { signal: controlador.signal });
        if (!respuesta.ok) throw new Error(`HTTP \${respuesta.status}`);
        return await respuesta.json();
    } finally {
        clearTimeout(temporizador);
    }
}

async function pedirJSONConReintento(url, timeoutMs, intentos = 2) {
    let ultimoError;
    for (let i = 0; i < intentos; i++) {
        try {
            return await pedirJSON(url, timeoutMs);
        } catch (e) {
            ultimoError = e;
            if (i < intentos - 1) await new Promise(r => setTimeout(r, 400 * (i + 1)));
        }
    }
    throw ultimoError;
}

const sinConexion = () => typeof navigator !== 'undefined' && navigator.onLine === false;

// ───────── Sincronización de canciones ─────────

let descargaEnCurso = null;
let cargaInicialEnCurso = null;
let ultimoIntentoSincronizacion = 0;

function descargarCanciones() {
    if (descargaEnCurso) return descargaEnCurso;

    ultimoIntentoSincronizacion = Date.now();
    notificarEstadoGuardado('guardando');

    descargaEnCurso = pedirJSONConReintento(`\${DB_URL}/canciones.json`, TIMEOUT_LISTA_MS)
        .then(datos => {
            const nuevo = normalizarCanciones(datos);
            const anterior = cacheCanciones;
            const cambios = calcularCambios(anterior, nuevo);
            const huboCambios = cambios.cambiadas.length > 0 || cambios.eliminadas.length > 0;

            cacheCanciones = nuevo;
            guardarCacheLocal(nuevo, cambios, cacheEstaEnIDB && !!anterior);

            notificarEstadoGuardado('completado');
            if (anterior && huboCambios) {
                callbacksActualizacion.forEach(cb => { try { cb(); } catch (e) {} });
            }
            return cacheCanciones;
        })
        .catch(err => {
            console.warn('No se pudo actualizar desde Firebase:', err);
            notificarEstadoGuardado('offline');
            throw err;
        })
        .finally(() => {
            descargaEnCurso = null;
        });

    return descargaEnCurso;
}

function sincronizar(forzar = false) {
    if (descargaEnCurso || sinConexion()) return;
    if (!forzar && Date.now() - ultimoIntentoSincronizacion < MIN_ENTRE_SINCRONIZACIONES_MS) return;
    setTimeout(() => {
        descargarCanciones().catch(() => {});
    }, 800);
}

async function cargarCanciones() {
    if (cacheCanciones) return cacheCanciones;

    if (!cargaInicialEnCurso) {
        cargaInicialEnCurso = (async () => {
            await new Promise(r => setTimeout(r, 300));

            const local = await leerCacheLocal();

            if (local && Object.keys(local.datos).length > 0) {
                cacheCanciones = local.datos;
                cacheEstaEnIDB = local.enIDB;

                if (sinConexion()) notificarEstadoGuardado('offline');
                else sincronizar(true);

                return cacheCanciones;
            }

            if (sinConexion()) {
                notificarEstadoGuardado('offline');
                return {};
            }
            try {
                return await descargarCanciones();
            } catch (e) {
                return {};
            }
        })().finally(() => {
            cargaInicialEnCurso = null;
        });
    }

    return cargaInicialEnCurso;
}

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { if (cacheCanciones) sincronizar(true); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && cacheCanciones) sincronizar(false);
    });
}

export async function obtenerCanciones() {
    const datos = await cargarCanciones();

    const lista = Object.keys(datos).map(idC => {
        const c = datos[idC];
        return {
            idC: String(idC),
            nombreC: c.nombreC || '',
            arreglos: c.arreglos || '',
            estado: c.estado || 'terminada',
            categoria: c.categoria || 'rondalla'
        };
    });

    if (lista.every(c => /^\d+$/.test(c.idC))) {
        lista.sort((a, b) => Number(a.idC) - Number(b.idC));
    }
    return lista;
}

// ───────── Una canción ─────────

async function leerCancionLocal(idC) {
    if (cacheCanciones && cacheCanciones[idC]) return cacheCanciones[idC];

    try {
        const guardada = await idbLeer(PREFIJO_CANCION + idC);
        if (guardada) return guardada;
    } catch (e) {}

    const local = await leerCacheLocal();
    return local && local.datos[idC] ? local.datos[idC] : null;
}

function guardarCancionFresca(idC, fresca, previa) {
    if (previa && mismaCancion(previa, fresca)) return;
    if (cacheCanciones) cacheCanciones[idC] = fresca;
    idbEscribir([[PREFIJO_CANCION + idC, fresca]]).catch(() => {});
}

let sincronizacionProgramada = false;
function programarSincronizacionCompleta() {
    if (sincronizacionProgramada || cacheCanciones || sinConexion()) return;
    sincronizacionProgramada = true;
    setTimeout(() => { cargarCanciones().catch(() => {}); }, 4000);
}

const ESPERA_AGOTADA = Symbol('espera-agotada');

export async function obtenerContenidoCancion(idC) {
    idC = String(idC);
    if (idC === '0') return { error: 'Canción no encontrada' };

    let c = await leerCancionLocal(idC);
    const previa = c;

    if (!(c && sinConexion())) {
        const url = `${DB_URL}/canciones/${encodeURIComponent(idC)}.json`;
        const peticion = pedirJSONConReintento(url, TIMEOUT_CANCION_MS, c ? 1 : 2);

        try {
            let fresca;
            if (c) {
                const resultado = await Promise.race([
                    peticion,
                    new Promise(r => setTimeout(() => r(ESPERA_AGOTADA), ESPERA_CANCION_CON_CACHE_MS))
                ]);
                if (resultado === ESPERA_AGOTADA) {
                    peticion.then(f => { if (f) guardarCancionFresca(idC, f, previa); }).catch(() => {});
                    fresca = null;
                } else {
                    fresca = resultado;
                }
            } else {
                fresca = await peticion;
            }

            if (fresca) {
                c = fresca;
                guardarCancionFresca(idC, fresca, previa);
            } else if (!c) {
                return { error: 'Canción no encontrada' };
            }
        } catch (e) {
            console.warn('No se pudo traer la canción fresca, usando la guardada:', e);
        }
    }

    programarSincronizacionCompleta();

    if (!c) return { error: 'No se pudo cargar la canción. Revisa tu conexión e inténtalo de nuevo.' };

    return {
        idC,
        nombreC: c.nombreC || '',
        contenido: c.contenido || '',
        ytID: '',
        arreglos: c.arreglos || '',
        categoria: c.categoria || 'rondalla',
        estado: c.estado || 'terminada'
    };
}

// ───────── Eventos y Avisos (Con claves totalmente independientes) ─────────

const nodosEnMemoria = new Map();

export async function obtenerNodo(ruta, { alActualizar } = {}) {
    // Normalizar la ruta eliminando cualquier carácter extraño o sufijo $ sobrante
    const rutaLimpia = ruta.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!rutaLimpia) throw new Error('Ruta no válida: ' + ruta);

    // Se asigna una clave de versión limpia (nodo_v2) para aislar avisos de eventos totalmente
    const claveIDB = `nodo_v2:\${rutaLimpia}`;
    
    let datos = nodosEnMemoria.has(rutaLimpia) ? nodosEnMemoria.get(rutaLimpia) : undefined;

    if (datos === undefined) {
        try { 
            datos = await idbLeer(claveIDB); 
            if (datos !== undefined && datos !== null) {
                nodosEnMemoria.set(rutaLimpia, datos);
            }
        } catch (e) {}
    }

    const refrescar = async () => {
        try {
            const fresco = await pedirJSONConReintento(`${DB_URL}/${rutaLimpia}.json`, TIMEOUT_NODO_MS, 1);
            if (fresco !== null && frescaEstructuraValida(rutaLimpia, fresco)) {
                const cambio = JSON.stringify(fresco) !== JSON.stringify(datos);
                nodosEnMemoria.set(rutaLimpia, fresco);
                idbEscribir([[claveIDB, fresco]]).catch(() => {});
                if (cambio && alActualizar && datos !== undefined) { 
                    try { alActualizar(fresco); } catch (e) {} 
                }
                return fresco;
            }
            return datos || null;
        } catch (e) {
            return null;
        }
    };

    if (datos !== undefined && datos !== null) {
        if (!sinConexion()) {
            refrescar().catch(() => {});
        }
        return datos;
    }

    if (sinConexion()) return null;

    try {
        const promesaRed = refrescar();
        const resultadoRapido = await Promise.race([
            promesaRed,
            new Promise(r => setTimeout(() => r(null), TIMEOUT_NODO_MS))
        ]);
        return resultadoRapido !== null ? resultadoRapido : (nodosEnMemoria.get(rutaLimpia) || null);
    } catch (e) {
        return null;
    }
}

// Validación interna para asegurar que los datos obtenidos pertenezcan al tipo correcto
function frescaEstructuraValida(ruta, datos) {
    if (!datos || typeof datos !== 'object') return false;
    const valores = Object.values(datos);
    if (valores.length === 0) return true;
    
    const primerElemento = valores[0];
    if (ruta === 'anuncios') {
        // Un anuncio NO debería tener la propiedad 'lugar' ni 'horaInicio' ni 'canciones'
        return !('lugar' in primerElemento) && !('canciones' in primerElemento);
    }
    if (ruta === 'eventos') {
        // Un evento SIEMPRE suele incluir idE, lugar, horaInicio o canciones
        return ('lugar' in primerElemento) || ('horaInicio' in primerElemento) || ('canciones' in primerElemento) || ('idE' in primerElemento);
    }
    return true;
}