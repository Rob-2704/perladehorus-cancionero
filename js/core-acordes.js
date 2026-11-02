const DICCIONARIO_ACORDES = {
    "C": { strings: "X 3 2 0 1 0", cejilla: false, trasteInicio: 1 },
    "C_v2": { strings: "X 3 5 5 5 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [2, 6] },
    "C_v3": { strings: "8 10 10 9 8 8", cejilla: true, trasteInicio: 8, cuerdasCejilla: [1, 6] },
    "C_v4": { strings: "X X 10 9 8 8", cejilla: false, trasteInicio: 8 },
    "C_v5": { strings: "X 15 14 12 13 12", cejilla: false, trasteInicio: 12 },
    "D": { strings: "X X 0 2 3 2", cejilla: false, trasteInicio: 1 },
    "D_v2": { strings: "X 5 7 7 7 5", cejilla: true, trasteInicio: 5, cuerdasCejilla: [2, 6] },
    "D_v3": { strings: "10 12 12 11 10 10", cejilla: true, trasteInicio: 10, cuerdasCejilla: [1, 6] },
    "D_v4": { strings: "X X 4 2 3 2", cejilla: false, trasteInicio: 2 },
    "D_v5": { strings: "X X 12 11 10 10", cejilla: false, trasteInicio: 10 },
    "E": { strings: "0 2 2 1 0 0", cejilla: false, trasteInicio: 1 },
    "E_v2": { strings: "X 7 9 9 9 7", cejilla: true, trasteInicio: 7, cuerdasCejilla: [2, 6] },
    "E_v3": { strings: "12 14 14 13 12 12", cejilla: true, trasteInicio: 12, cuerdasCejilla: [1, 6] },
    "E_v4": { strings: "X X 2 1 0 0", cejilla: false, trasteInicio: 1 },
    "E_v5": { strings: "X X 6 4 5 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [3, 6] },
    "F": { strings: "1 3 3 2 1 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [1, 6] },
    "F_v2": { strings: "X 8 10 10 10 8", cejilla: true, trasteInicio: 8, cuerdasCejilla: [2, 6] },
    "G": { strings: "3 2 0 0 0 3", cejilla: false, trasteInicio: 1 },
    "G_v2": { strings: "3 5 5 4 3 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [1, 6] },
    "G_v3": { strings: "X 10 12 12 12 10", cejilla: true, trasteInicio: 10, cuerdasCejilla: [2, 6] },
    "A": { strings: "X 0 2 2 2 0", cejilla: false, trasteInicio: 1 },
    "A_v2": { strings: "5 7 7 6 5 5", cejilla: true, trasteInicio: 5, cuerdasCejilla: [1, 6] },
    "B": { strings: "X 2 4 4 4 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [2, 6] },
    "B_v2": { strings: "7 9 9 8 7 7", cejilla: true, trasteInicio: 7, cuerdasCejilla: [1, 6] },
    "Cm": { strings: "X 3 5 5 4 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [2, 6] },
    "Dm": { strings: "X X 0 2 3 1", cejilla: false, trasteInicio: 1 },
    "Em": { strings: "0 2 2 0 0 0", cejilla: false, trasteInicio: 1 },
    "Fm": { strings: "1 3 3 1 1 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [1, 6] },
    "Gm": { strings: "3 5 5 3 3 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [1, 6] },
    "Am": { strings: "X 0 2 2 1 0", cejilla: false, trasteInicio: 1 },
    "Bm": { strings: "X 2 4 4 3 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [2, 6] },
    "Cmaj7": { strings: "X 3 2 0 0 0", cejilla: false, trasteInicio: 1 },
    "Dmaj7": { strings: "X X 0 2 2 2", cejilla: false, trasteInicio: 1 },
    "Emaj7": { strings: "0 2 1 1 0 0", cejilla: false, trasteInicio: 1 },
    "Fmaj7": { strings: "1 X 2 2 1 X", cejilla: false, trasteInicio: 1 },
    "Gmaj7": { strings: "3 X 4 4 3 X", cejilla: false, trasteInicio: 3 },
    "Amaj7": { strings: "X 0 2 1 2 0", cejilla: false, trasteInicio: 1 },
    "Bmaj7": { strings: "X 2 4 3 4 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [2, 6] },
    "Cdim": { strings: "X X 1 2 1 2", cejilla: false, trasteInicio: 1 },
    "Ddim": { strings: "X X 0 1 0 1", cejilla: false, trasteInicio: 1 },
    "Edim": { strings: "X X 2 3 2 3", cejilla: false, trasteInicio: 2 },
    "Fdim": { strings: "X X 3 4 3 4", cejilla: false, trasteInicio: 3 },
    "Gdim": { strings: "X X 2 3 2 3", cejilla: false, trasteInicio: 2 },
    "Adim": { strings: "X X 1 2 1 2", cejilla: false, trasteInicio: 1 },
    "Bdim": { strings: "X 2 3 1 3 X", cejilla: false, trasteInicio: 1 },
    "Caug": { strings: "X 3 2 1 1 X", cejilla: false, trasteInicio: 1 },
    "Daug": { strings: "X X 0 3 3 2", cejilla: false, trasteInicio: 1 },
    "Eaug": { strings: "0 3 2 1 1 0", cejilla: false, trasteInicio: 1 },
    "Gaug": { strings: "3 2 1 0 0 3", cejilla: false, trasteInicio: 1 },
    "Aaug": { strings: "X 0 3 2 2 1", cejilla: false, trasteInicio: 1 },
    "Csus4": { strings: "X 3 3 0 1 1", cejilla: false, trasteInicio: 1 },
    "Dsus4": { strings: "X X 0 2 3 3", cejilla: false, trasteInicio: 1 },
    "Esus4": { strings: "0 2 2 2 0 0", cejilla: false, trasteInicio: 1 },
    "Fsus4": { strings: "1 3 3 3 1 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [1, 6] },
    "Gsus4": { strings: "3 3 0 0 3 3", cejilla: false, trasteInicio: 1 },
    "Asus4": { strings: "X 0 2 2 3 0", cejilla: false, trasteInicio: 1 },
    "Bsus4": { strings: "X 2 4 4 5 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [2, 6] },
    "C5": { strings: "X 3 5 5 X X", cejilla: false, trasteInicio: 3 },
    "D5": { strings: "X 5 7 7 X X", cejilla: false, trasteInicio: 5 },
    "E5": { strings: "0 2 2 X X X", cejilla: false, trasteInicio: 1 },
    "F5": { strings: "1 3 3 X X X", cejilla: false, trasteInicio: 1 },
    "G5": { strings: "3 5 5 X X X", cejilla: false, trasteInicio: 3 },
    "A5": { strings: "X 0 2 2 X X", cejilla: false, trasteInicio: 1 },
    "B5": { strings: "X 2 4 4 X X", cejilla: false, trasteInicio: 2 },
    "C7": { strings: "X 3 2 3 1 0", cejilla: false, trasteInicio: 1 },
    "D7": { strings: "X X 0 2 1 2", cejilla: false, trasteInicio: 1 },
    "E7": { strings: "0 2 0 1 0 0", cejilla: false, trasteInicio: 1 },
    "F7": { strings: "1 3 1 2 1 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [1, 6] },
    "G7": { strings: "3 2 0 0 0 1", cejilla: false, trasteInicio: 1 },
    "A7": { strings: "X 0 2 0 2 0", cejilla: false, trasteInicio: 1 },
    "B7": { strings: "X 2 1 2 0 2", cejilla: false, trasteInicio: 1 },
    "Cm7": { strings: "X 3 5 3 4 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [2, 6] },
    "Dm7": { strings: "X X 0 2 1 1", cejilla: false, trasteInicio: 1 },
    "Em7": { strings: "0 2 0 0 0 0", cejilla: false, trasteInicio: 1 },
    "Fm7": { strings: "1 3 1 1 1 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [1, 6] },
    "Gm7": { strings: "3 5 3 3 3 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [1, 6] },
    "Am7": { strings: "X 0 2 0 1 0", cejilla: false, trasteInicio: 1 },
    "Bm7": { strings: "X 2 4 2 3 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [2, 6] },
    "C11": { strings: "X 3 3 3 3 3", cejilla: true, trasteInicio: 3, cuerdasCejilla: [2, 6] },
    "D11": { strings: "X 5 5 5 5 5", cejilla: true, trasteInicio: 5, cuerdasCejilla: [2, 6] },
    "E11": { strings: "0 2 2 2 3 2", cejilla: false, trasteInicio: 1 },
    "A11": { strings: "X 0 0 0 0 0", cejilla: false, trasteInicio: 1 },
    "C13": { strings: "8 X 8 9 10 X", cejilla: false, trasteInicio: 8 },
    "G13": { strings: "3 X 3 4 5 X", cejilla: false, trasteInicio: 3 },
    "A13": { strings: "5 X 5 6 7 X", cejilla: false, trasteInicio: 5 },
    "C#": { strings: "X 4 6 6 6 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C#m": { strings: "X 4 6 6 5 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C#7": { strings: "X 4 6 4 6 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C#maj7": { strings: "X 4 6 5 6 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C#m7": { strings: "X 4 6 4 5 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C#sus4": { strings: "X 4 6 6 7 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "D#": { strings: "X 6 8 8 8 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "D#m": { strings: "X 6 8 8 7 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "D#7": { strings: "X 6 8 6 8 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "D#maj7": { strings: "X 6 8 7 8 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "D#m7": { strings: "X 6 8 6 7 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "D#sus4": { strings: "X 6 8 8 9 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "F#": { strings: "2 4 4 3 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "F#m": { strings: "2 4 4 2 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "F#7": { strings: "2 4 2 3 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "F#maj7": { strings: "2 4 3 3 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "F#m7": { strings: "2 4 2 2 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "F#sus4": { strings: "2 4 4 4 2 2", cejilla: true, trasteInicio: 2, cuerdasCejilla: [1, 6] },
    "G#": { strings: "4 6 6 5 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "G#m": { strings: "4 6 6 4 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "G#7": { strings: "4 6 4 5 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "G#maj7": { strings: "4 X 5 5 4 X", cejilla: false, trasteInicio: 4 },
    "G#m7": { strings: "4 6 4 4 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "G#sus4": { strings: "4 6 6 6 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "A#": { strings: "X 1 3 3 3 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "A#m": { strings: "X 1 3 3 2 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "A#7": { strings: "X 1 3 1 3 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "A#maj7": { strings: "X 1 3 2 3 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "A#m7": { strings: "X 1 3 1 2 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "A#sus4": { strings: "X 1 3 3 4 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "Bb": { strings: "X 1 3 3 3 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "Bbm": { strings: "X 1 3 3 2 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "Bb7": { strings: "X 1 3 1 3 1", cejilla: true, trasteInicio: 1, cuerdasCejilla: [2, 6] },
    "Eb": { strings: "X 6 8 8 8 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "Ebm": { strings: "X 6 8 8 7 6", cejilla: true, trasteInicio: 6, cuerdasCejilla: [2, 6] },
    "Ab": { strings: "4 6 6 5 4 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [1, 6] },
    "Db": { strings: "X 4 6 6 6 4", cejilla: true, trasteInicio: 4, cuerdasCejilla: [2, 6] },
    "C_F": { strings: "1 3 2 0 1 0", cejilla: false, trasteInicio: 1 },
    "C_G": { strings: "3 3 2 0 1 0", cejilla: false, trasteInicio: 1 },
    "D_F#": { strings: "2 0 0 2 3 2", cejilla: false, trasteInicio: 1 },
    "D_A": { strings: "X 0 0 2 3 2", cejilla: false, trasteInicio: 1 },
    "E_G#": { strings: "4 2 2 1 0 0", cejilla: false, trasteInicio: 1 },
    "G_B": { strings: "0 2 0 0 0 3", cejilla: false, trasteInicio: 1 },
    "Am_G": { strings: "3 0 2 2 1 0", cejilla: false, trasteInicio: 1 }
};
if (typeof window !== 'undefined') { window.DICCIONARIO_ACORDES = DICCIONARIO_ACORDES; }

const MAPA_NOTAS = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11, c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const MAPA_A_LATINO = { 'C': 'DO', 'D': 'RE', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI' };
const MAPA_A_ANGLO = { 'DO': 'C', 'RE': 'D', 'MI': 'E', 'FA': 'F', 'SOL': 'G', 'LA': 'A', 'SI': 'B' };

export function convertirAcordeASistema(acordeStr, sistema = 'ANGLOSAJON') {
    if (!acordeStr) return acordeStr;
    return acordeStr.replace(/(DO|RE|MI|FA|SOL|LA|SI|[CDEFGAB])(#|b)?/g, (match) => {
        const m = match.match(/^(DO|RE|MI|FA|SOL|LA|SI|[CDEFGAB])(#|b)?/);
        if (!m) return match;
        const base = m[1];
        const alt = m[2] || '';
        if (sistema === 'LATINO' || sistema === 'ESPAÑOL') {
            const notaAnglo = MAPA_A_ANGLO[base] || base;
            return (MAPA_A_LATINO[notaAnglo] || base) + alt;
        } else {
            return (MAPA_A_ANGLO[base] || base) + alt;
        }
    });
}

export function crearRegexAcordes() {
    const nucleoAcorde = `([CDEFGAB]|DO|RE|MI|FA|SOL|LA|SI)(#|b)?((?:maj|min|dim|aug|m)?)(?:(sus4|sus2|sus(?:[#b]?\\d+)?|add\\d+|5|6|7|8|9|10|11|12|13)+)?`;
    const bajoAcorde = `(\\/(([CDEFGAB]|DO|RE|MI|FA|SOL|LA|SI)(#|b)?))?`;
    const conAlteracion = `${nucleoAcorde}(\\((?:add)?[#b]?\\d+(?:\\s*,\\s*(?:add)?[#b]?\\d+)*\\))${bajoAcorde}(?![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])`;
    const sinAlteracion = `${nucleoAcorde}${bajoAcorde}(?![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]|\\s(?![xX]\\d)[a-záéíóúüñ])`;
    return new RegExp(`(?<![a-záéíóúüñ])(?:${conAlteracion}|${sinAlteracion})`, 'g');
}

export function procesarLetraYAcordes(textoOriginal, sistema = 'ANGLOSAJON') {
    if (!textoOriginal) return "";
    let textoProcesado = textoOriginal.replace(/-/g, '—');
    const regexBarras = /x\d+|(?<![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])v(?![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])|(?<![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])X(?![a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])|(?<=[\d—])(?:p|h)\d+|(?<=[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])\d+(?![s][u][s])(?=[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])|\([Ii][Nn][Tt][Rr][Oo]\)|❙o|o❙|(?!\d—[A-ZÁÉÍÓÚÜÑ\s
])(?!\/[A-ZÁÉÍÓÚÜÑ])(?!\d\/[A-ZÁÉÍÓÚÜÑ])(?:(?!❙o|o❙)[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ.,;:!?¡¿'"#()\s])*(?:(?!❙o|o❙)[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9.,;:!?¡¿'"#()\s])(?:(?!❙o|o❙)[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ.,;:!?¡¿'"#()\s])*/g;
    const regexAcordes = crearRegexAcordes();
    const envolverBarras = (fragmento) => fragmento.replace(regexBarras, (barra) => `<span class="barra-compas">${barra}</span>`);

    let matches = [];
    let match;
    regexAcordes.lastIndex = 0;
    while ((match = regexAcordes.exec(textoProcesado)) !== null) {
        matches.push({ index: match.index, length: match[0].length, acorde: match[0] });
    }
    if (matches.length === 0) return envolverBarras(textoProcesado);

    let resultado = "";
    let cursor = 0;
    for (let i = 0; i < matches.length; i++) {
        let m = matches[i];
        let tramoPlano = textoProcesado.slice(cursor, m.index);
        resultado += envolverBarras(tramoPlano);
        let acordeOriginal = m.acorde;
        let idAcordeDiccionario = acordeOriginal.replace('/', '_');
        let acordeMostrar = convertirAcordeASistema(acordeOriginal, sistema);
        resultado += `<a class="acorde-link" data-acorde="${idAcordeDiccionario}">${acordeMostrar}</a>`;
        cursor = m.index + acordeOriginal.length;
    }
    resultado += envolverBarras(textoProcesado.slice(cursor));
    return resultado;
}

export function analizarNombreAcorde(nombreRaw) {
    const textoLimpio = nombreRaw.trim().replace(/[\s-\-❚❙]/g, '');
    const partes = textoLimpio.split('_');
    const estructura = partes[0];
    const bajoRaw = partes[1] || null;
    let raiz = '', alteraciones = '';
    const estructuraUpper = estructura.toUpperCase();
    for (const notaLatina of Object.keys(MAPA_A_ANGLO)) {
        if (estructuraUpper.startsWith(notaLatina)) {
            raiz = MAPA_A_ANGLO[notaLatina];
            alteraciones = estructura.substring(notaLatina.length);
            break;
        }
    }
    if (!raiz) {
        raiz = estructura.substring(0, 1).toUpperCase();
        alteraciones = estructura.substring(1);
    }
    if (alteraciones.startsWith('#') || alteraciones.startsWith('b')) {
        raiz += alteraciones.substring(0, 1);
        alteraciones = alterations.substring(1);
    }
    let notaBajo = null;
    if (bajoRaw) {
        const bajoUpper = bajoRaw.toUpperCase();
        for (const notaLatina of Object.keys(MAPA_A_ANGLO)) {
            if (bajoUpper.startsWith(notaLatina)) {
                notaBajo = MAPA_A_ANGLO[notaLatina] + bajoUpper.substring(notaLatina.length).toLowerCase();
                break;
            }
        }
        if (!notaBajo) notaBajo = bajoRaw.substring(0, 1).toUpperCase() + bajoRaw.substring(1);
    }
    return { textoLimpio, raiz, alteraciones, notaBajo };
}

export function dibujarAcordeCanvasExpandido(wrapper, datos) {
    wrapper.innerHTML = "";
    wrapper.dataset.strings = datos.strings;
    const esMovil = window.innerWidth <= 600;
    const canvas = document.createElement('canvas');
    const anchoCanvas = esMovil ? 124 : 150;
    const altoCanvas = esMovil ? 104 : 124;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = anchoCanvas * dpr;
    canvas.height = altoCanvas * dpr;
    canvas.style.width = anchoCanvas + "px";
    canvas.style.height = altoCanvas + "px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    wrapper.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const trastesArr = datos.strings.trim().toUpperCase().split(/\s+/);
    const trasteBase = datos.trasteInicio || 1;
    const xInicio = esMovil ? 30 : 32;
    const yInicio = esMovil ? 10 : 12;
    const anchoDiapason = esMovil ? 65 : 85;
    const altoDiapason = esMovil ? 70 : 88;
    const numCuerdas = 6, numTrastesVisibles = 4;
    const espacioCuerdas = anchoDiapason / (numCuerdas - 1);
    const espacioTrastes = altoDiapason / numTrastesVisibles;

    ctx.strokeStyle = "#717171";
    if (trasteBase === 1) {
        ctx.lineWidth = esMovil ? 3 : 4;
        ctx.beginPath(); ctx.moveTo(xInicio, yInicio); ctx.lineTo(xInicio + anchoDiapason, yInicio); ctx.stroke();
    } else {
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xInicio, yInicio); ctx.lineTo(xInicio + anchoDiapason, yInicio); ctx.stroke();
        ctx.fillStyle = "#2ec4b6";
        ctx.font = esMovil ? "bold 8px monospace" : "bold 10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Fr. ${trasteBase}`, xInicio - 6, yInicio + (espacioTrastes / 2) + 3);
    }

    ctx.lineWidth = 1; ctx.strokeStyle = "#717171";
    for (let i = 1; i <= numTrastesVisibles; i++) {
        let y = yInicio + (i * espacioTrastes);
        ctx.beginPath(); ctx.moveTo(xInicio, y); ctx.lineTo(xInicio + anchoDiapason, y); ctx.stroke();
    }
    for (let i = 0; i < numCuerdas; i++) {
        let x = xInicio + (i * espacioCuerdas);
        ctx.lineWidth = (i >= 4) ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x, yInicio); ctx.lineTo(x, yInicio + altoDiapason); ctx.stroke();
    }

    if (datos.cejilla && datos.cuerdasCejilla) {
        const cuerdaInicio = datos.cuerdasCejilla[0] - 1;
        const cuerdaFin = datos.cuerdasCejilla[1] - 1;
        const yCejilla = yInicio + (espacioTrastes / 2);
        ctx.strokeStyle = "rgba(46, 196, 182, 0.8)";
        ctx.lineWidth = esMovil ? 4 : 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(xInicio + (cuerdaInicio * espacioCuerdas), yCejilla);
        ctx.lineTo(xInicio + (cuerdaFin * espacioCuerdas), yCejilla);
        ctx.stroke();
        ctx.lineCap = "butt";
    }

    trastesArr.forEach((trasteStr, indiceCuerda) => {
        let x = xInicio + (indiceCuerda * espacioCuerdas);
        if (trasteStr === "X") {
            ctx.fillStyle = "#ff3333";
            ctx.font = esMovil ? "bold 8px sans-serif" : "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✕", x, yInicio - 4);
        } else if (trasteStr === "0") {
            ctx.strokeStyle = "#2ec4b6"; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(x, yInicio - 6, esMovil ? 2 : 2.5, 0, Math.PI * 2); ctx.stroke();
        } else {
            let numTrasteAbsoluto = parseInt(trasteStr);
            if (!isNaN(numTrasteAbsoluto)) {
                let posicionRelativaTraste = numTrasteAbsoluto - trasteBase + 1;
                if (posicionRelativaTraste >= 1 && posicionRelativaTraste <= numTrastesVisibles) {
                    let yPoint = yInicio + (posicionRelativaTraste * espacioTrastes) - (espacioTrastes / 2);
                    ctx.fillStyle = "#ffffff";
                    ctx.strokeStyle = "#2ec4b6";
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(x, yPoint, esMovil ? 3.5 : 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    });
}

export function inicializarModalAcordes(cajaId, obtenerSistema = () => 'ANGLOSAJON') {
    const caja = document.getElementById(cajaId);
    if (!caja) return;
    document.body.addEventListener('click', function(evento) {
        const link = evento.target.closest('.acorde-link');
        if (link) {
            evento.stopPropagation();
            evento.preventDefault();
            const nombreAcorde = link.getAttribute('data-acorde');
            const sistema = obtenerSistema();
            abrirCajaAcorde(nombreAcorde, evento, caja, sistema);
        } else if (caja.style.display === "block" && !caja.contains(evento.target)) {
            cerrarCajaAcorde(caja);
        }
    });
}

function abrirCajaAcorde(nombreAcordeRaw, evento, caja, sistema = 'ANGLOSAJON') {
    const titulo = document.getElementById('acorde-titulo');
    const badgeorigen = document.getElementById('origen-acorde-modal');
    const wrapperRender = document.getElementById('wrapper-render');
    if (!titulo || !wrapperRender) return;

    const analisis = analizarNombreAcorde(nombreAcordeRaw);
    const { textoLimpio, raiz, alteraciones, notaBajo } = analisis;
    const nombreFormateado = convertirAcordeASistema(textoLimpio.replace('_', '/'), sistema);
    const datosManuales = DICCIONARIO_ACORDES[nombreAcordeRaw] || DICCIONARIO_ACORDES[nombreAcordeRaw.replace('_', '/')];

    caja.style.display = "block";
    if (badgeorigen) badgeorigen.textContent = "";
    titulo.textContent = nombreFormateado;

    if (datosManuales) {
        dibujarAcordeCanvasExpandido(wrapperRender, datosManuales);
    } else {
        wrapperRender.innerHTML = `<div style="font-size:11px; color:#999;">Acorde dinámico</div>`;
    }
}

export function cerrarCajaAcorde(caja) {
    if (caja) caja.style.display = "none";
}

const MIDI_CUERDAS_AIRE = [40, 45, 50, 55, 59, 64];
let audioCtx = null;
function obtenerContexto() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

export async function reproducirAcorde(stringsStr) {
    const ctx = obtenerContexto();
    if (!ctx || !stringsStr) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
}

export function inicializarReproductorAcorde(botonId, wrapperId) {
    const boton = document.getElementById(botonId);
    const wrapper = document.getElementById(wrapperId);
    if (!boton || !wrapper) return;
    boton.addEventListener('click', (e) => {
        e.stopPropagation();
        reproducirAcorde(wrapper.dataset.strings);
    });
}

const NATURAL_ESPANOL_SEMI = { DO: 0, RE: 2, MI: 4, FA: 5, SOL: 7, LA: 9, SI: 11 };
const NATURAL_INGLES_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SOST_INGLES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BEMOL_INGLES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const SOST_ESPANOL = ["DO", "DO#", "RE", "RE#", "MI", "FA", "FA#", "SOL", "SOL#", "LA", "LA#", "SI"];
const BEMOL_ESPANOL = ["DO", "REb", "RE", "MIb", "MI", "FA", "SOLb", "SOL", "LAb", "LA", "SIb", "SI"];

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

function transponerAcorde(acordeCompleto, semitonos, alteracion = null) {
    if (!semitonos && !alteracion) return acordeCompleto;
    const mRaiz = acordeCompleto.match(/^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?/);
    if (!mRaiz) return acordeCompleto;
    const infoRaiz = analizarRaiz(mRaiz[0]);
    if (!infoRaiz) return acordeCompleto;
    const bemolDe = (info) => alteracion ? alteracion === 'BEMOL' : info.preferirBemol;
    let resto = acordeCompleto.slice(mRaiz[0].length);
    const nuevaRaiz = nombreDesdeSemitono(infoRaiz.semitono + semitonos, infoRaiz.esEspanol, bemolDe(infoRaiz));
    return nuevaRaiz + resto;
}

export function transponerTexto(texto, semitonos, alteracion = null) {
    if (!texto || (!semitonos && !alteracion)) return texto;
    return texto.split(/\r?\n/).map(linea => {
        const regex = crearRegexAcordes();
        return linea.replace(regex, (match) => transponerAcorde(match, semitonos, alteracion));
    }).join('
');
}

export function inicializarTransponer(opciones) {
    const { contenidoOriginal, onRetransponer, btnSubirTonoId, btnBajarTonoId, btnResetId, obtenerSistema = () => 'LATINO' } = opciones;
    let offset = 0;
    function actualizar() {
        onRetransponer(transponerTexto(contenidoOriginal, offset));
    }
    const btnSubir = document.getElementById(btnSubirTonoId);
    if (btnSubir) btnSubir.addEventListener('click', () => { offset += 2; actualizar(); });
    const btnBajar = document.getElementById(btnBajarTonoId);
    if (btnBajar) btnBajar.addEventListener('click', () => { offset -= 2; actualizar(); });
    const btnReset = document.getElementById(btnResetId);
    if (btnReset) btnReset.addEventListener('click', () => { offset = 0; actualizar(); });
    actualizar();
    return { actualizar };
}