/* ============================================================
    ranking.js — Grupo 7 · Árboles
    Sistema de jugadores + puntaje final ponderado:
      puntajeFinal = modulo1*0.30 + modulo2*0.30 + modulo3*0.40
    Sincronización en tiempo real vía Firebase Cloud Firestore
    ============================================================ */

// Credenciales de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrVdAQ9KzaOMkZv4EY7Dz4As-fK86o2Eo",
  authDomain: "arboles-grupo7.firebaseapp.com",
  projectId: "arboles-grupo7",
  storageBucket: "arboles-grupo7.firebasestorage.app",
  messagingSenderId: "919450449243",
  appId: "1:919450449243:web:23f4412589aa99f25e167e",
  measurementId: "G-XMTZ5CPJXD"
};

// Inicialización de Firebase Compat y Firestore
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const PESOS = { modulo1: 0.3, modulo2: 0.3, modulo3: 0.4 };

// Función matemática de cálculo de puntaje
function calcularPuntaje(m1, m2, m3) {
  const a = Number(m1) || 0;
  const b = Number(m2) || 0;
  const c = Number(m3) || 0;
  return Math.round((a * PESOS.modulo1 + b * PESOS.modulo2 + c * PESOS.modulo3) * 10) / 10;
}

// Asegura la existencia de un jugador en la nube
async function asegurarJugador(nombre) {
  if (!nombre || !nombre.trim()) return;
  const idDoc = nombre.trim().toLowerCase();
  const docRef = db.collection('jugadores').doc(idDoc);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    await docRef.set({
      nombre: nombre.trim(),
      modulo1: null,
      modulo2: null,
      modulo3: null,
      fecha: new Date().toISOString()
    });
  }
}

// Actualiza la puntuación de un módulo específico en la nube
async function actualizarJugador(nombre, modulo, puntaje) {
  if (!nombre || !nombre.trim()) return;
  const idDoc = nombre.trim().toLowerCase();
  const docRef = db.collection('jugadores').doc(idDoc);
  const docSnap = await docRef.get();

  let datos = {
    nombre: nombre.trim(),
    modulo1: null,
    modulo2: null,
    modulo3: null,
    fecha: new Date().toISOString()
  };

  if (docSnap.exists) {
    datos = docSnap.data();
  }

  const redondeado = Math.round(puntaje * 10) / 10;
  if (datos[modulo] === null || datos[modulo] === undefined || redondeado > datos[modulo]) {
    datos[modulo] = redondeado;
  }

  datos.fecha = new Date().toISOString();
  await docRef.set(datos);
}

// Elimina un jugador de la base de datos
async function eliminarJugador(nombre) {
  if (!nombre) return;
  await db.collection('jugadores').doc(nombre.trim().toLowerCase()).delete();
}

// Reinicia completamente el ranking en la nube
async function reiniciarRanking() {
  const snapshot = await db.collection('jugadores').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

// Utilidad para limpiar entradas HTML y prevenir XSS
function escaparHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ---------------------------------------------------------------
   Panel de Control de Jugadores (jugadores.html)
--------------------------------------------------------------- */
function initPanelJugadores() {
  const buscador = document.getElementById('buscadorJugador');
  const cuerpoTabla = document.getElementById('rankingTableBody');
  let filtro = '';
  let rankingGlobalCache = [];

  function fmtNum(n) {
    return n === null || n === undefined ? '—' : Number(n).toFixed(1);
  }

  function fmtFecha(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Renderiza la interfaz en base a los datos actuales
  function renderUI(ranking) {
    const visibles = ranking.filter((j) => j.nombre.toLowerCase().includes(filtro.toLowerCase()));

    // 1. Estadísticas generales
    const elTotal = document.getElementById('statTotal');
    const elPrimero = document.getElementById('statPrimero');
    const elSegundo = document.getElementById('statSegundo');
    const elTercero = document.getElementById('statTercero');
    const elPromedio = document.getElementById('statPromedio');

    if (elTotal) elTotal.textContent = ranking.length;
    if (elPrimero) elPrimero.textContent = ranking[0] ? ranking[0].nombre : '—';
    if (elSegundo) elSegundo.textContent = ranking[1] ? ranking[1].nombre : '—';
    if (elTercero) elTercero.textContent = ranking[2] ? ranking[2].nombre : '—';

    const promedio = ranking.length ? ranking.reduce((s, j) => s + j.puntajeFinal, 0) / ranking.length : 0;
    if (elPromedio) elPromedio.textContent = promedio.toFixed(1);

    // 2. Podio (Top 3)
    const podio = document.getElementById('podio');
    if (podio) {
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
    }

    // 3. Tabla General de Jugadores
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';

    if (visibles.length === 0) {
      cuerpoTabla.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:26px;color:var(--muted);">
        ${ranking.length === 0 ? 'Todavía no hay jugadores registrados en la nube.' : 'Ningún jugador coincide con la búsqueda.'}
      </td></tr>`;
      return;
    }

    visibles.forEach((j) => {
      const posReal = ranking.findIndex((item) => item.nombre.toLowerCase() === j.nombre.toLowerCase()) + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="num">${posReal}</td>
        <td><b>${escaparHTML(j.nombre)}</b></td>
        <td class="num">${fmtNum(j.modulo1)}</td>
        <td class="num">${fmtNum(j.modulo2)}</td>
        <td class="num">${fmtNum(j.modulo3)}</td>
        <td class="num"><b style="color:var(--gold, #eab54c);">${fmtNum(j.puntajeFinal)}</b></td>
        <td>${fmtFecha(j.fecha)}</td>
        <td><button class="btn-icon btn-eliminar" title="Eliminar jugador" data-nombre="${escaparHTML(j.nombre)}" style="background:none;border:none;cursor:pointer;font-size:1.1rem;">🗑️</button></td>`;
      cuerpoTabla.appendChild(tr);
    });

    // Asignación de evento de eliminación en Firestore
    cuerpoTabla.querySelectorAll('.btn-eliminar').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nombreTarget = btn.getAttribute('data-nombre');
        if (confirm(`¿Eliminar a "${nombreTarget}" del ranking general?`)) {
          await eliminarJugador(nombreTarget);
        }
      });
    });
  }

  // Escucha activa en tiempo real mediante Firestore
  db.collection('jugadores').onSnapshot((snapshot) => {
    let ranking = [];
    snapshot.forEach((doc) => {
      const j = doc.data();
      j.puntajeFinal = calcularPuntaje(j.modulo1, j.modulo2, j.modulo3);
      ranking.push(j);
    });

    ranking.sort((a, b) => b.puntajeFinal - a.puntajeFinal);
    rankingGlobalCache = ranking;
    renderUI(rankingGlobalCache);
  });

  if (buscador) {
    buscador.addEventListener('input', () => {
      filtro = buscador.value;
      renderUI(rankingGlobalCache);
    });
  }

  const btnNuevo = document.getElementById('nuevoJugadorBtn');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', async () => {
      const nombre = prompt('Nombre del nuevo jugador:');
      if (nombre && nombre.trim()) {
        await asegurarJugador(nombre.trim());
        if (typeof fijarJugadorActivo === 'function') fijarJugadorActivo(nombre.trim());
        if (typeof initPlayerSession === 'function') initPlayerSession();
      }
    });
  }

  const btnReiniciar = document.getElementById('reiniciarRankingBtn');
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', async () => {
      if (confirm('Esto borrará TODOS los jugadores y puntajes guardados en la nube. ¿Continuar?')) {
        await reiniciarRanking();
      }
    });
  }

  const btnCSV = document.getElementById('exportarCSVBtn');
  if (btnCSV) {
    btnCSV.addEventListener('click', () => {
      const filas = [['#', 'Jugador', 'Módulo 1', 'Módulo 2', 'Módulo 3', 'Puntaje Final', 'Fecha']];
      rankingGlobalCache.forEach((j, i) =>
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
  }

  const btnPDF = document.getElementById('exportarPDFBtn');
  if (btnPDF) {
    btnPDF.addEventListener('click', () => window.print());
  }
}