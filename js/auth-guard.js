// js/auth-guard.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA3g3DmWC_mYrA2RFj75sOoX9kolmzKINA",
    authDomain: "rondalla-f04a4.firebaseapp.com",
    databaseURL: "https://rondalla-f04a4-default-rtdb.firebaseio.com",
    projectId: "rondalla-f04a4",
    storageBucket: "rondalla-f04a4.firebasestorage.app",
    messagingSenderId: "835273996097",
    appId: "1:835273996097:web:f1258c2f461ef6613513c0"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Lista de correos electrónicos autorizados para administrar
export const ADMINS_PERMITIDOS = [
    "elgamer00727@gmail.com" // <-- CAMBIA O AÑADE AQUÍ LOS CORREOS DE LOS ADMINISTRADORES
];

// Inyectar estilos para el modal de Login
const estilosAuth = document.createElement('style');
estilosAuth.textContent = `
    .auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(13, 13, 13, 0.92);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Sono', monospace;
    }
    .auth-card {
        background: #1E1E24;
        border: 2px solid #BC9731;
        border-radius: 20px;
        padding: 30px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .auth-card h2 {
        margin: 0;
        color: #ffffff;
        font-size: 20px;
        text-align: center;
        border-bottom: 2px solid #BC9731;
        padding-bottom: 10px;
    }
    .auth-card input {
        background: #0d0d0d;
        color: #fff;
        border: 2px solid #BC9731;
        border-radius: 12px;
        padding: 10px 14px;
        font-family: 'Sono', monospace;
        font-size: 14px;
        outline: none;
    }
    .auth-card button {
        background: #BC9731;
        color: #0d0d0d;
        border: none;
        border-radius: 12px;
        padding: 12px;
        font-weight: bold;
        font-family: 'Sono', monospace;
        cursor: pointer;
        transition: transform 0.15s;
    }
    .auth-card button:active { transform: scale(0.96); }
    .auth-error { color: #e71d36; font-size: 12px; text-align: center; display: none; }
    .btn-cerrar-sesion {
        background: transparent;
        border: 1.5px solid #e71d36;
        color: #e71d36;
        border-radius: 10px;
        padding: 6px 12px;
        font-family: 'Sono', monospace;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }
    .btn-cerrar-sesion:hover {
        background: #e71d36;
        color: #ffffff;
    }
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

        if (!email || !pass) {
            errorDiv.textContent = "Ingresa correo y contraseña.";
            errorDiv.style.display = "block";
            return;
        }

        errorDiv.style.display = "none";
        btnLogin.disabled = true;
        btnLogin.textContent = "Verificando...";

        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err) {
            errorDiv.textContent = "Credenciales incorrectas o usuario no encontrado.";
            errorDiv.style.display = "block";
            btnLogin.disabled = false;
            btnLogin.textContent = "Iniciar Sesión";
        }
    }

    btnLogin.onclick = ejecutarLogin;
    passInput.onkeydown = (e) => { if (e.key === 'Enter') ejecutarLogin(); };
}

function quitarModalLogin() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.remove();
}

function agregarBotonCerrarSesion() {
    if (document.getElementById('btn-logout-global')) return;
    const header = document.querySelector('header');
    if (!header) return;

    const btnLogout = document.createElement('button');
    btnLogout.id = 'btn-logout-global';
    btnLogout.className = 'btn-cerrar-sesion';
    btnLogout.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">logout</span> Salir`;
    btnLogout.title = "Cerrar sesión de administrador";
    btnLogout.onclick = () => signOut(auth);

    header.appendChild(btnLogout);
}

export function protegerPaginaAdmin(callbackPermitido) {
    onAuthStateChanged(auth, (user) => {
        if (user && ADMINS_PERMITIDOS.includes(user.email.toLowerCase())) {
            quitarModalLogin();
            agregarBotonCerrarSesion();
            if (callbackPermitido) callbackPermitido(user);
        } else {
            if (user) {
                alert("Tu cuenta no tiene permisos de administrador.");
                signOut(auth);
            }
            crearModalLogin();
        }
    });
}