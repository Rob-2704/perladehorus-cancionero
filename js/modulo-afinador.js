// Motor del afinador: detección de tono (algoritmo McLeod / NSDF con FFT) y utilidades de notas.
//
// Precisión: la autocorrelación normalizada (NSDF) + interpolación parabólica del pico
// da errores típicos menores a 1 cent en notas limpias de guitarra, y casi no se
// confunde de octava (el problema clásico de los afinadores baratos).

export const TAM_VENTANA = 4096;           // muestras analizadas por lectura (~85–90 ms)
const TAM_FFT = TAM_VENTANA * 2;           // relleno con ceros para autocorrelación lineal
const UMBRAL_PICO = 0.9;                   // elige el primer pico "clave" ≥ 90 % del mayor
export const CLARIDAD_MINIMA = 0.82;       // por debajo, se considera ruido / sin nota clara
export const VOLUMEN_MINIMO = 0.006;       // RMS mínimo para analizar (silencio)

export const NOTAS_ANGLO = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const NOTAS_LATINO = ['DO', 'DO♯', 'RE', 'RE♯', 'MI', 'FA', 'FA♯', 'SOL', 'SOL♯', 'LA', 'LA♯', 'SI'];

// Afinaciones (de la cuerda más grave a la más aguda), en números MIDI
export const INSTRUMENTOS = {
    cromatico: { nombre: 'Cromático', cuerdas: null },
    guitarra:  { nombre: 'Guitarra',  cuerdas: [40, 45, 50, 55, 59, 64] }, // E2 A2 D3 G3 B3 E4
    bajo:      { nombre: 'Bajo',      cuerdas: [28, 33, 38, 43] },         // E1 A1 D2 G2
    ukulele:   { nombre: 'Ukulele',   cuerdas: [67, 60, 64, 69] }          // G4 C4 E4 A4 (re-entrante)
};

export function midiAFrecuencia(midi, la4 = 440) {
    return la4 * Math.pow(2, (midi - 69) / 12);
}

export function frecuenciaAMidi(freq, la4 = 440) {
    return 69 + 12 * Math.log2(freq / la4);
}

export function nombreNota(midi, sistema = 'LATINO') {
    const tabla = (sistema === 'LATINO' || sistema === 'ESPAÑOL') ? NOTAS_LATINO : NOTAS_ANGLO;
    return tabla[((midi % 12) + 12) % 12];
}

export function octavaDeMidi(midi) {
    return Math.floor(midi / 12) - 1;
}

/**
 * Dada una frecuencia, devuelve la nota objetivo y cuántos cents se desvía.
 * @param {number} freq        frecuencia detectada (Hz)
 * @param {number} la4         frecuencia de referencia del LA4 (440, 432…)
 * @param {number[]|null} cuerdas  notas MIDI de las cuerdas, o null para modo cromático
 * @param {number|null} fijada     nota MIDI forzada por el usuario (modo manual), o null
 */
export function analizarNota(freq, la4, cuerdas = null, fijada = null) {
    const midiReal = frecuenciaAMidi(freq, la4);
    let objetivo;

    if (fijada !== null && fijada !== undefined) {
        objetivo = fijada;
    } else if (cuerdas && cuerdas.length) {
        objetivo = cuerdas[0];
        let mejor = Infinity;
        for (const c of cuerdas) {
            const d = Math.abs(midiReal - c);
            if (d < mejor) { mejor = d; objetivo = c; }
        }
    } else {
        objetivo = Math.round(midiReal);
    }

    return {
        midi: objetivo,
        cents: (midiReal - objetivo) * 100,
        frecuenciaObjetivo: midiAFrecuencia(objetivo, la4)
    };
}

// ───────────────────────── FFT (radix-2 iterativa) ─────────────────────────

const tablaBits = new Uint32Array(TAM_FFT);
const tablaCos = new Float64Array(TAM_FFT / 2);
const tablaSen = new Float64Array(TAM_FFT / 2);
(function prepararTablas() {
    const bits = Math.log2(TAM_FFT);
    for (let i = 0; i < TAM_FFT; i++) {
        let r = 0, x = i;
        for (let b = 0; b < bits; b++) { r = (r << 1) | (x & 1); x >>= 1; }
        tablaBits[i] = r;
    }
    for (let i = 0; i < TAM_FFT / 2; i++) {
        tablaCos[i] = Math.cos((2 * Math.PI * i) / TAM_FFT);
        tablaSen[i] = Math.sin((2 * Math.PI * i) / TAM_FFT);
    }
})();

function fft(re, im, inversa) {
    const n = TAM_FFT;
    for (let i = 0; i < n; i++) {
        const j = tablaBits[i];
        if (j > i) {
            let t = re[i]; re[i] = re[j]; re[j] = t;
            t = im[i]; im[i] = im[j]; im[j] = t;
        }
    }
    const signo = inversa ? 1 : -1;
    for (let tam = 2; tam <= n; tam <<= 1) {
        const medio = tam >> 1;
        const paso = n / tam;
        for (let ini = 0; ini < n; ini += tam) {
            for (let k = 0, idx = 0; k < medio; k++, idx += paso) {
                const wr = tablaCos[idx];
                const wi = signo * tablaSen[idx];
                const a = ini + k, b = a + medio;
                const tr = re[b] * wr - im[b] * wi;
                const ti = re[b] * wi + im[b] * wr;
                re[b] = re[a] - tr; im[b] = im[a] - ti;
                re[a] += tr;        im[a] += ti;
            }
        }
    }
    if (inversa) {
        for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    }
}

const bufRe = new Float64Array(TAM_FFT);
const bufIm = new Float64Array(TAM_FFT);
const nsdf = new Float64Array(TAM_VENTANA);

/**
 * Detecta la frecuencia fundamental de un bloque de audio.
 * @param {Float32Array} datos  TAM_VENTANA muestras
 * @param {number} sampleRate
 * @returns {{frecuencia:number, claridad:number, volumen:number}|null}
 */
export function detectarTono(datos, sampleRate, minHz = 24, maxHz = 1800) {
    const n = TAM_VENTANA;

    // Volumen (RMS) y quitar componente continua
    let media = 0;
    for (let i = 0; i < n; i++) media += datos[i];
    media /= n;
    let suma2 = 0;
    for (let i = 0; i < n; i++) {
        const v = datos[i] - media;
        bufRe[i] = v;
        suma2 += v * v;
    }
    const volumen = Math.sqrt(suma2 / n);
    if (volumen < VOLUMEN_MINIMO) return { frecuencia: 0, claridad: 0, volumen };

    for (let i = n; i < TAM_FFT; i++) bufRe[i] = 0;
    bufIm.fill(0);

    // Autocorrelación = IFFT(|FFT|²)
    fft(bufRe, bufIm, false);
    for (let i = 0; i < TAM_FFT; i++) {
        bufRe[i] = bufRe[i] * bufRe[i] + bufIm[i] * bufIm[i];
        bufIm[i] = 0;
    }
    fft(bufRe, bufIm, true);

    // NSDF: 2·r(τ) / m'(τ)
    let m = 2 * suma2;
    const tauMax = Math.min(n >> 1, Math.floor(sampleRate / minHz));
    const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    nsdf[0] = 1;
    for (let tau = 1; tau <= tauMax + 1 && tau < n; tau++) {
        // m'(τ) = m'(τ-1) − x[τ-1]² − x[n-τ]²  (con la señal sin media)
        const a = datosSinMedia(datos, tau - 1, media);
        const b = datosSinMedia(datos, n - tau, media);
        m -= a * a + b * b;
        nsdf[tau] = m > 1e-12 ? (2 * bufRe[tau]) / m : 0;
    }

    // Saltar el primer lóbulo positivo (τ pequeños) hasta el primer cruce negativo
    let pos = 1;
    while (pos < tauMax && nsdf[pos] > 0) pos++;
    while (pos < tauMax && nsdf[pos] <= 0) pos++;
    if (pos < tauMin) pos = tauMin;

    // Picos clave: el máximo de cada lóbulo positivo
    const picos = [];
    let mejorGlobal = -1;
    while (pos < tauMax) {
        if (nsdf[pos] > 0) {
            let maxIdx = pos;
            while (pos < tauMax && nsdf[pos] > 0) {
                if (nsdf[pos] > nsdf[maxIdx]) maxIdx = pos;
                pos++;
            }
            if (maxIdx > 1 && maxIdx < tauMax && nsdf[maxIdx] > nsdf[maxIdx - 1] && nsdf[maxIdx] >= nsdf[maxIdx + 1]) {
                picos.push(maxIdx);
                if (nsdf[maxIdx] > mejorGlobal) mejorGlobal = nsdf[maxIdx];
            }
        } else {
            pos++;
        }
    }
    if (!picos.length) return { frecuencia: 0, claridad: 0, volumen };

    const corte = UMBRAL_PICO * mejorGlobal;
    let elegido = picos[0];
    for (const p of picos) {
        if (nsdf[p] >= corte) { elegido = p; break; }
    }

    // Interpolación parabólica del pico
    const y1 = nsdf[elegido - 1], y2 = nsdf[elegido], y3 = nsdf[elegido + 1];
    const denom = y1 - 2 * y2 + y3;
    let delta = 0;
    if (Math.abs(denom) > 1e-12) delta = 0.5 * (y1 - y3) / denom;
    const tauFino = elegido + delta;
    const claridad = y2 - 0.25 * (y1 - y3) * delta;

    return { frecuencia: sampleRate / tauFino, claridad, volumen };
}

function datosSinMedia(datos, i, media) {
    return datos[i] - media;
}