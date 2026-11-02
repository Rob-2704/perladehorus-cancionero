import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const auth = getAuth(app);
export const ADMINS_PERMITIDOS = ["elgamer00727@gmail.com", "todoeschido21@gmail.com"];

const IDB_NOMBRE = 'cancionero-perla';
const IDB_VERSION = 1;
const STORAGE_KEY_CANCIONES = 'cache_canciones_perla_v1';
const STORAGE_KEY_EVENTOS = 'cache_eventos_perla';
const STORAGE_KEY_AVISOS = 'cache_avisos_perla';
const TIMEOUT_REST_MS = 12000;
const TIMEOUT_SDK_MS = 10000;
const REFRESCO_MIN_MS = 60000;
const ESTADOS_VALIDOS = ['terminada', 'revisar', 'pendiente'];
const CATEGORIAS_VALIDAS = ['rondalla', 'general'];

export function escaparHTML(texto) {
    return String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

let promesaFirebase = null;
async function obtenerBaseDatosFirebase() {
    if (!promesaFirebase) {
        promesaFirebase = (async () => {
            const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
            const [appModule, dbModule] = await Promise.all([
                import(`${base}firebase-app.js`),
                import(`${base}firebase-database.js`)
            ]);
            const app = appModule.getApps().length === 0 ? appModule.initializeApp(FIREBASE_CONFIG) : appModule.getApps()[0];
            return { db: dbModule.getDatabase(app), dbModule };
        })();
        promesaFirebase.catch(() => { promesaFirebase = null; });
    }
    return promesaFirebase;
}

async function leerRemoto(ruta) {
    if (!/^[A-Za-z0-9_\-\/]+$/.test(ruta)) throw new Error('Ruta inválida');
    if (!navigator.onLine) throw new Error('Sin conexión');
    try {
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_REST_MS);
        try {
            const respuesta = await fetch(`${DATABASE_URL}/${ruta}.json`, { signal: controlador.signal, cache: 'no-store', credentials: 'omit' });
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            return await respuesta.json();
        } finally { clearTimeout(temporizador); }
    } catch (errorRest) {
        if (!navigator.onLine) throw errorRest;
        const { db, dbModule } = await obtenerBaseDatosFirebase();
        const snapshot = await conTimeout(dbModule.get(dbModule.ref(db, ruta)), TIMEOUT_SDK_MS);
        return snapshot.val();
    }
}

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
        });
        try { localStorage.removeItem(STORAGE_KEY_CANCIONES); } catch (_) {}
    } catch (_) {
        try { localStorage.setItem(STORAGE_KEY_CANCIONES, JSON.stringify(canciones)); } catch (e) {}
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
    try {
        const guardado = localStorage.getItem(STORAGE_KEY_CANCIONES);
        if (guardado) {
            const normalizadas = normalizarCanciones(JSON.parse(guardado));
            if (Object.keys(normalizadas).length > 0) {
                guardarCancionesLocal(normalizadas);
                return normalizadas;
            }
        }
    } catch (_) {}
    return null;
}

let datosCanciones = null;
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
            if (Object.keys(remotas).length === 0) {
                notificarEstadoGuardado('completado');
                return datosCanciones || {};
            }
            if (habiaDatos && JSON.stringify(remotas) === JSON.stringify(datosCanciones)) {
                notificarEstadoGuardado('completado');
                return datosCanciones;
            }
            notificarEstadoGuardado('guardando');
            datosCanciones = remotas;
            notificarDatos('canciones', datosCanciones);
            await guardarCancionesLocal(remotas);
            notificarEstadoGuardado('completado');
            return datosCanciones;
        } catch (err) {
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
                if (navigator.onLine) sincronizarCanciones();
                return datosCanciones;
            }
            if (!navigator.onLine) {
                datosCanciones = {};
                notificarEstadoGuardado('offline');
                return datosCanciones;
            }
            await sincronizarCanciones();
            datosCanciones = datosCanciones || {};
            return datosCanciones;
        })();
        promesaCanciones.then(d => { if (!d || Object.keys(d).length === 0) promesaCanciones = null; });
    }
    return promesaCanciones;
}

export async function obtenerCanciones() {
    await cargarCanciones();
    return Object.values(datosCanciones || {}).map(c => ({
        idC: c.idC, nombreC: c.nombreC, arreglos: c.arreglos, estado: c.estado, categoria: c.categoria
    }));
}

export async function obtenerContenidoCancion(idC) {
    await cargarCanciones();
    const id = String(idC ?? '').trim();
    let c = datosCanciones ? datosCanciones[id] : null;

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
    return { idC: id, nombreC: c.nombreC, contenido: c.contenido, ytID: '', arreglos: c.arreglos, categoria: c.categoria, estado: c.estado };
}

function crearColeccion({ nombre, ruta, claveLS }) {
    let datos = null, promesa = null, sincronizando = null;
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
            } catch (err) {} finally { sincronizando = null; }
            return datos || {};
        })();
        return sincronizando;
    }
    async function obtener() {
        if (datos) return datos;
        if (!promesa) {
            promesa = (async () => {
                const local = leerLocal();
                if (local) { datos = local; if (navigator.onLine) sincronizar(); return datos; }
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

export function sincronizarAhora() {
    return Promise.allSettled([sincronizarCanciones(), coleccionEventos.sincronizar(), coleccionAvisos.sincronizar()]);
}

const estilosAuth = document.createElement('style');
estilosAuth.textContent = `
    .auth-overlay { position: fixed; inset: 0; background: rgba(13, 13, 13, 0.92); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Sono', monospace; }
    .auth-card { background: #1E1E24; border: 2px solid #BC9731; border-radius: 20px; padding: 30px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 16px; }
    .auth-card h2 { margin: 0; color: #ffffff; font-size: 20px; text-align: center; border-bottom: 2px solid #BC9731; padding-bottom: 10px; }
    .auth-card input { background: #0d0d0d; color: #fff; border: 2px solid #BC9731; border-radius: 12px; padding: 10px 14px; font-family: 'Sono', monospace; font-size: 14px; outline: none; }
    .auth-card button { background: #BC9731; color: #0d0d0d; border: none; border-radius: 12px; padding: 12px; font-weight: bold; font-family: 'Sono', monospace; cursor: pointer; transition: transform 0.15s; }
    .auth-card button:active { transform: scale(0.96); }
    .auth-error { color: #e71d36; font-size: 12px; text-align: center; display: none; }
`;
document.head.appendChild(estilosAuth);

function crearModalLogin() {
    if (document.getElementById('auth-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
        <div class="auth-card">
            <h2>Acceso Requerido</h2>
            <p style="margin:0; font-size:12px; color:#999; text-align:center;">Inicia sesión con tu cuenta de administrador para acceder a esta sección.</p>
            <input type="email" id="auth-email" placeholder="Correo electrónico" autocomplete="email">
            <input type="password" id="auth-pass" placeholder="Contraseña" autocomplete="current-password">
            <div id="auth-error" class="auth-error"></div>
            <button id="auth-btn-login">Iniciar Sesión</button>
            <a href="./index.html" style="color:#999; text-align:center; font-size:12px; text-decoration:none;">← Volver al inicio</a>
        </div>
    `;
    document.body.appendChild(overlay);

    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-pass');
    const errorDiv = document.getElementById('auth-error');
    const btnLogin = document.getElementById('auth-btn-login');

    async function ejecutarLogin() {
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();
        if (!email || !pass) { errorDiv.textContent = "Ingresa correo y contraseña."; errorDiv.style.display = "block"; return; }
        errorDiv.style.display = "none";
        btnLogin.disabled = true;
        btnLogin.textContent = "Verificando...";
        try { await signInWithEmailAndPassword(auth, email, pass); }
        catch (err) { errorDiv.textContent = "Credenciales incorrectas o usuario no encontrado."; errorDiv.style.display = "block"; btnLogin.disabled = false; btnLogin.textContent = "Iniciar Sesión"; }
    }
    btnLogin.onclick = ejecutarLogin;
    passInput.onkeydown = (e) => { if (e.key === 'Enter') ejecutarLogin(); };
}

function quitarModalLogin() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.remove();
}

export function protegerPaginaAdmin(callbackPermitido) {
    onAuthStateChanged(auth, (user) => {
        if (user && ADMINS_PERMITIDOS.includes(user.email.toLowerCase())) {
            quitarModalLogin();
            if (callbackPermitido) callbackPermitido(user);
        } else {
            if (user) { alert("Tu cuenta no tiene permisos de administrador."); signOut(auth); }
            crearModalLogin();
        }
    });
}

if (typeof window !== 'undefined') {
    const refrescarTodo = () => { sincronizarAhora(); };
    window.addEventListener('online', refrescarTodo);
    window.addEventListener('offline', () => notificarEstadoGuardado('offline'));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine && Date.now() - ultimaSincronizacion > REFRESCO_MIN_MS) refrescarTodo();
    });
    cargarCanciones().catch(() => {});
    obtenerEventos().catch(() => {});
    obtenerAvisos().catch(() => {});
}