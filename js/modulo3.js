/* ============================================================
   modulo3.js — 🚪 Escape Room
   Árbol ALEATORIO en cada sala. Tres pistas, cada una con su
   propio nivel de dificultad:
     - Fácil:   número de hojas del árbol
     - Medio:   altura del árbol
     - Difícil: profundidad del nodo marcado con ★
   El código de la puerta son esos 3 valores concatenados.
   El puntaje penaliza los intentos extra en "Verificar".
   ============================================================ */

(function () {
  let tree = null;
  let nodoEstrellaId = null;
  let intentos = 0;
  let codigoCorrecto = '';
  let puertaAbierta = false;

  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const clue1 = document.getElementById('clue1');
  const clue2 = document.getElementById('clue2');
  const clue3 = document.getElementById('clue3');
  const clue2Label = document.getElementById('clue2Label');
  const status1 = document.getElementById('status1');
  const status2 = document.getElementById('status2');
  const status3 = document.getElementById('status3');
  const checkBtn = document.getElementById('checkBtn');
  const door = document.getElementById('door');
  const doorTitle = document.getElementById('doorTitle');
  const codeDisplay = document.getElementById('codeDisplay');
  const attemptsEl = document.getElementById('attempts');
  const openBtn = document.getElementById('openBtn');
  const finalBanner = document.getElementById('finalBanner');
  const finalBannerDetail = document.getElementById('finalBannerDetail');
  const newRoomBtn = document.getElementById('newRoomBtn');

  const PISTAS_META = [
    { nivel: 'facil', label: 'hojas' },
    { nivel: 'medio', label: 'altura' },
    { nivel: 'dificil', label: 'profundidad' },
  ];

  function nuevaPartida() {
    tree = generarArbolAleatorio();
    const noRaiz = nodosOrdenados(tree).filter((id) => id !== tree.root);
    nodoEstrellaId = elegirAleatorio(noRaiz.length ? noRaiz : [tree.root]);
    intentos = 0;
    puertaAbierta = false;

    dibujarTablero();
    marcarDificultades();

    const altura = alturaArbol(tree);
    const profundidad = profundidadDe(tree, nodoEstrellaId);
    const hojas = obtenerHojas(tree).length;
    codigoCorrecto = `${hojas}${altura}${profundidad}`;

    clue1.value = '';
    clue2.value = '';
    clue3.value = '';
    [status1, status2, status3].forEach((s) => (s.textContent = ''));
    clue2Label.textContent = `2. ¿Cuál es la profundidad del nodo marcado con ★ (${etiqueta(tree, nodoEstrellaId)})?`;

    attemptsEl.textContent = 'Intentos: 0';
    codeDisplay.textContent = '_ _ _';
    doorTitle.textContent = '🔒 Puerta cerrada';
    openBtn.disabled = true;
    finalBanner.classList.remove('show');
    door.classList.remove('door-open');
  }

  function dibujarTablero() {
    drawTreeLines(svg, tree);
    stage.querySelectorAll('.tree-node').forEach((n) => n.remove());
    nodosOrdenados(tree).forEach((id) => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node filled' + (id === tree.root ? ' root-node' : '') + (id === nodoEstrellaId ? ' star-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = n.label + (id === nodoEstrellaId ? ' ★' : '');
      stage.appendChild(el);
    });
  }

  function marcarDificultades() {
    const labels = {
      clue1: document.querySelector('label[for="clue1"]'),
      clue3: document.querySelector('label[for="clue3"]'),
    };
    // clue1 = altura (medio), clue2 = profundidad (difícil), clue3 = hojas (fácil)
    setBadge(document.querySelector('label[for="clue1"]'), 'medio');
    setBadge(clue2Label, 'dificil');
    setBadge(document.querySelector('label[for="clue3"]'), 'facil');
  }

  function setBadge(labelEl, nivel) {
    if (!labelEl) return;
    let badge = labelEl.querySelector('.dif-badge');
    if (!badge) {
      badge = document.createElement('span');
      labelEl.appendChild(badge);
    }
    const d = DIFICULTAD[nivel];
    badge.className = 'dif-badge ' + d.clase;
    badge.style.marginLeft = '8px';
    badge.textContent = `${d.icono} ${d.label}`;
  }

  function verificar() {
    if (puertaAbierta) return;
    intentos++;
    attemptsEl.textContent = `Intentos: ${intentos}`;

    const altura = alturaArbol(tree);
    const profundidad = profundidadDe(tree, nodoEstrellaId);
    const hojas = obtenerHojas(tree).length;

    const ok1 = Number(clue1.value) === altura;
    const ok2 = Number(clue2.value) === profundidad;
    const ok3 = Number(clue3.value) === hojas;

    status1.textContent = clue1.value === '' ? '' : ok1 ? '✅' : '❌';
    status2.textContent = clue2.value === '' ? '' : ok2 ? '✅' : '❌';
    status3.textContent = clue3.value === '' ? '' : ok3 ? '✅' : '❌';

    if (ok1 && ok2 && ok3) {
      codeDisplay.textContent = codigoCorrecto.split('').join(' ');
      doorTitle.textContent = '🔓 Código correcto — puerta lista';
      openBtn.disabled = false;
    } else {
      openBtn.disabled = true;
    }
  }

  function abrirPuerta() {
    if (openBtn.disabled) return;
    puertaAbierta = true;
    door.classList.add('door-open');
    doorTitle.textContent = '🎉 ¡Puerta abierta!';

    const porcentaje = Math.max(30, 100 - (intentos - 1) * 15);
    finalBannerDetail.textContent = `Abriste la puerta en ${intentos} intento${intentos === 1 ? '' : 's'}. Puntaje: ${porcentaje.toFixed(1)} / 100.`;
    finalBanner.classList.add('show');
    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const jugador = obtenerJugadorActivo();
    if (jugador) actualizarJugador(jugador, 'modulo3', porcentaje);
  }

  checkBtn.addEventListener('click', verificar);
  openBtn.addEventListener('click', abrirPuerta);
  newRoomBtn.addEventListener('click', nuevaPartida);

  window.addEventListener('DOMContentLoaded', () => {
    if (typeof initPlayerSession === 'function') initPlayerSession();
    nuevaPartida();
  });
})();
