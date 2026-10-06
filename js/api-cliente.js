// api-cliente.js — versión estática para GitHub Pages (sin PHP)
// Datos: json/indice.json (generado por generar-indice.js) + archivos .txt de /Canciones y /Canciones/General
const CARPETA = 'Canciones';

let indicePromise = null;

function cargarIndice() {
    if (!indicePromise) {
        indicePromise = fetch('json/indice.json', { cache: 'no-cache' }).then(r => {
            if (!r.ok) throw new Error('No se pudo cargar json/indice.json');
            return r.json();
        });
    }
    return indicePromise;
}

export async function obtenerCanciones() {
    const indice = await cargarIndice();
    return indice.canciones;
}

export async function obtenerContenidoCancion(idC) {
    const indice = await cargarIndice();
    const info = indice.canciones.find(c => c.idC === idC);
    if (!info) return { error: 'Canción no encontrada' };

    const subcarpeta = info.categoria === 'general' ? 'Canciones/General' : CARPETA;
    const ruta = `${subcarpeta}/${encodeURIComponent(info.archivo)}.txt`;
    const r = await fetch(ruta);
    if (!r.ok) return { error: `No se encontró el archivo (${r.status})` };

    return {
        idC,
        nombreC: info.nombreC,
        contenido: await r.text(),
        ytID: '',                       // pendiente: se definirá más adelante
        arreglos: info.arreglos,
        categoria: info.categoria || 'rondalla'
    };
}