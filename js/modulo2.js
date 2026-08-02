/* ============================================================
   modulo2.js — 🧭 Búsqueda del Tesoro
   Árbol ALEATORIO en cada partida. Se genera una ruta de
   instrucciones de navegación de dificultad variable:
     - Fácil:   ir al hijo izquierdo/derecho del nodo actual
     - Medio:   ir al padre del nodo actual (retroceder)
     - Difícil: ir al hermano del nodo actual (combina padre + hijo)
   Cada instrucción vale distinto puntaje según su dificultad.
   ============================================================ */

(function () {
  let tree = null;
  let ruta = []; // [{ tipo, texto, nivel, destinoId }]
  let pasoActual = 0;
  let posicionId = null;
  let puntos = 0;
  let puntosTotales = 0;
  let primerIntentoOk = true;

  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const instructionText = document.getElementById('instructionText');
  const scoreEl = document.getElementById('scoreEl');
  const stepEl = document.getElementById('stepEl');
  const totalStepsEl = document.getElementById('totalStepsEl');
  const posEl = document.getElementById('posEl');
  const finalBanner = document.getElementById('finalBanner');
  const treasureNodeEl = document.getElementById('treasureNode');
  const finalScoreEl = document.getElementById('finalScore');
  const playAgainBtn = document.getElementById('playAgainBtn');

  function generarRuta() {
    const pasos = 5 + Math.floor(Math.random() * 2); // 5 o 6 pasos
    const out = [];
    let actual = tree.root;
    for (let i = 0; i < pasos; i++) {
      const opciones = [];
      const hijos = obtenerHijos(tree, actual);
      hijos.forEach((h) => {
        const lado = tree.nodes[actual].left === h ? 'izquierdo' : 'derecho';
        opciones.push({ tipo: 'hijo', nivel: 'facil', destinoId: h, texto: `Ve al hijo ${lado} del nodo actual.` });
      });
      if (tree.nodes[actual].parent) {
        opciones.push({ tipo: 'padre', nivel: 'medio', destinoId: tree.nodes[actual].parent, texto: 'Ve al padre del nodo actual.' });
      }
      const hermanos = hermanosDe(tree, actual);
      if (hermanos.length) {
        opciones.push({ tipo: 'hermano', nivel: 'dificil', destinoId: hermanos[0], texto: 'Ve al hermano del nodo actual.' });
      }
      if (!opciones.length) break;
      const elegida = elegirAleatorio(opciones);
      out.push(elegida);
      actual = elegida.destinoId;
    }
    return out;
  }

  function nuevaPartida() {
    tree = generarArbolAleatorio();
    ruta = generarRuta();
    pasoActual = 0;
    posicionId = tree.root;
    puntos = 0;
    puntosTotales = ruta.reduce((s, p) => s + DIFICULTAD[p.nivel].puntos, 0);
    primerIntentoOk = true;
    finalBanner.classList.remove('show');

    dibujarTablero();
    actualizarMarcadores();
    mostrarInstruccion();
  }

  function dibujarTablero() {
    drawTreeLines(svg, tree);
    stage.querySelectorAll('.tree-node').forEach((n) => n.remove());
    nodosOrdenados(tree).forEach((id) => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node filled' + (id === tree.root ? ' root-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = n.label;
      el.dataset.id = id;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('click', () => intentarMover(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          intentarMover(id);
        }
      });
      stage.appendChild(el);
    });
    marcarPosicion();
  }

  function marcarPosicion() {
    stage.querySelectorAll('.tree-node').forEach((el) => el.classList.remove('current-pos'));
    const el = stage.querySelector(`.tree-node[data-id="${posicionId}"]`);
    if (el) el.classList.add('current-pos');
  }

  function mostrarInstruccion() {
    if (pasoActual >= ruta.length) return finalizar();
    const paso = ruta[pasoActual];
    const dif = DIFICULTAD[paso.nivel];
    instructionText.innerHTML = `${paso.texto} <span class="dif-badge ${dif.clase}" style="margin-left:8px;">${dif.icono} ${dif.label} · ${dif.puntos} pts</span>`;
    primerIntentoOk = true;
  }

  function intentarMover(clickId) {
    if (pasoActual >= ruta.length) return;
    const paso = ruta[pasoActual];
    if (clickId === paso.destinoId) {
      if (primerIntentoOk) puntos += DIFICULTAD[paso.nivel].puntos;
      posicionId = clickId;
      pasoActual++;
      marcarPosicion();
      actualizarMarcadores();
      mostrarInstruccion();
    } else {
      primerIntentoOk = false;
      const el = stage.querySelector(`.tree-node[data-id="${clickId}"]`);
      if (el) {
        el.classList.add('slot-error');
        setTimeout(() => el.classList.remove('slot-error'), 450);
      }
    }
  }

  function actualizarMarcadores() {
    scoreEl.textContent = puntos;
    stepEl.textContent = pasoActual;
    totalStepsEl.textContent = ruta.length;
    posEl.textContent = etiqueta(tree, posicionId);
  }

  function finalizar() {
    const porcentaje = puntosTotales ? Math.round((puntos / puntosTotales) * 1000) / 10 : 0;
    treasureNodeEl.textContent = etiqueta(tree, posicionId);
    finalScoreEl.textContent = `${puntos} / ${puntosTotales} (${porcentaje.toFixed(1)}%)`;
    finalBanner.classList.add('show');
    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const jugador = obtenerJugadorActivo();
    if (jugador) actualizarJugador(jugador, 'modulo2', porcentaje);
  }

  playAgainBtn.addEventListener('click', nuevaPartida);

  window.addEventListener('DOMContentLoaded', () => {
    if (typeof initPlayerSession === 'function') initPlayerSession();
    nuevaPartida();
  });
})();
