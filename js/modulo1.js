/* ============================================================
   modulo1.js — 🌱 Rescata el Árbol
   Cada partida genera un árbol ALEATORIO distinto (estructura y
   letras). El estudiante arma el árbol guiándose por "pistas de
   parentesco" y luego responde un cuestionario generado a partir
   de ESE árbol concreto, con preguntas de dificultad fácil /
   media / difícil que valen distinto puntaje.
   ============================================================ */

(function () {
  let tree = null;
  let seleccionActual = null; // chip seleccionado (para armar con teclado/clic)
  let preguntas = [];
  let respuestas = {};

  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const bank = document.getElementById('bank');
  const statusPill = document.getElementById('statusPill');
  const quiz = document.getElementById('quiz');
  const questionsEl = document.getElementById('questions');
  const finalBanner = document.getElementById('finalBanner');
  const finalScoreEl = document.getElementById('finalScore');
  const resetBtn = document.getElementById('resetBtn');

  function nuevaPartida() {
    tree = generarArbolAleatorio();
    seleccionActual = null;
    quiz.classList.remove('show');
    finalBanner.classList.remove('show');
    dibujarTablero();
    dibujarPistas();
    dibujarBanco();
    actualizarEstado();
  }

  /* ---------- Tablero: slots vacíos + líneas ---------- */
  function dibujarTablero() {
    drawTreeLines(svg, tree);
    stage.querySelectorAll('.tree-node').forEach((n) => n.remove());
    nodosOrdenados(tree).forEach((id) => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node slot' + (id === tree.root ? ' root-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.dataset.id = id;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Casilla vacía');
      el.addEventListener('click', () => intentarColocar(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          intentarColocar(id);
        }
      });
      // Pointer-based drag target
      el.addEventListener('pointerup', () => intentarColocar(id));
      stage.appendChild(el);
    });
  }

  /* ---------- Pistas de parentesco (root + cada arista) ---------- */
  function dibujarPistas() {
    let panel = document.getElementById('cluePanel1');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'cluePanel1';
      panel.className = 'clue-panel';
      stage.parentNode.insertBefore(panel, stage);
    }
    const frases = [];
    frases.push(`🌳 <b>${etiqueta(tree, tree.root)}</b> es la raíz del árbol.`);
    nodosOrdenados(tree).forEach((id) => {
      const n = tree.nodes[id];
      if (n.left) frases.push(`↙ <b>${etiqueta(tree, n.left)}</b> es hijo izquierdo de <b>${etiqueta(tree, id)}</b>.`);
      if (n.right) frases.push(`↘ <b>${etiqueta(tree, n.right)}</b> es hijo derecho de <b>${etiqueta(tree, id)}</b>.`);
    });
    panel.innerHTML =
      '<h3 style="font-size:1.05rem;margin:0 0 8px;">🔍 Pistas de parentesco</h3>' +
      '<ul class="clue-text-list">' +
      frases.map((f) => `<li>${f}</li>`).join('') +
      '</ul>';
  }

  /* ---------- Banco de fichas (chips) ---------- */
  function dibujarBanco() {
    bank.innerHTML = '';
    const letras = barajar(nodosOrdenados(tree).map((id) => etiqueta(tree, id)));
    letras.forEach((label) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = label;
      chip.dataset.label = label;
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-label', `Ficha ${label}`);
      chip.addEventListener('click', () => seleccionarChip(chip));
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          seleccionarChip(chip);
        }
      });
      habilitarArrastre(chip);
      bank.appendChild(chip);
    });
  }

  function seleccionarChip(chip) {
    bank.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip-selected'));
    if (seleccionActual === chip) {
      seleccionActual = null;
      return;
    }
    chip.classList.add('chip-selected');
    seleccionActual = chip;
  }

  /* Arrastre táctil/mouse con Pointer Events */
  function habilitarArrastre(chip) {
    let clone = null;
    let startX, startY;
    chip.addEventListener('pointerdown', (e) => {
      seleccionActual = chip;
      chip.classList.add('chip-selected');
      startX = e.clientX;
      startY = e.clientY;
      clone = chip.cloneNode(true);
      clone.classList.add('chip-drag-ghost');
      document.body.appendChild(clone);
      moverClone(e.clientX, e.clientY);
      chip.setPointerCapture(e.pointerId);
    });
    chip.addEventListener('pointermove', (e) => {
      if (!clone) return;
      moverClone(e.clientX, e.clientY);
    });
    function moverClone(x, y) {
      clone.style.left = x + 'px';
      clone.style.top = y + 'px';
    }
    chip.addEventListener('pointerup', (e) => {
      if (clone) {
        clone.remove();
        clone = null;
      }
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const slot = target && target.closest ? target.closest('.tree-node.slot') : null;
      if (slot) intentarColocar(slot.dataset.id);
    });
  }

  function intentarColocar(slotId) {
    if (!seleccionActual) return;
    const slotEl = stage.querySelector(`.tree-node[data-id="${slotId}"]`);
    if (!slotEl || slotEl.classList.contains('filled')) return;

    const label = seleccionActual.dataset.label;
    const correcto = etiqueta(tree, slotId) === label;

    if (correcto) {
      slotEl.classList.add('filled');
      slotEl.classList.remove('slot');
      slotEl.textContent = label;
      slotEl.setAttribute('aria-label', `Nodo ${label}`);
      seleccionActual.remove();
      seleccionActual = null;
      actualizarEstado();
    } else {
      slotEl.classList.add('slot-error');
      seleccionActual.classList.add('chip-error');
      setTimeout(() => {
        slotEl.classList.remove('slot-error');
        if (seleccionActual) seleccionActual.classList.remove('chip-error');
      }, 450);
    }
  }

  function actualizarEstado() {
    const total = Object.keys(tree.nodes).length;
    const colocados = stage.querySelectorAll('.tree-node.filled').length;
    statusPill.textContent = `${colocados} / ${total} nodos colocados`;
    if (colocados === total) {
      setTimeout(iniciarQuiz, 400);
    }
  }

  /* ---------- Cuestionario generado a partir del árbol armado ---------- */
  function generarBancoPreguntas() {
    const ids = nodosOrdenados(tree);
    const noRaiz = ids.filter((id) => id !== tree.root);
    const conHijos = ids.filter((id) => obtenerHijos(tree, id).length > 0);
    const conHermano = ids.filter((id) => hermanosDe(tree, id).length > 0);
    const banco = [];

    // Fáciles
    banco.push({
      nivel: 'facil',
      texto: '¿Cuál nodo es la raíz del árbol?',
      opciones: barajar(ids.map((id) => etiqueta(tree, id))),
      correcta: etiqueta(tree, tree.root),
    });
    banco.push({
      nivel: 'facil',
      texto: '¿Cuántos nodos tiene el árbol en total?',
      opciones: barajar([ids.length, ids.length + 1, Math.max(1, ids.length - 1), ids.length + 2].map(String)),
      correcta: String(ids.length),
    });
    const hoja = elegirAleatorio(obtenerHojas(tree));
    banco.push({
      nivel: 'facil',
      texto: `¿"${etiqueta(tree, hoja)}" es una hoja del árbol (no tiene hijos)?`,
      opciones: ['Sí', 'No'],
      correcta: 'Sí',
    });

    // Medias
    if (noRaiz.length) {
      const n = elegirAleatorio(noRaiz);
      banco.push({
        nivel: 'medio',
        texto: `¿Quién es el padre de "${etiqueta(tree, n)}"?`,
        opciones: barajar(ids.map((id) => etiqueta(tree, id))),
        correcta: etiqueta(tree, tree.nodes[n].parent),
      });
    }
    if (conHijos.length) {
      const n = elegirAleatorio(conHijos);
      const hijos = obtenerHijos(tree, n).map((h) => etiqueta(tree, h)).sort();
      banco.push({
        nivel: 'medio',
        texto: `¿Cuáles son los hijos de "${etiqueta(tree, n)}"? (sepáralos con coma)`,
        tipo: 'texto',
        correcta: hijos.join(','),
        ayuda: 'Ejemplo de formato: X,Y',
      });
    }
    if (conHermano.length) {
      const n = elegirAleatorio(conHermano);
      const herm = hermanosDe(tree, n).map((h) => etiqueta(tree, h)).sort();
      banco.push({
        nivel: 'medio',
        texto: `¿Quién es hermano de "${etiqueta(tree, n)}"?`,
        opciones: barajar(ids.map((id) => etiqueta(tree, id))),
        correcta: herm[0],
      });
    }

    // Difíciles
    const altura = alturaArbol(tree);
    banco.push({
      nivel: 'dificil',
      texto: '¿Cuál es la altura del árbol completo?',
      opciones: barajar(Array.from(new Set([altura, altura + 1, Math.max(0, altura - 1)].map(String)))),
      correcta: String(altura),
    });
    const nProf = elegirAleatorio(noRaiz.length ? noRaiz : ids);
    const profundidad = profundidadDe(tree, nProf);
    banco.push({
      nivel: 'dificil',
      texto: `¿Cuál es la profundidad del nodo "${etiqueta(tree, nProf)}"?`,
      opciones: barajar(Array.from(new Set([profundidad, profundidad + 1, Math.max(0, profundidad - 1)].map(String)))),
      correcta: String(profundidad),
    });
    const numHojas = obtenerHojas(tree).length;
    banco.push({
      nivel: 'dificil',
      texto: '¿Cuántas hojas tiene el árbol?',
      opciones: barajar(Array.from(new Set([numHojas, numHojas + 1, Math.max(1, numHojas - 1)].map(String)))),
      correcta: String(numHojas),
    });

    return banco;
  }

  function iniciarQuiz() {
    const banco = generarBancoPreguntas();
    const facil = barajar(banco.filter((p) => p.nivel === 'facil')).slice(0, 2);
    const medio = barajar(banco.filter((p) => p.nivel === 'medio')).slice(0, 2);
    const dificil = barajar(banco.filter((p) => p.nivel === 'dificil')).slice(0, 2);
    preguntas = barajar([...facil, ...medio, ...dificil]);
    respuestas = {};
    renderQuiz();
    quiz.classList.add('show');
    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderQuiz() {
    questionsEl.innerHTML = '';
    preguntas.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      const dif = DIFICULTAD[p.nivel];
      let inputHtml = '';
      if (p.tipo === 'texto') {
        inputHtml = `<input type="text" class="q-text-input" data-i="${i}" placeholder="${p.ayuda || ''}">`;
      } else {
        inputHtml = p.opciones
          .map(
            (op) => `
          <label class="q-option">
            <input type="radio" name="q${i}" value="${escaparHTML(op)}">
            <span>${escaparHTML(op)}</span>
          </label>`
          )
          .join('');
      }
      card.innerHTML = `
        <div class="q-head">
          <span class="q-num">Pregunta ${i + 1}</span>
          <span class="dif-badge ${dif.clase}">${dif.icono} ${dif.label} · ${dif.puntos} pts</span>
        </div>
        <p class="q-text">${p.texto}</p>
        <div class="q-options ${p.tipo === 'texto' ? 'q-options-text' : ''}">${inputHtml}</div>`;
      questionsEl.appendChild(card);
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.textContent = 'Enviar respuestas';
    btn.style.marginTop = '10px';
    btn.addEventListener('click', calificar);
    questionsEl.appendChild(btn);
  }

  function calificar() {
    let puntosObtenidos = 0;
    let puntosTotales = 0;
    preguntas.forEach((p, i) => {
      const dif = DIFICULTAD[p.nivel];
      puntosTotales += dif.puntos;
      let valor = '';
      if (p.tipo === 'texto') {
        const input = questionsEl.querySelector(`.q-text-input[data-i="${i}"]`);
        valor = (input.value || '').trim().toUpperCase().replace(/\s+/g, '');
      } else {
        const checked = questionsEl.querySelector(`input[name="q${i}"]:checked`);
        valor = checked ? checked.value : '';
      }
      const correctaNorm = p.correcta.toUpperCase().replace(/\s+/g, '');
      if (valor === correctaNorm) puntosObtenidos += dif.puntos;
    });

    const porcentaje = Math.round((puntosObtenidos / puntosTotales) * 1000) / 10;
    finalScoreEl.textContent = porcentaje.toFixed(1);
    finalBanner.classList.add('show');
    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const jugador = obtenerJugadorActivo();
    if (jugador) actualizarJugador(jugador, 'modulo1', porcentaje);
  }

  resetBtn.addEventListener('click', nuevaPartida);

  window.addEventListener('DOMContentLoaded', () => {
    if (typeof initPlayerSession === 'function') initPlayerSession();
    nuevaPartida();
  });
})();
