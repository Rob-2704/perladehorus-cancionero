// Uso: node js/generar-indice.js
// Recorre Canciones/<Título (Arreglos)>.txt y Canciones/General/<Título (Arreglos)>.txt
// y crea json/indice.json.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'Canciones');
const IDS_FILE = path.join(__dirname, '..', 'json', 'ids-canciones.json');
const INDICE_FILE = path.join(__dirname, '..', 'json', 'indice.json');
const orden = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' });

function parsearNombre(base) {
    const m = base.match(/^(.*?)\s*(?:\(([^()]*)\))?\s*$/);
    let nombreC = base, arreglos = '';
    if (m) {
        nombreC = m[1].trim() || base;
        arreglos = (m[2] || '').trim();
    }
    return { nombreC, arreglos };
}

// --: no terminada · -: revisarla · (nada): terminada
function leerEstado(base) {
    const m = base.match(/^(-{1,2})\s*/);
    if (!m) return { estado: 'terminada', limpio: base };
    const estado = m[1].length === 2 ? 'pendiente' : 'revisar';
    return { estado, limpio: base.slice(m[0].length) };
}

function cargarIds() {
    try { return JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')); } catch (_) { return {}; }
}

// Asigna un número a cada clave "categoria_nombreLimpio" nueva, conservando los existentes.
function asignarIds(clavesUnicas) {
    const mapa = cargarIds();
    let siguiente = 1 + Object.values(mapa).reduce((max, n) => Math.max(max, Number(n) || 0), 0);
    for (const clave of clavesUnicas) {
        if (!(clave in mapa)) mapa[clave] = siguiente++;
    }
    const dirJson = path.dirname(IDS_FILE);
    if (!fs.existsSync(dirJson)) {
        fs.mkdirSync(dirJson, { recursive: true });
    }
    fs.writeFileSync(IDS_FILE, JSON.stringify(mapa, null, 2));
    return mapa;
}

function leerCanciones() {
    const leerDirectorio = (dirPath, categoria) => {
        if (!fs.existsSync(dirPath)) return [];
        return fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(d => d.isFile() && d.name.toLowerCase().endsWith('.txt'))
            .map(d => d.name)
            .sort(orden)
            .map(f => {
                const base = f.replace(/\.txt$/i, '');
                const { estado, limpio } = leerEstado(base);
                const { nombreC, arreglos } = parsearNombre(limpio);
                return { archivo: base, limpio, nombreC, arreglos, estado, categoria };
            });
    };

    const cancionesRondalla = leerDirectorio(RAIZ, 'rondalla');
    const cancionesGeneral = leerDirectorio(path.join(RAIZ, 'General'), 'general');

    const archivos = [...cancionesRondalla, ...cancionesGeneral];
    const mapaIds = asignarIds(archivos.map(a => `${a.categoria}_${a.limpio}`));

    return archivos.map(a => ({
        idC: String(mapaIds[`${a.categoria}_${a.limpio}`]),
        nombreC: a.nombreC,
        arreglos: a.arreglos,
        estado: a.estado,
        categoria: a.categoria,
        archivo: a.archivo
    }));
}

const canciones = leerCanciones();
fs.writeFileSync(INDICE_FILE, JSON.stringify({ canciones }, null, 2));
console.log(`json/indice.json listo: ${canciones.length} canciones procesadas.`);