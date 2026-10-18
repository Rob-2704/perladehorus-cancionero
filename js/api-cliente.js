// api-cliente.js — Conectado a Firebase con caché local y notificación de estado
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA3g3DmWC_mYrA2RFj75sOoX9kolmzKINA",
    authDomain: "rondalla-f04a4.firebaseapp.com",
    databaseURL: "https://rondalla-f04a4-default-rtdb.firebaseio.com",
    projectId: "rondalla-f04a4",
    storageBucket: "rondalla-f04a4.firebasestorage.app",
    messagingSenderId: "835273996097",
    appId: "1:835273996097:web:f1258c2f461ef6613513c0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let cacheCanciones = null;
const STORAGE_KEY = 'cache_canciones_perla_v1';

// Suscriptores del estado de guardado
let callbacksEstadoGuardado = [];
let estadoActualGuardado = 'guardando'; // 'guardando' | 'completado' | 'offline'

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

    try {
        const [snapshotCanciones, snapshotCustom] = await Promise.all([
            get(ref(db, 'canciones')),
            get(ref(db, 'canciones_custom'))
        ]);

        const datosCanciones = snapshotCanciones.val() || {};
        const datosCustom = snapshotCustom.val() || {};

        const combinadas = { ...datosCanciones, ...datosCustom };
        cacheCanciones = combinadas;

        // Guardar todas las letras en localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combinadas));
        } catch (e) {
            console.warn("No se pudo guardar en el almacenamiento local:", e);
        }

        notificarEstadoGuardado('completado');
        return combinadas;
    } catch (err) {
        console.warn("Sin conexión a Internet. Cargando canciones desde el almacenamiento local...", err);
        
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

    if (!c) {
        try {
            const snapCustom = await get(ref(db, `canciones_custom/\${idC}`));
            if (snapCustom.exists()) {
                c = snapCustom.val();
            } else {
                const snapNorm = await get(ref(db, `canciones/\${idC}`));
                if (snapNorm.exists()) {
                    c = snapNorm.val();
                }
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