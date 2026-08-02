/* ============================================================
   ranking.js — Grupo 7 · Árboles
   Sistema de jugadores + puntaje final ponderado:
     puntajeFinal = modulo1*0.30 + modulo2*0.30 + modulo3*0.40
   y el Panel de Control (jugadores.html): tarjetas, podio, tabla,
   buscador, alta/baja de jugadores, reinicio y exportación CSV/PDF.
   ============================================================ */

const LS_JUGADORES = 'arboles_jugadores';
const PESOS = { modulo1: 0.3, modulo2: 0.3, modulo3: 0.4 };

function obtenerJugadores() {
  try {
    return JSON.parse(localStorage.getItem(LS_JUGADORES)) || [];
  } catch (e) {
    return [];
  }
}

function guardarJugadores(lista) {
  localStorage.setItem(LS_JUGADORES, JSON.stringify(lista));
}

function calcularPuntaje(m1, m2, m3) {
  const a = Number(m1) || 0;
  const b = Number(m2) || 0;
  const c = Number(m3) || 0;
  return Math.round((a * PESOS.modulo1 + b * PESOS.modulo2 + c * PESOS.modulo3) * 10) / 10;
}

function buscarJugador(lista, nombre) {
  return lista.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase());
}

function asegurarJugador(nombre) {
  const lista = obtenerJugadores();
  let j = buscarJugador(lista, nombre);
  if (!j) {
    j = { nombre, modulo1: null, modulo2: null, modulo3: null, fecha: new Date().toISOString() };
    lista.push(j);
    guardarJugadores(lista);
  }
  return j;
}

/* Guarda el puntaje de un módulo (0-100) para el jugador activo.
   Si ya tenía un puntaje mejor en ese módulo, se conserva el mejor. */
function actualizarJugador(nombre, modulo, puntaje) {
  const lista = obtenerJugadores();
  let j = buscarJugador(lista, nombre);
  if (!j) {
    j = { nombre, modulo1: null, modulo2: null, modulo3: null, fecha: new Date().toISOString() };
    lista.push(j);
  }
  const actual = j[modulo];
  const redondeado = Math.round(puntaje * 10) / 10;
  if (actual === null || actual === undefined || redondeado > actual) {
    j[modulo] = redondeado;
  }
  j.fecha = new Date().toISOString();
  guardarJugadores(lista);
  return j;
}

function obtenerRanking() {
  return obtenerJugadores()
    .map((j) => ({ ...j, puntajeFinal: calcularPuntaje(j.modulo1, j.modulo2, j.modulo3) }))
    .sort((a, b) => b.puntajeFinal - a.puntajeFinal);
}

function eliminarJugador(nombre) {
  guardarJugadores(obtenerJugadores().filter((x) => x.nombre.toLowerCase() !== nombre.toLowerCase()));
}

function reiniciarRanking() {
  guardarJugadores([]);
}

/* ---------------------------------------------------------------
   Panel de Control de Jugadores (jugadores.html)
--------------------------------------------------------------- */
function initPanelJugadores() {
  const buscador = document.getElementById('buscadorJugador');
  const cuerpoTabla = document.getElementById('rankingTableBody');
  let filtro = '';

  function fmtNum(n) {
    return n === null || n === undefined ? '—' : n.toFixed(1);
  }
  function fmtFecha(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function render() {
    const ranking = obtenerRanking();
    const visibles = ranking.filter((j) => j.nombre.toLowerCase().includes(filtro.toLowerCase()));

    document.getElementById('statTotal').textContent = ranking.length;
    document.getElementById('statPrimero').textContent = ranking[0] ? ranking[0].nombre : '—';
    document.getElementById('statSegundo').textContent = ranking[1] ? ranking[1].nombre : '—';
    document.getElementById('statTercero').textContent = ranking[2] ? ranking[2].nombre : '—';
    const promedio = ranking.length ? ranking.reduce((s, j) => s + j.puntajeFinal, 0) / ranking.length : 0;
    document.getElementById('statPromedio').textContent = promedio.toFixed(1);

    const podio = document.getElementById('podio');
    podio.innerHTML = '';
    const medallas = ['🥇', '🥈', '🥉'];
    [1, 0, 2].forEach((pos) => {
      const j = ranking[pos];
      const div = document.createElement('div');
      div.className = 'podio-puesto podio-' + (pos + 1) + (j ? '' : ' vacio');
      div.innerHTML = `
        <span class="podio-medalla">${medallas[pos]}</span>
        <span class="podio-nombre">${j ? escaparHTML(j.nombre) : '—'}</span>
        <span class="podio-puntaje">${j ? fmtNum(j.puntajeFinal) : ''}</span>`;
      podio.appendChild(div);
    });

    cuerpoTabla.innerHTML = '';
    if (visibles.length === 0) {
      cuerpoTabla.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:26px;color:var(--muted);">
        ${ranking.length === 0 ? 'Todavía no hay jugadores registrados.' : 'Ningún jugador coincide con la búsqueda.'}
      </td></tr>`;
      return;
    }
    visibles.forEach((j, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="num">${i + 1}</td>
        <td>${escaparHTML(j.nombre)}</td>
        <td class="num">${fmtNum(j.modulo1)}</td>
        <td class="num">${fmtNum(j.modulo2)}</td>
        <td class="num">${fmtNum(j.modulo3)}</td>
        <td class="num"><b>${fmtNum(j.puntajeFinal)}</b></td>
        <td>${fmtFecha(j.fecha)}</td>
        <td><button class="btn-icon btn-eliminar" title="Eliminar jugador" data-nombre="${escaparHTML(j.nombre)}">🗑️</button></td>`;
      cuerpoTabla.appendChild(tr);
    });

    cuerpoTabla.querySelectorAll('.btn-eliminar').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm(`¿Eliminar a "${btn.dataset.nombre}" del ranking?`)) {
          eliminarJugador(btn.dataset.nombre);
          render();
        }
      });
    });
  }

  buscador.addEventListener('input', () => {
    filtro = buscador.value;
    render();
  });

  document.getElementById('nuevoJugadorBtn').addEventListener('click', () => {
    const nombre = prompt('Nombre del nuevo jugador:');
    if (nombre && nombre.trim()) {
      asegurarJugador(nombre.trim());
      fijarJugadorActivo(nombre.trim());
      render();
      initPlayerSession();
    }
  });

  document.getElementById('reiniciarRankingBtn').addEventListener('click', () => {
    if (confirm('Esto borrará TODOS los jugadores y puntajes guardados en este navegador. ¿Continuar?')) {
      reiniciarRanking();
      render();
    }
  });

  document.getElementById('exportarCSVBtn').addEventListener('click', () => {
    const ranking = obtenerRanking();
    const filas = [['#', 'Jugador', 'Módulo 1', 'Módulo 2', 'Módulo 3', 'Puntaje Final', 'Fecha']];
    ranking.forEach((j, i) =>
      filas.push([i + 1, j.nombre, fmtNum(j.modulo1), fmtNum(j.modulo2), fmtNum(j.modulo3), fmtNum(j.puntajeFinal), fmtFecha(j.fecha)])
    );
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ranking-arboles-grupo7.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('exportarPDFBtn').addEventListener('click', () => window.print());

  render();
}
