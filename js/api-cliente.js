// api-cliente.js — Conectado a Firebase con caché local automática para PWA
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

async function cargarDatosFirebase() {
    if (cacheCanciones) return cacheCanciones;

    try {
        // Al abrir el index, esto descarga de Firebase TODO el catálogo y sus letras en una sola petición
        const [snapshotCanciones, snapshotCustom] = await Promise.all([
            get(ref(db, 'canciones')),
            get(ref(db, 'canciones_custom'))
        ]);

        const datosCanciones = snapshotCanciones.val() || {};
        const datosCustom = snapshotCustom.val() || {};

        const combinadas = { ...datosCanciones, ...datosCustom };
        cacheCanciones = combinadas;

        // GUARDADO AUTOMÁTICO LOCAL: Almacena todas las canciones y letras en la PWA
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combinadas));
        } catch (e) {
            console.warn("No se pudo guardar en el almacenamiento local:", e);
        }

        return combinadas;
    } catch (err) {
        console.warn("Sin conexión a Internet. Cargando canciones desde el almacenamiento local...", err);
        
        // Si estás offline, recupera instantáneamente todo el catálogo guardado localmente
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            if (guardado) {
                cacheCanciones = JSON.parse(guardado);
                return cacheCanciones;
            }
        } catch (e) {}

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

    // Si por alguna razón no está en caché, intenta consultarlo directamente
    if (!c) {
        try {
            const snapCustom = await get(ref(db, `canciones_custom/${idC}`));
            if (snapCustom.exists()) {
                c = snapCustom.val();
            } else {
                const snapNorm = await get(ref(db, `canciones/${idC}`));
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