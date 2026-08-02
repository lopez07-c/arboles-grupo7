/* ============================================================
   modulo3.js — "Escape Room"
   Tres pistas (altura del árbol, profundidad del nodo ★ y nº de
   hojas) forman un código de 3 dígitos que abre la puerta. Cada
   intento fallido de verificación resta puntos. El puntaje final
   se guarda como modulo3 (0-100).
   ============================================================ */

(function () {
  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');

  const clue1 = document.getElementById('clue1');
  const clue2 = document.getElementById('clue2');
  const clue3 = document.getElementById('clue3');
  const status1 = document.getElementById('status1');
  const status2 = document.getElementById('status2');
  const status3 = document.getElementById('status3');
  const checkBtn = document.getElementById('checkBtn');
  const openBtn = document.getElementById('openBtn');
  const door = document.getElementById('door');
  const doorTitle = document.getElementById('doorTitle');
  const codeDisplay = document.getElementById('codeDisplay');
  const attemptsEl = document.getElementById('attempts');
  const finalBanner = document.getElementById('finalBanner');
  const finalBannerDetail = document.getElementById('finalBannerDetail');
  const newRoomBtn = document.getElementById('newRoomBtn');

  const NODOS_POSIBLES_ESTRELLA = Object.keys(TREE_A.nodes).filter(id => id !== TREE_A.root);
  const PENALIZACION_POR_INTENTO = 15;

  let nodoEstrella = null;
  let respuestas = null; // { altura, profundidad, hojas }
  let intentos = 0;
  let desbloqueada = false;

  function elegirNodoEstrella() {
    const idx = Math.floor(Math.random() * NODOS_POSIBLES_ESTRELLA.length);
    return NODOS_POSIBLES_ESTRELLA[idx];
  }

  function construirEscena() {
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    drawTreeLines(svg, TREE_A);

    nodoEstrella = elegirNodoEstrella();
    respuestas = {
      altura: getTreeHeight(TREE_A),
      profundidad: getDepth(TREE_A, nodoEstrella),
      hojas: getLeaves(TREE_A).length
    };

    Object.entries(TREE_A.nodes).forEach(([id, n]) => {
      const el = document.createElement('div');
      el.className = 'tree-node filled' + (id === TREE_A.root ? ' root-node' : '') + (id === nodoEstrella ? ' star-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = n.label + (id === nodoEstrella ? ' ★' : '');
      stage.appendChild(el);
    });
  }

  function reiniciarPuerta() {
    intentos = 0;
    desbloqueada = false;
    [clue1, clue2, clue3].forEach(inp => { inp.value = ''; inp.disabled = false; });
    [status1, status2, status3].forEach(s => { s.textContent = ''; s.className = 'clue-status'; });
    codeDisplay.textContent = '_ _ _';
    attemptsEl.textContent = 'Intentos: 0';
    doorTitle.textContent = '🔒 Puerta cerrada';
    door.classList.remove('unlocked', 'open');
    finalBanner.classList.remove('active');
    openBtn.disabled = true;
  }

  function nuevaSala() {
    construirEscena();
    reiniciarPuerta();
  }

  function verificarPistas() {
    if (desbloqueada) return;

    const v1 = parseInt(clue1.value, 10);
    const v2 = parseInt(clue2.value, 10);
    const v3 = parseInt(clue3.value, 10);

    const ok1 = v1 === respuestas.altura;
    const ok2 = v2 === respuestas.profundidad;
    const ok3 = v3 === respuestas.hojas;

    pintarEstado(status1, ok1);
    pintarEstado(status2, ok2);
    pintarEstado(status3, ok3);

    if (ok1 && ok2 && ok3) {
      desbloqueada = true;
      const codigo = `${respuestas.altura}${respuestas.profundidad}${respuestas.hojas}`;
      codeDisplay.textContent = codigo.split('').join(' ');
      doorTitle.textContent = '🔓 Código correcto — puerta desbloqueada';
      door.classList.add('unlocked');
      openBtn.disabled = false;
      [clue1, clue2, clue3].forEach(inp => (inp.disabled = true));
    } else {
      intentos++;
      attemptsEl.textContent = `Intentos: ${intentos}`;
      door.classList.add('shake');
      setTimeout(() => door.classList.remove('shake'), 400);
    }
  }

  function pintarEstado(span, ok) {
    span.textContent = ok ? '✔' : '✗';
    span.className = 'clue-status ' + (ok ? 'ok' : 'bad');
  }

  function abrirPuerta() {
    if (!desbloqueada) return;
    door.classList.add('open');
    doorTitle.textContent = '🎉 ¡Puerta abierta!';

    const pct = Math.max(10, Math.min(100, 100 - intentos * PENALIZACION_POR_INTENTO));
    finalBannerDetail.textContent = intentos === 0
      ? 'Resolviste el código a la primera. ¡Puntaje perfecto!'
      : `Lo lograste con ${intentos} ${intentos === 1 ? 'intento fallido' : 'intentos fallidos'}. Puntaje: ${pct}/100.`;
    finalBanner.classList.add('active');

    const jugador = getJugadorActual();
    if (jugador) actualizarJugador(jugador, 'modulo3', pct);

    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  checkBtn.addEventListener('click', verificarPistas);
  openBtn.addEventListener('click', abrirPuerta);
  newRoomBtn.addEventListener('click', nuevaSala);

  initPlayerSession(() => nuevaSala());
})();
