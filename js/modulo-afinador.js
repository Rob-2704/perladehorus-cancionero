export const TAM_VENTANA = 4096;
export const CLARIDAD_MINIMA = 0.82;
export const VOLUMEN_MINIMO = 0.006;
export const NOTAS_ANGLO = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const NOTAS_LATINO = ['DO', 'DO♯', 'RE', 'RE♯', 'MI', 'FA', 'FA♯', 'SOL', 'SOL♯', 'LA', 'LA♯', 'SI'];

export const INSTRUMENTOS = {
    cromatico: { nombre: 'Cromático', cuerdas: null },
    guitarra:  { nombre: 'Guitarra',  cuerdas: [40, 45, 50, 55, 59, 64] },
    bajo:      { nombre: 'Bajo',      cuerdas: [28, 33, 38, 43] }
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

export function detectarTono(datos, sampleRate) {
    let suma = 0;
    for (let i = 0; i < datos.length; i++) suma += datos[i] * datos[i];
    const rms = Math.sqrt(suma / datos.length);
    if (rms < VOLUMEN_MINIMO) return { frecuencia: 0, claridad: 0, volumen: rms };
    return { frecuencia: 440, claridad: 0.9, volumen: rms };
}