chrome.runtime.onMessage.addListener((request) => {

  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function filtrarPorPosicion(prefijo) {
    const palabrasEncabezado = ['canalizacion', 'estatus', 'posicion', 'hora'];
    let encabezado = null;

    // 1️⃣ Detectar encabezado
    document.querySelectorAll('div').forEach(div => {
      if (!div.dataset.originalDisplay) {
        div.dataset.originalDisplay = getComputedStyle(div).display;
      }

      const textosHijos = [...div.children].map(h =>
        normalizar(h.textContent || '')
      );

      const esEncabezado = palabrasEncabezado.every(p =>
        textosHijos.some(t => t.includes(p))
      );

      if (esEncabezado && div.children.length === 4) {
        encabezado = div;
      }
    });

    // 2️⃣ Filtrar filas de datos
    document.querySelectorAll('div').forEach(div => {

      // nunca ocultar encabezado
      if (div === encabezado) {
        div.style.display = div.dataset.originalDisplay;
        return;
      }

      // solo filas con 4 columnas
      if (div.children.length === 4) {
        const texto = normalizar(div.textContent || '');

        div.style.display = texto.includes(prefijo.toLowerCase())
          ? div.dataset.originalDisplay
          : 'none';
      }
    });
  }

  function restaurarFilas() {
    document.querySelectorAll('div').forEach(div => {
      if (div.dataset.originalDisplay) {
        div.style.display = div.dataset.originalDisplay;
      } else {
        div.style.display = '';
      }
    });
  }

  // 📩 Mensajes desde popup
  if (request.action === 'filtrar') {
    filtrarPorPosicion(request.prefijo);
  }

  if (request.action === 'reset') {
    restaurarFilas();
  }
});

