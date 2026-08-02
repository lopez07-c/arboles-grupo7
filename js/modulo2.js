/* ============================================================
   modulo2.js — "Búsqueda del Tesoro"
   El estudiante sigue instrucciones de navegación (raíz / padre /
   hijo izquierdo / hijo derecho) haciendo clic sobre los nodos
   del árbol hasta llegar al tesoro. El puntaje final se guarda
   como modulo2 (0-100).
   ============================================================ */

(function () {
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

  const PUNTOS_ACIERTO = 10;
  const PENALIZACION_ERROR = 2;

  /* Ruta del tesoro: raíz -> hijo derecho -> hijo derecho (A -> C -> G) */
  const RUTA = [
    { texto: 'Toca la <b>raíz</b> del árbol para comenzar la búsqueda.', target: TREE_A.root },
    { texto: `Ve al <b>hijo derecho</b> de la raíz.`, target: getChild(TREE_A, TREE_A.root, 'derecho') },
    { texto: `Ve al <b>hijo derecho</b> de ese nodo. ¡El tesoro está ahí!`, target: getChild(TREE_A, getChild(TREE_A, TREE_A.root, 'derecho'), 'derecho') }
  ];

  let paso = 0;
  let score = 0;
  let posicionActual = null;

  function construirTablero() {
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    drawTreeLines(svg, TREE_A);

    Object.entries(TREE_A.nodes).forEach(([id, n]) => {
      const el = document.createElement('div');
      el.className = 'tree-node filled clickable' + (id === TREE_A.root ? ' root-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = n.label;
      el.dataset.node = id;
      stage.appendChild(el);
    });

    stage.addEventListener('click', onNodeClick);
  }

  function iniciarPartida() {
    paso = 0;
    score = 0;
    posicionActual = null;
    finalBanner.classList.remove('active');
    totalStepsEl.textContent = RUTA.length;
    actualizarHUD();
    mostrarInstruccion();
    marcarPosicionEnStage();
  }

  function mostrarInstruccion() {
    instructionText.innerHTML = RUTA[paso].texto;
  }

  function actualizarHUD() {
    scoreEl.textContent = score;
    stepEl.textContent = paso;
    posEl.textContent = posicionActual || '—';
  }

  function marcarPosicionEnStage() {
    stage.querySelectorAll('.tree-node').forEach(el => {
      el.classList.toggle('active-pos', el.dataset.node === posicionActual);
    });
  }

  function onNodeClick(e) {
    const nodeEl = e.target.closest('.tree-node');
    if (!nodeEl || paso >= RUTA.length) return;
    const clickedId = nodeEl.dataset.node;
    const objetivo = RUTA[paso].target;

    if (clickedId === objetivo) {
      score += PUNTOS_ACIERTO;
      posicionActual = clickedId;
      paso++;
      marcarPosicionEnStage();
      actualizarHUD();
      if (paso === RUTA.length) {
        finalizarPartida();
      } else {
        mostrarInstruccion();
      }
    } else {
      score = Math.max(0, score - PENALIZACION_ERROR);
      actualizarHUD();
      nodeEl.classList.add('shake');
      setTimeout(() => nodeEl.classList.remove('shake'), 400);
    }
  }

  function finalizarPartida() {
    const maxScore = RUTA.length * PUNTOS_ACIERTO;
    const pct = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

    treasureNodeEl.textContent = RUTA[RUTA.length - 1].target;
    finalScoreEl.textContent = score;
    finalBanner.classList.add('active');
    instructionText.innerHTML = '🏆 ¡Tesoro encontrado!';

    const jugador = getJugadorActual();
    if (jugador) actualizarJugador(jugador, 'modulo2', pct);

    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  playAgainBtn.addEventListener('click', iniciarPartida);

  initPlayerSession(() => {
    construirTablero();
    iniciarPartida();
  });
})();
