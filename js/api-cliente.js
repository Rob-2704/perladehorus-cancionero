const STORAGE_KEY = 'cache_canciones_perla_v1';
let cacheCanciones = null;

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

async function cargarDatosFirebase() {
    if (cacheCanciones) {
        return cacheCanciones;
    }

    notificarEstadoGuardado('guardando');

    if (!navigator.onLine) {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            if (guardado) {
                cacheCanciones = JSON.parse(guardado);
                notificarEstadoGuardado('offline');
                return cacheCanciones;
            }
        } catch (e) {}
        notificarEstadoGuardado('offline');
        return {};
    }

    try {
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

        const fetchConTimeout = (promise, ms = 3500) => {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Timeout de conexión')), ms);
            });
            return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
        };

        const snapshotCanciones = await fetchConTimeout(dbModule.get(dbModule.ref(db, 'canciones')), 3500);
        const datosCanciones = snapshotCanciones.val() || {};

        cacheCanciones = datosCanciones;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(datosCanciones));
        } catch (e) {
            console.warn("No se pudo guardar en el almacenamiento local:", e);
        }

        notificarEstadoGuardado('completado');
        return datosCanciones;
    } catch (err) {
        console.warn("Modo offline o error de red. Cargando desde almacenamiento local...", err);
        
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            if (guardado) {
                cacheCanciones = JSON.parse(guardado);
                notificarEstadoGuardado('offline');
                return cacheCanciones;
            }
        } catch (e) {}

        notificarEstadoGuardado('offline');
        return {};
    }
}

if (typeof window !== 'undefined') {
    cargarDatosFirebase().catch(() => {});
}

export async function obtenerCanciones() {
    const datos = await cargarDatosFirebase();
    return Object.keys(datos).map(idC => {
        const c = datos[idC];
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
    const datos = await cargarDatosFirebase();
    let c = datos[idC];

    if (!c && navigator.onLine) {
        try {
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