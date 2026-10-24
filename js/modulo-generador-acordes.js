// Generador de digitaciones de guitarra para la página de acordes.
//
// Dada una raíz y un tipo de acorde, busca en el mástil todas las formas tocables
// (ventana de 4 trastes, máximo 4 dedos o cejilla, cuerdas contiguas) y las ordena
// por comodidad. No usa DOM: se puede probar en Node.

// Afinación estándar (cuerda 6 → 1): E2 A2 D3 G3 B3 E4, en números MIDI
const AFINACION = [40, 45, 50, 55, 59, 64];
const TRASTE_MAXIMO = 15;

export const NOMBRES_SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOMBRES_BEMOLES    = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// tones: semitonos desde la raíz · grados: etiqueta de cada nota · req: notas que no pueden faltar
// alias: cómo se suele escribir (minúsculas, sin espacios) para el buscador
export const TIPOS = [
    // Tríadas
    { id: '',       sim: '',        nombre: 'Mayor',                       grupo: 'Tríadas',  tones: [0, 4, 7],            grados: ['1', '3', '5'],               req: [0, 4, 7],      alias: ['', 'maj', 'major', 'mayor'] },
    { id: 'm',      sim: 'm',       nombre: 'Menor',                       grupo: 'Tríadas',  tones: [0, 3, 7],            grados: ['1', '♭3', '5'],              req: [0, 3, 7],      alias: ['m', 'min', 'minor', 'menor', '-'] },
    { id: 'dim',    sim: 'dim',     nombre: 'Disminuido',                  grupo: 'Tríadas',  tones: [0, 3, 6],            grados: ['1', '♭3', '♭5'],             req: [0, 3, 6],      alias: ['dim', '°', 'º', 'disminuido'] },
    { id: 'aug',    sim: 'aug',     nombre: 'Aumentado',                   grupo: 'Tríadas',  tones: [0, 4, 8],            grados: ['1', '3', '♯5'],              req: [0, 4, 8],      alias: ['aug', '+', 'aumentado', '#5'] },
    { id: 'sus2',   sim: 'sus2',    nombre: 'Suspendido 2',                grupo: 'Tríadas',  tones: [0, 2, 7],            grados: ['1', '2', '5'],               req: [0, 2, 7],      alias: ['sus2'] },
    { id: 'sus4',   sim: 'sus4',    nombre: 'Suspendido 4',                grupo: 'Tríadas',  tones: [0, 5, 7],            grados: ['1', '4', '5'],               req: [0, 5, 7],      alias: ['sus4', 'sus'] },
    { id: '5',      sim: '5',       nombre: 'Quinta (power chord)',        grupo: 'Tríadas',  tones: [0, 7],               grados: ['1', '5'],                    req: [0, 7],         alias: ['5'], minCuerdas: 3 },

    // Sextas
    { id: '6',      sim: '6',       nombre: 'Sexta',                       grupo: 'Sextas',   tones: [0, 4, 7, 9],         grados: ['1', '3', '5', '6'],          req: [0, 4, 9],      alias: ['6'] },
    { id: 'm6',     sim: 'm6',      nombre: 'Menor con sexta',             grupo: 'Sextas',   tones: [0, 3, 7, 9],         grados: ['1', '♭3', '5', '6'],         req: [0, 3, 9],      alias: ['m6', 'min6', '-6'] },
    { id: '69',     sim: '6/9',     nombre: 'Sexta con novena',            grupo: 'Sextas',   tones: [0, 4, 7, 9, 2],      grados: ['1', '3', '5', '6', '9'],     req: [0, 4, 9, 2],   alias: ['69', '6add9'] },

    // Séptimas
    { id: '7',      sim: '7',       nombre: 'Séptima (dominante)',         grupo: 'Séptimas', tones: [0, 4, 7, 10],        grados: ['1', '3', '5', '♭7'],         req: [0, 4, 10],     alias: ['7', 'dom7'] },
    { id: 'maj7',   sim: 'maj7',    nombre: 'Séptima mayor',               grupo: 'Séptimas', tones: [0, 4, 7, 11],        grados: ['1', '3', '5', '7'],          req: [0, 4, 11],     alias: ['maj7', 'major7', 'δ', 'δ7'] },
    { id: 'm7',     sim: 'm7',      nombre: 'Menor con séptima',           grupo: 'Séptimas', tones: [0, 3, 7, 10],        grados: ['1', '♭3', '5', '♭7'],        req: [0, 3, 10],     alias: ['m7', 'min7', '-7', 'menor7'] },
    { id: 'mmaj7',  sim: 'm(maj7)', nombre: 'Menor con séptima mayor',     grupo: 'Séptimas', tones: [0, 3, 7, 11],        grados: ['1', '♭3', '5', '7'],         req: [0, 3, 11],     alias: ['mmaj7', 'minmaj7', 'm#7'] },
    { id: 'dim7',   sim: 'dim7',    nombre: 'Disminuido con séptima',      grupo: 'Séptimas', tones: [0, 3, 6, 9],         grados: ['1', '♭3', '♭5', '♭♭7'],      req: [0, 3, 6, 9],   alias: ['dim7', '°7', 'º7'] },
    { id: 'm7b5',   sim: 'm7b5',    nombre: 'Semidisminuido',              grupo: 'Séptimas', tones: [0, 3, 6, 10],        grados: ['1', '♭3', '♭5', '♭7'],       req: [0, 3, 6, 10],  alias: ['m7b5', 'ø', 'ø7', 'min7b5', 'm7-5'] },
    { id: '7sus4',  sim: '7sus4',   nombre: 'Séptima suspendida',          grupo: 'Séptimas', tones: [0, 5, 7, 10],        grados: ['1', '4', '5', '♭7'],         req: [0, 5, 10],     alias: ['7sus4', '7sus'] },
    { id: '7b5',    sim: '7b5',     nombre: 'Séptima con quinta bemol',    grupo: 'Séptimas', tones: [0, 4, 6, 10],        grados: ['1', '3', '♭5', '♭7'],        req: [0, 4, 6, 10],  alias: ['7b5', '7-5'] },
    { id: '7#5',    sim: '7#5',     nombre: 'Séptima aumentada',           grupo: 'Séptimas', tones: [0, 4, 8, 10],        grados: ['1', '3', '♯5', '♭7'],        req: [0, 4, 8, 10],  alias: ['7#5', 'aug7', '7aug', '+7', '7+5'] },
    { id: 'maj7#5', sim: 'maj7#5',  nombre: 'Séptima mayor aumentada',     grupo: 'Séptimas', tones: [0, 4, 8, 11],        grados: ['1', '3', '♯5', '7'],         req: [0, 4, 8, 11],  alias: ['maj7#5', 'maj7aug', 'maj7+5'] },
    { id: 'maj7#11',sim: 'maj7#11', nombre: 'Séptima mayor con ♯11',       grupo: 'Séptimas', tones: [0, 4, 7, 11, 6],     grados: ['1', '3', '5', '7', '♯11'],   req: [0, 4, 11, 6],  alias: ['maj7#11'] },

    // Con novena
    { id: 'add9',   sim: 'add9',    nombre: 'Añadida 9 (add9)',            grupo: 'Con novena', tones: [0, 4, 7, 2],       grados: ['1', '3', '5', '9'],          req: [0, 4, 2],      alias: ['add9'] },
    { id: 'madd9',  sim: 'madd9',   nombre: 'Menor añadida 9',             grupo: 'Con novena', tones: [0, 3, 7, 2],       grados: ['1', '♭3', '5', '9'],         req: [0, 3, 2],      alias: ['madd9', 'minadd9'] },
    { id: '9',      sim: '9',       nombre: 'Novena',                      grupo: 'Con novena', tones: [0, 4, 7, 10, 2],   grados: ['1', '3', '5', '♭7', '9'],    req: [0, 4, 10, 2],  alias: ['9', 'dom9'] },
    { id: 'm9',     sim: 'm9',      nombre: 'Menor con novena',            grupo: 'Con novena', tones: [0, 3, 7, 10, 2],   grados: ['1', '♭3', '5', '♭7', '9'],   req: [0, 3, 10, 2],  alias: ['m9', 'min9', '-9'] },
    { id: 'maj9',   sim: 'maj9',    nombre: 'Novena mayor',                grupo: 'Con novena', tones: [0, 4, 7, 11, 2],   grados: ['1', '3', '5', '7', '9'],     req: [0, 4, 11, 2],  alias: ['maj9', 'major9'] },
    { id: '9sus4',  sim: '9sus4',   nombre: 'Novena suspendida',           grupo: 'Con novena', tones: [0, 5, 7, 10, 2],   grados: ['1', '4', '5', '♭7', '9'],    req: [0, 5, 10, 2],  alias: ['9sus4', '9sus'] },

    // Alterados
    { id: '7b9',    sim: '7b9',     nombre: 'Séptima con ♭9',              grupo: 'Alterados', tones: [0, 4, 7, 10, 1],    grados: ['1', '3', '5', '♭7', '♭9'],   req: [0, 4, 10, 1],  alias: ['7b9'] },
    { id: '7#9',    sim: '7#9',     nombre: 'Séptima con ♯9',              grupo: 'Alterados', tones: [0, 4, 7, 10, 3],    grados: ['1', '3', '5', '♭7', '♯9'],   req: [0, 4, 10, 3],  alias: ['7#9'] },
    { id: '7#11',   sim: '7#11',    nombre: 'Séptima con ♯11',             grupo: 'Alterados', tones: [0, 4, 7, 10, 6],    grados: ['1', '3', '5', '♭7', '♯11'],  req: [0, 4, 10, 6],  alias: ['7#11'] },
    { id: '7b13',   sim: '7b13',    nombre: 'Séptima con ♭13',             grupo: 'Alterados', tones: [0, 4, 7, 10, 8],    grados: ['1', '3', '5', '♭7', '♭13'],  req: [0, 4, 10, 8],  alias: ['7b13'] },

    // Oncenas y trecenas
    { id: '11',     sim: '11',      nombre: 'Oncena',                      grupo: 'Oncenas y trecenas', tones: [0, 4, 7, 10, 2, 5], grados: ['1', '3', '5', '♭7', '9', '11'], req: [0, 10, 5],    alias: ['11'] },
    { id: 'm11',    sim: 'm11',     nombre: 'Menor con oncena',            grupo: 'Oncenas y trecenas', tones: [0, 3, 7, 10, 2, 5], grados: ['1', '♭3', '5', '♭7', '9', '11'], req: [0, 3, 10, 5], alias: ['m11', 'min11'] },
    { id: '13',     sim: '13',      nombre: 'Trecena',                     grupo: 'Oncenas y trecenas', tones: [0, 4, 7, 10, 2, 9], grados: ['1', '3', '5', '♭7', '9', '13'], req: [0, 4, 10, 9], alias: ['13'] },
    { id: 'm13',    sim: 'm13',     nombre: 'Menor con trecena',           grupo: 'Oncenas y trecenas', tones: [0, 3, 7, 10, 2, 9], grados: ['1', '♭3', '5', '♭7', '9', '13'], req: [0, 3, 10, 9], alias: ['m13', 'min13'] },
    { id: 'maj13',  sim: 'maj13',   nombre: 'Trecena mayor',               grupo: 'Oncenas y trecenas', tones: [0, 4, 7, 11, 2, 9], grados: ['1', '3', '5', '7', '9', '13'],  req: [0, 4, 11, 9], alias: ['maj13', 'major13'] }
];

export const TIPO_POR_ID = Object.fromEntries(TIPOS.map(t => [t.id, t]));

// ───────────────────────── Generación ─────────────────────────

/**
 * Busca digitaciones para un acorde.
 * @param {number} raiz     0–11 (0 = DO)
 * @param {object} tipo     elemento de TIPOS
 * @param {number|null} bajo  nota del bajo (0–11) o null para la raíz
 * @param {number} maximo   cuántas devolver (1 = solo la más cómoda)
 * @returns {Array<{strings:string, cejilla:boolean, trasteInicio:number, cuerdasCejilla:number[]|null, trasteMin:number, abierto:boolean, dedos:number}>}
 */
export function generarDigitaciones(raiz, tipo, bajo = null, maximo = 12) {
    const tonos = tipo.tones.map(i => (raiz + i) % 12);
    const requeridas = tipo.req.map(i => (raiz + i) % 12);
    const pcBajo = (bajo === null || bajo === undefined) ? raiz : bajo;
    const permitidas = new Set([...tonos, pcBajo]);
    const minCuerdas = tipo.minCuerdas || 4;

    const encontradas = new Map();
    const frets = new Array(6).fill(-1);

    for (let base = 1; base + 3 <= TRASTE_MAXIMO; base++) {
        // Notas posibles por cuerda dentro de esta ventana (las cuerdas al aire solo en la primera)
        const opciones = AFINACION.map(midi => {
            const lista = [];
            if (base === 1 && permitidas.has(midi % 12)) lista.push(0);
            for (let f = base; f <= base + 3; f++) {
                if (permitidas.has((midi + f) % 12)) lista.push(f);
            }
            return lista;
        });

        // estado: 0 = aún no suena ninguna, 1 = sonando, 2 = ya terminaron las cuerdas que suenan
        const recorrer = (s, estado) => {
            if (s === 6) { evaluar(); return; }

            frets[s] = -1;
            recorrer(s + 1, estado === 1 ? 2 : estado);

            if (estado !== 2) {
                for (const f of opciones[s]) {
                    frets[s] = f;
                    recorrer(s + 1, 1);
                }
                frets[s] = -1;
            }
        };

        const evaluar = () => {
            let sonando = 0, primera = -1;
            const pcs = new Set();
            const pisadas = [];
            for (let s = 0; s < 6; s++) {
                const f = frets[s];
                if (f < 0) continue;
                sonando++;
                if (primera < 0) primera = s;
                pcs.add((AFINACION[s] + f) % 12);
                if (f > 0) pisadas.push([s, f]);
            }
            if (sonando < minCuerdas) return;
            if ((AFINACION[primera] + frets[primera]) % 12 !== pcBajo) return;
            for (const r of requeridas) if (!pcs.has(r)) return;

            const clave = frets.map(f => (f < 0 ? 'X' : f)).join(' ');
            if (encontradas.has(clave)) return;

            let trasteMin = 0, trasteMax = 0;
            if (pisadas.length) {
                trasteMin = Math.min(...pisadas.map(p => p[1]));
                trasteMax = Math.max(...pisadas.map(p => p[1]));
            }

            // Dedos: cejilla solo si hace falta (más de 4 notas pisadas)
            let dedos = pisadas.length;
            let cejilla = null;
            if (pisadas.length > 4) {
                const enMin = pisadas.filter(p => p[1] === trasteMin);
                if (enMin.length >= 2) {
                    const i0 = enMin[0][0], i1 = enMin[enMin.length - 1][0];
                    let valida = true;
                    for (let s = i0; s <= i1; s++) if (frets[s] < trasteMin) { valida = false; break; }
                    if (valida) {
                        cejilla = [i0 + 1, i1 + 1];
                        dedos = 1 + pisadas.filter(p => p[1] > trasteMin).length;
                    }
                }
            }
            if (dedos > 4) return;

            const abiertas = frets.filter(f => f === 0).length;
            const tonosCubiertos = tonos.filter(t => pcs.has(t)).length;
            const puntaje =
                dedos * 2 +
                (6 - sonando) * 1.5 +
                (trasteMax - trasteMin) * 1.0 +
                (cejilla ? 1.5 : 0) +
                trasteMin * 0.25 -
                abiertas * 0.5 -
                tonosCubiertos * 0.8;

            // Qué parte del diapasón se dibuja: si hay cejilla o pasa del traste 4, se empieza en el traste más bajo
            const trasteInicio = (cejilla || trasteMax > 4) ? Math.max(1, trasteMin) : 1;

            encontradas.set(clave, {
                strings: clave,
                cejilla: !!cejilla,
                trasteInicio,
                cuerdasCejilla: cejilla,
                trasteMin,
                abierto: abiertas > 0,
                dedos,
                puntaje
            });
        };

        recorrer(0, 0);
    }

    // Quita las versiones "recortadas": misma forma que otra, pero sin cuerdas al aire que sí podrían sonar
    const lista = [...encontradas.values()];
    const trastes = lista.map(d => d.strings.split(' ').map(x => (x === 'X' ? -1 : parseInt(x, 10))));
    const todas = lista.filter((d, i) => !lista.some((o, j) => {
        if (i === j) return false;
        const a = trastes[i], b = trastes[j];
        let extra = false;
        for (let s = 0; s < 6; s++) {
            if (a[s] >= 0 && a[s] !== b[s]) return false;      // debe conservar todas sus notas
            if (a[s] < 0 && b[s] >= 0) {
                if (b[s] !== 0) return false;                  // lo añadido solo puede ser cuerda al aire
                extra = true;
            }
        }
        return extra;
    })).sort((a, b) => a.puntaje - b.puntaje);
    if (maximo <= 1) return todas.slice(0, 1);

    // Variedad: como máximo 3 por zona del mástil
    const porZona = new Map();
    const elegidas = [];
    for (const d of todas) {
        const zona = d.abierto ? 0 : Math.floor(d.trasteMin / 3) + 1;
        const n = porZona.get(zona) || 0;
        if (n >= 3) continue;
        porZona.set(zona, n + 1);
        elegidas.push(d);
        if (elegidas.length >= maximo) break;
    }
    return elegidas.sort((a, b) => (a.abierto === b.abierto ? 0 : (a.abierto ? -1 : 1)) || a.trasteMin - b.trasteMin || a.puntaje - b.puntaje);
}

// ───────────────────────── Buscador de texto ─────────────────────────

const MAPA_LATINO = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11, c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const ALIAS = new Map();
TIPOS.forEach(t => t.alias.forEach(a => { if (!ALIAS.has(a)) ALIAS.set(a, t.id); }));

function leerNota(texto) {
    const m = texto.match(/^(do|re|mi|fa|sol|la|si|[a-g])([#b])?/i);
    if (!m) return null;
    let pc = MAPA_LATINO[m[1].toLowerCase()];
    if (m[2] === '#') pc = (pc + 1) % 12;
    if (m[2] === 'b') pc = (pc + 11) % 12;
    return { pc, resto: texto.slice(m[0].length) };
}

function normalizarSufijo(s) {
    s = s.replace(/[()\s]/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
    if (s === 'M') return '';
    if (/^M/.test(s) && !/^maj/i.test(s)) s = 'maj' + s.slice(1);
    return s.toLowerCase().replace('añadida', 'add');
}

/** Interpreta "Fa#m7", "Do/Mi", "Bbmaj7", "C6/9"… → {raiz, tipo, bajo} o null */
export function interpretarAcorde(texto) {
    if (!texto) return null;
    let t = texto.trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/6\/9/g, '69');
    if (!t) return null;

    let textoBajo = null;
    const barra = t.lastIndexOf('/');
    if (barra > 0) { textoBajo = t.slice(barra + 1); t = t.slice(0, barra); }

    const raiz = leerNota(t);
    if (!raiz) return null;

    const idTipo = ALIAS.get(normalizarSufijo(raiz.resto));
    if (idTipo === undefined) return null;

    let bajo = null;
    if (textoBajo) {
        const nb = leerNota(textoBajo.trim());
        if (!nb || nb.resto.trim() !== '') return null;
        bajo = nb.pc;
    }
    return { raiz: raiz.pc, tipo: idTipo, bajo: bajo === raiz.pc ? null : bajo };
}