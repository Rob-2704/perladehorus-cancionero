import { crearRegexAcordes } from './modulo-acordes.js';

const NATURAL_ESPANOL_SEMI = { DO: 0, RE: 2, MI: 4, FA: 5, SOL: 7, LA: 9, SI: 11 };
const NATURAL_INGLES_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const SOST_INGLES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BEMOL_INGLES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const SOST_ESPANOL = ["DO", "DO#", "RE", "RE#", "MI", "FA", "FA#", "SOL", "SOL#", "LA", "LA#", "SI"];
const BEMOL_ESPANOL = ["DO", "REb", "RE", "MIb", "MI", "FA", "SOLb", "SOL", "LAb", "LA", "SIb", "SI"];

// Analiza una raíz de acorde exigiendo estrictamente MAYÚSCULAS
function analizarRaiz(token) {
    const m = token.match(/^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?$/);
    if (!m) return null;

    const base = m[1];
    const alt = m[2] ? m[2].toLowerCase() : '';
    const esEspanol = base in NATURAL_ESPANOL_SEMI;
    const tabla = esEspanol ? NATURAL_ESPANOL_SEMI : NATURAL_INGLES_SEMI;
    if (!(base in tabla)) return null;

    let semitono = tabla[base];
    if (alt === '#') semitono = (semitono + 1) % 12;
    if (alt === 'b') semitono = (semitono + 11) % 12;

    return { semitono, esEspanol, preferirBemol: alt === 'b' };
}

function nombreDesdeSemitono(semitono, esEspanol, preferirBemol) {
    semitono = ((semitono % 12) + 12) % 12;
    if (esEspanol) return preferirBemol ? BEMOL_ESPANOL[semitono] : SOST_ESPANOL[semitono];
    return preferirBemol ? BEMOL_INGLES[semitono] : SOST_INGLES[semitono];
}

function transponerAcorde(acordeCompleto, semitonos) {
    if (!semitonos) return acordeCompleto;

    const mRaiz = acordeCompleto.match(/^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?/);
    if (!mRaiz) return acordeCompleto;

    const infoRaiz = analizarRaiz(mRaiz[0]);
    if (!infoRaiz) return acordeCompleto;

    let resto = acordeCompleto.slice(mRaiz[0].length);
    const nuevaRaiz = nombreDesdeSemitono(infoRaiz.semitono + semitonos, infoRaiz.esEspanol, infoRaiz.preferirBemol);

    const mBajo = resto.match(/\/(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?$/);
    if (mBajo) {
        const infoBajo = analizarRaiz(mBajo[0].slice(1));
        if (infoBajo) {
            const nuevoBajo = nombreDesdeSemitono(infoBajo.semitono + semitonos, infoBajo.esEspanol, infoBajo.preferirBemol);
            resto = resto.slice(0, mBajo.index) + '/' + nuevoBajo;
        }
    }

    return nuevaRaiz + resto;
}

function transponerLinea(linea, semitonos) {
    const regex = crearRegexAcordes();
    let resultado = '';
    let ultimoIndice = 0;
    let m;

    while ((m = regex.exec(linea)) !== null) {
        const acordeOriginal = m[0];
        if (acordeOriginal.length === 0) { regex.lastIndex++; continue; }

        resultado += linea.slice(ultimoIndice, m.index);
        let nuevo = transponerAcorde(acordeOriginal, semitonos);
        const diff = nuevo.length - acordeOriginal.length;

        const restoLinea = linea.slice(m.index + acordeOriginal.length);
        const matchEspacios = restoLinea.match(/^ */);
        const numEspacios = matchEspacios ? matchEspacios[0].length : 0;

        if (numEspacios === 1) {
            resultado += nuevo;
            ultimoIndice = m.index + acordeOriginal.length;
        } else if (diff > 0) {
            if (numEspacios >= diff) {
                resultado += nuevo;
                ultimoIndice = m.index + acordeOriginal.length + diff;
                regex.lastIndex += diff;
            } else {
                resultado += nuevo;
                ultimoIndice = m.index + acordeOriginal.length;
            }
        } else if (diff < 0) {
            if (numEspacios > 1) {
                nuevo += ' '.repeat(-diff);
            }
            resultado += nuevo;
            ultimoIndice = m.index + acordeOriginal.length;
        } else {
            resultado += nuevo;
            ultimoIndice = m.index + acordeOriginal.length;
        }
    }

    resultado += linea.slice(ultimoIndice);
    return resultado;
}

export function transponerTexto(texto, semitonos) {
    if (!texto || !semitonos) return texto;
    return texto.split(/\r?\n/).map(linea => transponerLinea(linea, semitonos)).join('\n');
}

export function detectarTonalidad(texto) {
    if (!texto) return null;
    const regex = crearRegexAcordes();
    const conteo = {};
    let m;

    while ((m = regex.exec(texto)) !== null) {
        if (m[0].length === 0) { regex.lastIndex++; continue; }
        const mRaiz = m[0].match(/^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?/);
        if (!mRaiz) continue;
        const info = analizarRaiz(mRaiz[0]);
        if (!info) continue;
        conteo[info.semitono] = (conteo[info.semitono] || 0) + 1;
    }

    let mejorSemi = null, mejorCuenta = 0;
    for (const s in conteo) {
        if (conteo[s] > mejorCuenta) { mejorCuenta = conteo[s]; mejorSemi = Number(s); }
    }
    return mejorSemi;
}

export function nombreTonalidad(semitono) {
    if (semitono === null || semitono === undefined) return '—';
    return SOST_ESPANOL[((semitono % 12) + 12) % 12];
}

export function inicializarTransponer(opciones) {
    const {
        contenidoOriginal,
        onRetransponer,
        tonalidadLabelId,
        btnSubirTonoId, btnSubirMedioId, btnBajarMedioId, btnBajarTonoId, btnResetId,
        btnToggleId, panelId
    } = opciones;

    let offset = 0;
    const semitonoBase = detectarTonalidad(contenidoOriginal);
    const labelEl = document.getElementById(tonalidadLabelId);

    function actualizar() {
        if (labelEl) labelEl.textContent = semitonoBase === null ? '—' : nombreTonalidad(semitonoBase + offset);
        onRetransponer(transponerTexto(contenidoOriginal, offset));
    }

    const conectar = (id, delta) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => { offset += delta; actualizar(); });
    };
    conectar(btnSubirTonoId, 2);
    conectar(btnSubirMedioId, 1);
    conectar(btnBajarMedioId, -1);
    conectar(btnBajarTonoId, -2);

    const btnReset = document.getElementById(btnResetId);
    if (btnReset) btnReset.addEventListener('click', () => { offset = 0; actualizar(); });

    const btnToggle = document.getElementById(btnToggleId);
    const panel = document.getElementById(panelId);
    if (btnToggle && panel) {
        btnToggle.addEventListener('click', () => {
            const estaAbierto = panel.style.display !== 'none';
            panel.style.display = estaAbierto ? 'none' : 'flex';
            btnToggle.classList.toggle('abierto', !estaAbierto);
        });
    }

    actualizar();
}