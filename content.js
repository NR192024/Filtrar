chrome.runtime.onMessage.addListener((request) => {

  /* =======================
     UTILIDADES
  ======================= */

  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  // "AS2-2,3" → ["as2-2", "as2-3"]
  function expandirPrefijos(input) {
    const partes = input.split(',').map(p => p.trim()).filter(Boolean);
    if (partes.length === 0) return [];

    if (partes.length === 1) {
      return [partes[0].toLowerCase()];
    }

    const base = partes[0].replace(/\d+$/, '');

    return partes.map(p => {
      if (p === partes[0]) return p.toLowerCase();
      return (base + p).toLowerCase();
    });
  }

  // compara "AS2-2-1-4" vs "AS2-3-1-2"
  function compararPosiciones(a, b) {
    const extraerNumeros = texto =>
      texto
        .split('-')
        .map(p => parseInt(p.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));

    const numsA = extraerNumeros(a);
    const numsB = extraerNumeros(b);

    const max = Math.max(numsA.length, numsB.length);

    for (let i = 0; i < max; i++) {
      const valA = numsA[i] ?? -1;
      const valB = numsB[i] ?? -1;

      if (valA !== valB) return valA - valB;
    }
    return 0;
  }

  /* =======================
     ORDENAR FILAS
  ======================= */

  function ordenarFilasPorPosicion(encabezado) {
    if (!encabezado || !encabezado.parentElement) return;

    const contenedor = encabezado.parentElement;

    const filas = [...contenedor.children].filter(div =>
      div !== encabezado &&
      div.children.length === 4 &&
      div.style.display !== 'none'
    );

    filas.sort((a, b) => {
      const posA = a.children[2]?.innerText.trim() || '';
      const posB = b.children[2]?.innerText.trim() || '';
      return compararPosiciones(posA, posB);
    });

    filas.forEach(fila => contenedor.appendChild(fila));
  }

  /* =======================
     FILTRAR
  ======================= */

  function filtrarPorPosicion(inputPrefijo) {
    const palabrasEncabezado = ['canalizacion', 'estatus', 'posicion', 'hora'];
    let encabezado = null;

    const prefijos = expandirPrefijos(inputPrefijo);

    // 1️⃣ Detectar encabezado y guardar estado original
    document.querySelectorAll('div').forEach(div => {

      if (div.parentElement && !div.dataset.originalIndex) {
        div.dataset.originalIndex =
          [...div.parentElement.children].indexOf(div);
      }

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

    // 2️⃣ Filtrar filas
    document.querySelectorAll('div').forEach(div => {

      if (div === encabezado) {
        div.style.display = div.dataset.originalDisplay;
        return;
      }

      if (div.children.length === 4) {
        const texto = normalizar(div.textContent || '');
        const coincide = prefijos.some(p => texto.includes(p));

        div.style.display = coincide
          ? div.dataset.originalDisplay
          : 'none';
      }
    });

    // 3️⃣ Ordenar visibles
    ordenarFilasPorPosicion(encabezado);
  }

  /* =======================
     RESET
  ======================= */

  function restaurarFilas() {

    // restaurar display
    document.querySelectorAll('div').forEach(div => {
      if (div.dataset.originalDisplay) {
        div.style.display = div.dataset.originalDisplay;
      } else {
        div.style.display = '';
      }
    });

    // restaurar orden original
    document.querySelectorAll('div[data-original-index]')
      .forEach(div => {
        const parent = div.parentElement;
        if (!parent) return;

        const hijos = [...parent.children]
          .filter(c => c.dataset.originalIndex !== undefined)
          .sort((a, b) =>
            Number(a.dataset.originalIndex) -
            Number(b.dataset.originalIndex)
          );

        hijos.forEach(h => parent.appendChild(h));
      });
  }

  /* =======================
     MENSAJES POPUP
  ======================= */

  if (request.action === 'filtrar') {
    filtrarPorPosicion(request.prefijo);
  }

  if (request.action === 'reset') {
    restaurarFilas();
  }
});

