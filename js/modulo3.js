/* ============================================================
   modulo3.js — 🚪 Escape Room
   Árbol ALEATORIO en cada sala. Tres pistas, cada una con su
   propio nivel de dificultad:
     - Fácil:   una propiedad simple del árbol (hojas / hijos de la raíz)
     - Medio:   una propiedad global del árbol (altura / total de nodos)
     - Difícil: una propiedad del nodo marcado con ★ (profundidad /
                cantidad de descendientes)
   Cada nivel tiene VARIAS pistas posibles: cada partida elige una
   al azar por nivel, así la sala no siempre pide lo mismo.
   El código de la puerta son esos 3 valores concatenados
   (fácil + medio + difícil, en ese orden).
   El puntaje penaliza los intentos extra en "Verificar".
   ============================================================ */

(function () {
  let tree = null;
  let nodoEstrellaId = null;
  let intentos = 0;
  let codigoCorrecto = '';
  let puertaAbierta = false;
  let clueFacil = null;
  let clueMedio = null;
  let clueDificil = null;

  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const clue1 = document.getElementById('clue1');
  const clue2 = document.getElementById('clue2');
  const clue3 = document.getElementById('clue3');
  const clue1Label = document.querySelector('label[for="clue1"]');
  const clue2Label = document.getElementById('clue2Label');
  const clue3Label = document.querySelector('label[for="clue3"]');
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

  /* Banco de pistas por nivel. Cada una sabe calcular su propio valor (0-9)
     a partir del árbol y (si aplica) del nodo marcado con ★. */
  const CLUE_POOL = {
    facil: [
      { texto: () => '¿Cuántas hojas tiene el árbol?', calc: (t) => obtenerHojas(t).length },
      { texto: (t) => `¿Cuántos hijos tiene la raíz "${etiqueta(t, t.root)}"?`, calc: (t) => obtenerHijos(t, t.root).length },
    ],
    medio: [
      { texto: () => '¿Cuál es la altura del árbol?', calc: (t) => alturaArbol(t) },
      { texto: () => '¿Cuántos nodos tiene el árbol en total?', calc: (t) => Object.keys(t.nodes).length },
    ],
    dificil: [
      { texto: (t, star) => `¿Cuál es la profundidad del nodo marcado con ★ (${etiqueta(t, star)})?`, calc: (t, star) => profundidadDe(t, star) },
      { texto: (t, star) => `¿Cuántos nodos descendientes tiene el nodo marcado con ★ (${etiqueta(t, star)})?`, calc: (t, star) => contarDescendientes(t, star) },
    ],
  };

  function setLabelText(labelEl, numero, texto) {
    if (!labelEl) return;
    labelEl.textContent = `${numero}. ${texto}`;
  }

  function nuevaPartida() {
    tree = generarArbolAleatorio();
    const noRaiz = nodosOrdenados(tree).filter((id) => id !== tree.root);
    nodoEstrellaId = elegirAleatorio(noRaiz.length ? noRaiz : [tree.root]);
    intentos = 0;
    puertaAbierta = false;

    clueFacil = elegirAleatorio(CLUE_POOL.facil);
    clueMedio = elegirAleatorio(CLUE_POOL.medio);
    clueDificil = elegirAleatorio(CLUE_POOL.dificil);

    dibujarTablero();

    const valorFacil = clueFacil.calc(tree, nodoEstrellaId);
    const valorMedio = clueMedio.calc(tree, nodoEstrellaId);
    const valorDificil = clueDificil.calc(tree, nodoEstrellaId);
    codigoCorrecto = `${valorFacil}${valorMedio}${valorDificil}`;

    setLabelText(clue1Label, 1, clueMedio.texto(tree, nodoEstrellaId));
    setLabelText(clue2Label, 2, clueDificil.texto(tree, nodoEstrellaId));
    setLabelText(clue3Label, 3, clueFacil.texto(tree, nodoEstrellaId));
    marcarDificultades();

    clue1.value = '';
    clue2.value = '';
    clue3.value = '';
    [status1, status2, status3].forEach((s) => (s.textContent = ''));

    attemptsEl.textContent = 'Intentos: 0';
    codeDisplay.textContent = '_ _ _';
    doorTitle.textContent = '🔒 Puerta cerrada';
    openBtn.disabled = true;
    finalBanner.classList.remove('show');
    door.classList.remove('door-open');
    door.classList.remove('door-ready');
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
    // clue1 = pista de nivel medio, clue2 = difícil, clue3 = fácil
    setBadge(clue1Label, 'medio');
    setBadge(clue2Label, 'dificil');
    setBadge(clue3Label, 'facil');
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

    const valorMedio = clueMedio.calc(tree, nodoEstrellaId);
    const valorDificil = clueDificil.calc(tree, nodoEstrellaId);
    const valorFacil = clueFacil.calc(tree, nodoEstrellaId);

    const ok1 = Number(clue1.value) === valorMedio;
    const ok2 = Number(clue2.value) === valorDificil;
    const ok3 = Number(clue3.value) === valorFacil;

    status1.textContent = clue1.value === '' ? '' : ok1 ? '✅' : '❌';
    status2.textContent = clue2.value === '' ? '' : ok2 ? '✅' : '❌';
    status3.textContent = clue3.value === '' ? '' : ok3 ? '✅' : '❌';

    if (ok1 && ok2 && ok3) {
      codeDisplay.textContent = codigoCorrecto.split('').join(' ');
      doorTitle.textContent = '🔓 Código correcto — puerta lista';
      openBtn.disabled = false;
      door.classList.add('door-ready');
    } else {
      openBtn.disabled = true;
      door.classList.remove('door-ready');
    }
  }

  function abrirPuerta() {
    if (openBtn.disabled) return;
    puertaAbierta = true;
    door.classList.remove('door-ready');
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
