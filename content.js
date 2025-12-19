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

  function obtenerTextoCelda(td) {
    if (!td) return '';

    const texto = td.textContent.trim();
    if (texto) return texto;

    const before = getComputedStyle(td, '::before').content;
    if (before && before !== 'none') {
      return before.replace(/^["']|["']$/g, '').trim();
    }

    return '';
  }

  /* =======================
     DETECTAR COLUMNA
  ======================= */

  function obtenerIndiceCanalizacion() {
    const ths = [...document.querySelectorAll('thead th')];

    return ths.findIndex(th =>
      normalizar(th.textContent).includes('canalizacion')
    );
  }

  /* =======================
     PREFIJOS
  ======================= */

  function expandirPrefijos(input) {
    const partes = input.split(',').map(p => p.trim()).filter(Boolean);
    if (!partes.length) return [];

    if (partes.length === 1) {
      return [normalizar(partes[0])];
    }

    const match = partes[0].match(/^([a-z]+\d+-)/i);
    if (!match) return partes.map(p => normalizar(p));

    const base = match[1];

    return partes.map(p =>
      p.includes('-') ? normalizar(p) : normalizar(base + p)
    );
  }

  /* =======================
     COMPARAR
  ======================= */

  function compararPosiciones(a, b) {
    const extraer = txt =>
      txt.split('-')
        .map(p => parseInt(p.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));

    const A = extraer(a);
    const B = extraer(b);
    const max = Math.max(A.length, B.length);

    for (let i = 0; i < max; i++) {
      const x = A[i] ?? -1;
      const y = B[i] ?? -1;
      if (x !== y) return x - y;
    }
    return 0;
  }

  /* =======================
     FILTRAR Y ORDENAR
  ======================= */

  function filtrarPorPosicion(input) {
    const idx = obtenerIndiceCanalizacion();
    if (idx === -1) return;

    const prefijos = expandirPrefijos(input);
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    const filas = [...tbody.querySelectorAll('tr')];

    filas.forEach((tr, i) => {
      tr.dataset.originalIndex ??= i;
      tr.dataset.originalDisplay ??= getComputedStyle(tr).display;
    });

    // Filtrar
    filas.forEach(tr => {
      const td = tr.children[idx];
      const texto = normalizar(obtenerTextoCelda(td));

      const coincide = prefijos.some(p =>
        texto.startsWith(p)
      );

      tr.style.display = coincide
        ? tr.dataset.originalDisplay
        : 'none';
    });

    // Ordenar visibles
    const visibles = filas.filter(tr => tr.style.display !== 'none');

    visibles.sort((a, b) => {
      const A = obtenerTextoCelda(a.children[idx]);
      const B = obtenerTextoCelda(b.children[idx]);
      return compararPosiciones(A, B);
    });

    visibles.forEach(tr => tbody.appendChild(tr));
  }

  /* =======================
     RESET
  ======================= */

  function restaurarFilas() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    [...tbody.querySelectorAll('tr')]
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

