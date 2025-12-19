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

 function expandirPrefijos(input) {
  const partes = input
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  if (partes.length === 0) return [];

  // Caso simple: AS2-2
  if (partes.length === 1) {
    return [normalizar(partes[0])];
  }

  // Base: AS2-
  const match = partes[0].match(/^([a-z]+\d+-)/i);
  if (!match) {
    return partes.map(p => normalizar(p));
  }

  const base = match[1]; // AS2-

  return partes.map(p => {
    if (p.includes('-')) return normalizar(p);
    return normalizar(base + p);
  });
}


  function compararPosiciones(a, b) {
    const extraer = t =>
      t.split('-')
        .map(p => parseInt(p.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));

    const A = extraer(a);
    const B = extraer(b);

    const max = Math.max(A.length, B.length);

    for (let i = 0; i < max; i++) {
      const va = A[i] ?? -1;
      const vb = B[i] ?? -1;
      if (va !== vb) return va - vb;
    }
    return 0;
  }

  /* =======================
     DETECTAR COLUMNA
  ======================= */

  function obtenerIndiceCanalizacion() {
    const ths = document.querySelectorAll('thead th');
    for (let i = 0; i < ths.length; i++) {
      if (normalizar(ths[i].textContent).includes('canalizacion')) {
        return i;
      }
    }
    return -1;
  }

  /* =======================
     FILTRAR + ORDENAR
  ======================= */

  function filtrarPorPosicion(input) {

    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    const indice = obtenerIndiceCanalizacion();
    if (indice === -1) return;

    const prefijos = expandirPrefijos(input);
    const filas = [...tbody.querySelectorAll('tr')];

    // Guardar estado original
    filas.forEach((tr, i) => {
      if (!tr.dataset.originalIndex) tr.dataset.originalIndex = i;
      if (!tr.dataset.originalDisplay)
        tr.dataset.originalDisplay = getComputedStyle(tr).display;
    });

    // Filtrar filas válidas
    const visibles = filas.filter(tr => {
      const texto = normalizar(tr.children[indice]?.textContent || '');
      return prefijos.some(p => texto.startsWith(p));
    });

    // Ocultar todas
    filas.forEach(tr => tr.style.display = 'none');

    // Ordenar por prefijo + número
    visibles.sort((a, b) => {
      const aTxt = a.children[indice].textContent;
      const bTxt = b.children[indice].textContent;

      const pA = prefijos.findIndex(p => normalizar(aTxt).startsWith(p));
      const pB = prefijos.findIndex(p => normalizar(bTxt).startsWith(p));

      if (pA !== pB) return pA - pB;
      return compararPosiciones(aTxt, bTxt);
    });

    // Mostrar en orden
    visibles.forEach(tr => {
      tr.style.display = tr.dataset.originalDisplay;
      tbody.appendChild(tr);
    });
  }

  /* =======================
     RESET
  ======================= */

  function restaurarFilas() {

    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    const filas = [...tbody.querySelectorAll('tr')];

    filas
      .sort((a, b) =>
        Number(a.dataset.originalIndex) -
        Number(b.dataset.originalIndex)
      )
      .forEach(tr => {
        tr.style.display = tr.dataset.originalDisplay || '';
        tbody.appendChild(tr);
      });
  }

  /* =======================
     MENSAJES
  ======================= */

  if (request.action === 'filtrar') {
    filtrarPorPosicion(request.prefijo);
  }

  if (request.action === 'reset') {
    restaurarFilas();
  }
});
