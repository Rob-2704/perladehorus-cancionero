const STORAGE_KEY_CANCIONES = 'cache_canciones_perla_v1';
const STORAGE_KEY_EVENTOS = 'cache_eventos_perla';
const STORAGE_KEY_AVISOS = 'cache_avisos_perla';

let cacheCancionesMemoria = null;
let cacheEventosMemoria = null;
let cacheAvisosMemoria = null;

let callbacksEstadoGuardado = [];
let estadoActualGuardado = 'guardando';

export function alCambiarEstadoGuardado(callback) {
    callbacksEstadoGuardado.push(callback);
    callback(estadoActualGuardado);
}

function notificarEstadoGuardado(nuevoEstado) {
    estadoActualGuardado = nuevoEstado;
    callbacksEstadoGuardado.forEach(cb => cb(nuevoEstado));
}

// Módulo compartido para inicializar Firebase de forma eficiente
async function obtenerBaseDatosFirebase() {
    const [appModule, dbModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js")
    ]);

    const firebaseConfig = {
        apiKey: "AIzaSyA3g3DmWC_mYrA2RFj75sOoX9kolmzKINA",
        authDomain: "rondalla-f04a4.firebaseapp.com",
        databaseURL: "https://rondalla-f04a4-default-rtdb.firebaseio.com",
        projectId: "rondalla-f04a4",
        storageBucket: "rondalla-f04a4.firebasestorage.app",
        messagingSenderId: "835273996097",
        appId: "1:835273996097:web:f1258c2f461ef6613513c0"
    };

    const app = appModule.getApps().length === 0 ? appModule.initializeApp(firebaseConfig) : appModule.getApps()[0];
    const db = dbModule.getDatabase(app);
    return { db, dbModule };
}

// Obtención ultrarrápida combinando caché local y red en segundo plano
async function obtenerDatosConCacheOptimizado(endpoint, storageKey) {
    let datosLocales = null;
    try {
        const guardado = localStorage.getItem(storageKey);
        if (guardado) {
            datosLocales = JSON.parse(guardado);
        }
    } catch (e) {}

    if (!navigator.onLine) {
        notificarEstadoGuardado('offline');
        return datosLocales || {};
    }

    notificarEstadoGuardado('guardando');

    const sincronizarRed = async () => {
        try {
            const { db, dbModule } = await obtenerBaseDatosFirebase();
            const snapshot = await dbModule.get(dbModule.ref(db, endpoint));
            const datosRemotos = snapshot.val() || {};
            
            if (Object.keys(datosRemotos).length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(datosRemotos));
                notificarEstadoGuardado('completado');
                return datosRemotos;
            }
        } catch (err) {
            console.warn(`Error de red al actualizar ${endpoint}, usando modo offline.`);
        }
        notificarEstadoGuardado(datosLocales ? 'offline' : 'completado');
        return datosLocales || {};
    };

    if (datosLocales && Object.keys(datosLocales).length > 0) {
        sincronizarRed();
        notificarEstadoGuardado('completado');
        return datosLocales;
    }

    return await sincronizarRed();
}

async function cargarCancionesOptimizado() {
    if (cacheCancionesMemoria) return cacheCancionesMemoria;
    cacheCancionesMemoria = await obtenerDatosConCacheOptimizado('canciones', STORAGE_KEY_CANCIONES);
    return cacheCancionesMemoria;
}

// Priorizar carga anticipada (pre-fetch) de avisos y eventos en segundo plano al iniciar
if (typeof window !== 'undefined') {
    cargarCancionesOptimizado().catch(() => {});
    obtenerAvisos().catch(() => {});
    obtenerEventos().catch(() => {});
}

export async function obtenerCanciones() {
    const datos = await cargarCancionesOptimizado();
    return Object.keys(datos)
        .filter(idC => idC !== null && idC !== undefined && String(idC).trim() !== '' && Number(idC) > 0)
        .map(idC => {
            const c = datos[idC] || {};
            return {
                idC: String(idC),
                nombreC: c.nombreC || '',
                arreglos: c.arreglos || '',
                estado: c.estado || 'terminada',
                categoria: c.categoria || 'rondalla'
            };
        });
}

export async function obtenerContenidoCancion(idC) {
    const datos = await cargarCancionesOptimizado();
    let c = datos[idC];

    if (!c && navigator.onLine) {
        try {
            const { db, dbModule } = await obtenerBaseDatosFirebase();
            const snapNorm = await dbModule.get(dbModule.ref(db, `canciones/${idC}`));
            if (snapNorm.exists()) {
                c = snapNorm.val();
            }
        } catch (e) {}
    }

    if (!c) return { error: 'Canción no encontrada' };

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

export async function obtenerEventos() {
    if (cacheEventosMemoria) return cacheEventosMemoria;
    cacheEventosMemoria = await obtenerDatosConCacheOptimizado('eventos', STORAGE_KEY_EVENTOS);
    return cacheEventosMemoria;
}

export async function obtenerAvisos() {
    if (cacheAvisosMemoria) return cacheAvisosMemoria;
    cacheAvisosMemoria = await obtenerDatosConCacheOptimizado('anuncios', STORAGE_KEY_AVISOS);
    return cacheAvisosMemoria;
}