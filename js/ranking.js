/* ============================================================
   ranking.js
   Sistema de jugadores, puntaje ponderado y panel de control.

   Esquema guardado en localStorage['jugadores']:
   [
     {
       nombre: "Ana",
       modulo1: 0-100,
       modulo2: 0-100,
       modulo3: 0-100,
       puntajeFinal: 0-100,
       fechaUltimaPartida: "2026-08-02T10:00:00.000Z"
     },
     ...
   ]

   Ponderación del puntaje final:
     Módulo 1 = 30%   Módulo 2 = 30%   Módulo 3 = 40%
------------------------------------------------------------- */

const PESOS = { modulo1: 0.30, modulo2: 0.30, modulo3: 0.40 };

/* ---------- Lectura / escritura ---------- */

function obtenerJugadores() {
  try {
    const raw = localStorage.getItem(RANKING_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function guardarListaJugadores(lista) {
  localStorage.setItem(RANKING_KEY, JSON.stringify(lista));
}

/* ---------- Alta / actualización de jugadores ---------- */

/** Crea un jugador nuevo si no existe. No sobreescribe uno existente. */
function guardarJugador(nombre) {
  const lista = obtenerJugadores();
  const existe = lista.some(j => j.nombre.toLowerCase() === nombre.toLowerCase());
  if (existe) return;
  lista.push({
    nombre,
    modulo1: 0,
    modulo2: 0,
    modulo3: 0,
    puntajeFinal: 0,
    fechaUltimaPartida: new Date().toISOString()
  });
  guardarListaJugadores(lista);
}

/** Calcula el puntaje final ponderado de un jugador. */
function calcularPuntaje(jugador) {
  const puntaje =
    jugador.modulo1 * PESOS.modulo1 +
    jugador.modulo2 * PESOS.modulo2 +
    jugador.modulo3 * PESOS.modulo3;
  return Math.round(puntaje * 10) / 10;
}

/** Actualiza el puntaje de un módulo para el jugador dado (0-100)
 *  y recalcula su puntaje final ponderado. Crea al jugador si no existía. */
function actualizarJugador(nombre, modulo, puntaje) {
  if (!['modulo1', 'modulo2', 'modulo3'].includes(modulo)) return;
  const lista = obtenerJugadores();
  let jugador = lista.find(j => j.nombre.toLowerCase() === nombre.toLowerCase());
  if (!jugador) {
    jugador = { nombre, modulo1: 0, modulo2: 0, modulo3: 0, puntajeFinal: 0, fechaUltimaPartida: '' };
    lista.push(jugador);
  }
  const puntajeClamp = Math.max(0, Math.min(100, Math.round(puntaje)));
  jugador[modulo] = puntajeClamp;
  jugador.puntajeFinal = calcularPuntaje(jugador);
  jugador.fechaUltimaPartida = new Date().toISOString();
  guardarListaJugadores(lista);
  return jugador;
}

/** Devuelve la lista de jugadores ordenada de mayor a menor puntaje final. */
function obtenerRanking() {
  return obtenerJugadores()
    .slice()
    .sort((a, b) => b.puntajeFinal - a.puntajeFinal);
}

function eliminarJugador(nombre) {
  const lista = obtenerJugadores().filter(j => j.nombre.toLowerCase() !== nombre.toLowerCase());
  guardarListaJugadores(lista);
}

function reiniciarRanking() {
  guardarListaJugadores([]);
}

/* ============================================================
   A partir de aquí: funciones específicas de jugadores.html
   (se ejecutan solo si los elementos existen en la página)
   ============================================================ */

let filtroActual = '';

function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

/** Refresca tarjetas superiores, podio y tabla. Punto de entrada principal. */
function refrescarPanel() {
  const ranking = obtenerRanking();
  mostrarTarjetas(ranking);
  mostrarPodio(ranking);
  mostrarTabla(ranking);
}

function mostrarTarjetas(ranking) {
  const totalEl = document.getElementById('statTotal');
  const primeroEl = document.getElementById('statPrimero');
  const segundoEl = document.getElementById('statSegundo');
  const terceroEl = document.getElementById('statTercero');
  const promedioEl = document.getElementById('statPromedio');
  if (!totalEl) return;

  totalEl.textContent = ranking.length;
  primeroEl.textContent = ranking[0] ? `${ranking[0].nombre} · ${ranking[0].puntajeFinal}` : '—';
  segundoEl.textContent = ranking[1] ? `${ranking[1].nombre} · ${ranking[1].puntajeFinal}` : '—';
  terceroEl.textContent = ranking[2] ? `${ranking[2].nombre} · ${ranking[2].puntajeFinal}` : '—';
  const promedio = ranking.length
    ? Math.round((ranking.reduce((s, j) => s + j.puntajeFinal, 0) / ranking.length) * 10) / 10
    : 0;
  promedioEl.textContent = promedio;
}

function mostrarPodio(ranking) {
  const podio = document.getElementById('podio');
  if (!podio) return;
  const [p1, p2, p3] = ranking;

  const columna = (jugador, lugar) => {
    if (!jugador) {
      return `<div class="podio-col podio-${lugar}">
        <div class="podio-block"><span class="podio-medal">${lugar === 1 ? '🥇' : lugar === 2 ? '🥈' : '🥉'}</span></div>
        <div class="podio-name">—</div><div class="podio-pts">— pts</div>
      </div>`;
    }
    return `<div class="podio-col podio-${lugar}">
      <div class="podio-block">
        <span class="podio-medal">${lugar === 1 ? '🥇' : lugar === 2 ? '🥈' : '🥉'}</span>
      </div>
      <div class="podio-name">${jugador.nombre}</div>
      <div class="podio-pts">${jugador.puntajeFinal} pts</div>
    </div>`;
  };

  podio.innerHTML = columna(p2, 2) + columna(p1, 1) + columna(p3, 3);
}

function mostrarTabla(ranking) {
  const body = document.getElementById('rankingTableBody');
  if (!body) return;
  const filtrados = ranking.filter(j =>
    j.nombre.toLowerCase().includes(filtroActual.toLowerCase())
  );

  if (filtrados.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-row">Ningún jugador coincide con "${filtroActual}".</td></tr>`;
    return;
  }

  body.innerHTML = filtrados.map((j) => {
    const posicionReal = ranking.indexOf(j) + 1;
    return `<tr>
      <td class="num">${posicionReal}</td>
      <td>${j.nombre}</td>
      <td class="num">${j.modulo1}</td>
      <td class="num">${j.modulo2}</td>
      <td class="num">${j.modulo3}</td>
      <td class="num final-col">${j.puntajeFinal}</td>
      <td>${formatearFecha(j.fechaUltimaPartida)}</td>
      <td class="row-actions">
        <button type="button" class="btn-mini" data-action="eliminar" data-nombre="${j.nombre}">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function buscarJugador(texto) {
  filtroActual = texto || '';
  refrescarPanel();
}

/* ---------- Exportar CSV ---------- */
function exportarCSV() {
  const ranking = obtenerRanking();
  const encabezado = ['Posición', 'Jugador', 'Módulo 1', 'Módulo 2', 'Módulo 3', 'Puntaje Final', 'Fecha'];
  const filas = ranking.map((j, i) => [
    i + 1, j.nombre, j.modulo1, j.modulo2, j.modulo3, j.puntajeFinal, formatearFecha(j.fechaUltimaPartida)
  ]);
  const csv = [encabezado, ...filas]
    .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ranking-arboles.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Exportar PDF ----------
   Sin librerías externas: se abre el diálogo de impresión del
   navegador ya con una hoja de estilos "@media print" que oculta
   todo salvo el panel de ranking. Desde ahí el usuario elige
   "Guardar como PDF" como destino. */
function exportarPDF() {
  document.body.classList.add('print-ranking');
  window.print();
  setTimeout(() => document.body.classList.remove('print-ranking'), 300);
}

/* ---------- Inicialización de la página jugadores.html ---------- */
function initPanelJugadores() {
  refrescarPanel();

  const buscador = document.getElementById('buscadorJugador');
  if (buscador) buscador.addEventListener('input', (e) => buscarJugador(e.target.value));

  const tabla = document.getElementById('rankingTableBody');
  if (tabla) {
    tabla.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="eliminar"]');
      if (!btn) return;
      if (!confirm(`¿Eliminar a "${btn.dataset.nombre}" del ranking?`)) return;
      eliminarJugador(btn.dataset.nombre);
      if (getJugadorActual() === btn.dataset.nombre) localStorage.removeItem(SESSION_KEY);
      refrescarPanel();
    });
  }

  const nuevoBtn = document.getElementById('nuevoJugadorBtn');
  if (nuevoBtn) {
    nuevoBtn.addEventListener('click', () => {
      mostrarModalJugador((nombre) => {
        guardarJugador(nombre);
        localStorage.setItem(SESSION_KEY, nombre);
        renderPlayerBadge(nombre);
        refrescarPanel();
      });
    });
  }

  const reiniciarBtn = document.getElementById('reiniciarRankingBtn');
  if (reiniciarBtn) {
    reiniciarBtn.addEventListener('click', () => {
      if (!confirm('Esto borrará a TODOS los jugadores y sus puntajes. ¿Continuar?')) return;
      reiniciarRanking();
      localStorage.removeItem(SESSION_KEY);
      refrescarPanel();
      renderPlayerBadge('');
      const slot = document.getElementById('playerBadgeSlot');
      if (slot) slot.innerHTML = '';
    });
  }

  const csvBtn = document.getElementById('exportarCSVBtn');
  if (csvBtn) csvBtn.addEventListener('click', exportarCSV);

  const pdfBtn = document.getElementById('exportarPDFBtn');
  if (pdfBtn) pdfBtn.addEventListener('click', exportarPDF);
}
