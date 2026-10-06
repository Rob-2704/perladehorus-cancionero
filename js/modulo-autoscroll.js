let idAnimacion = null;
let estaScrolleando = false;
let ultimaMarcaTiempo = 0;

export function inicializarAutoscroll(btnPlayId, sliderId) {
    const btnPlayScroll = document.getElementById(btnPlayId);
    const sliderVelocidad = document.getElementById(sliderId);

    if (!btnPlayScroll || !sliderVelocidad) return;

    btnPlayScroll.addEventListener('click', () => {
        if (estaScrolleando) {
            detenerAutoscroll(btnPlayScroll);
        } else {
            iniciarAutoscroll(btnPlayScroll, sliderVelocidad);
        }
    });

    sliderVelocidad.addEventListener('input', () => {
        if (estaScrolleando) {
            iniciarAutoscroll(btnPlayScroll, sliderVelocidad); 
        }
    });
}

export function iniciarAutoscroll(btnPlay, slider) {
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
    
    estaScrolleando = true;
    ultimaMarcaTiempo = performance.now();
    
    if (btnPlay) {
        btnPlay.textContent = "pause";
        btnPlay.classList.add('activo');
    }

    function realizarScroll(marcaTiempoActual) {
        if (!estaScrolleando) return;

        const deltaTime = (marcaTiempoActual - ultimaMarcaTiempo) / 1000; // Convertir ms a segundos
        ultimaMarcaTiempo = marcaTiempoActual;

        const velocidadSlider = parseInt(slider.value);
        
        // Mapeo lineal para mantener el rango de velocidad equivalente:
        // Slider 1  -> ~5.26 px/s  (equivalente a 1px cada 190ms)
        // Slider 10 -> 10.00 px/s  (equivalente a 1px cada 100ms)
        const pixelesPorSegundo = 5.26 + (velocidadSlider - 1) * ((10 - 5.26) / 9);

        // Desplazamiento fraccionado continuo según los fotogramas del navegador
        window.scrollBy(0, pixelesPorSegundo * deltaTime);

        // Verificación de fin de página
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 1) {
            detenerAutoscroll(btnPlay);
            return;
        }

        idAnimacion = requestAnimationFrame(realizarScroll);
    }

    idAnimacion = requestAnimationFrame(realizarScroll);
}

export function detenerAutoscroll(btnPlay) {
    estaScrolleando = false;
    if (idAnimacion) {
        cancelAnimationFrame(idAnimacion);
        idAnimacion = null;
    }
    if (btnPlay) {
        btnPlay.textContent = "play_arrow";
        btnPlay.classList.remove('activo');
    }
}