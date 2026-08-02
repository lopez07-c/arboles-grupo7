/* ============================================================
   modulo1.js — "Rescata el Árbol"
   Arrastrar (Pointer Events) los nodos sueltos hasta su lugar
   correcto en el árbol y luego responder un cuestionario de 7
   preguntas. El puntaje final se guarda como modulo1 (0-100).
   ============================================================ */

(function () {
  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const bank = document.getElementById('bank');
  const statusPill = document.getElementById('statusPill');
  const resetBtn = document.getElementById('resetBtn');
  const quiz = document.getElementById('quiz');
  const questionsEl = document.getElementById('questions');
  const finalBanner = document.getElementById('finalBanner');
  const finalScoreEl = document.getElementById('finalScore');

  const NODE_IDS = Object.keys(TREE_A.nodes);
  let placedCount = 0;

  /* ---------- Preguntas del cuestionario ---------- */
  const PREGUNTAS = [
    { texto: '¿Cuál es la raíz del árbol?', opciones: ['A', 'B', 'C', 'D'], correcta: 'A' },
    { texto: '¿Cuál es la altura del árbol completo?', opciones: ['1', '2', '3', '4'], correcta: String(getTreeHeight(TREE_A)) },
    { texto: '¿Cuál es la profundidad del nodo D?', opciones: ['0', '1', '2', '3'], correcta: String(getDepth(TREE_A, 'D')) },
    { texto: '¿Quién es el padre de F?', opciones: ['A', 'B', 'C', 'G'], correcta: getParent(TREE_A, 'F') },
    { texto: '¿Quién es el hijo izquierdo de la raíz?', opciones: ['A', 'B', 'C', 'D'], correcta: getChild(TREE_A, TREE_A.root, 'izquierdo') },
    { texto: '¿Quién es hermano de D?', opciones: ['B', 'C', 'E', 'F'], correcta: getSiblings(TREE_A, 'D')[0] },
    { texto: '¿Cuántas hojas tiene el árbol?', opciones: ['2', '3', '4', '5'], correcta: String(getLeaves(TREE_A).length) }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Construir el tablero (slots vacíos + banco de fichas) ---------- */
  function construirTablero() {
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    bank.innerHTML = '';
    placedCount = 0;
    quiz.classList.remove('active');
    finalBanner.classList.remove('active');
    updateStatusPill();

    drawTreeLines(svg, TREE_A);

    NODE_IDS.forEach(id => {
      const node = TREE_A.nodes[id];
      const slot = document.createElement('div');
      slot.className = 'tree-node slot' + (id === TREE_A.root ? ' root-node' : '');
      slot.style.left = node.x + '%';
      slot.style.top = node.y + '%';
      slot.dataset.node = id;
      stage.appendChild(slot);
    });

    shuffle(NODE_IDS).forEach(id => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = TREE_A.nodes[id].label;
      chip.dataset.node = id;
      chip.setAttribute('tabindex', '0');
      bank.appendChild(chip);
      attachDrag(chip);
    });
  }

  function updateStatusPill() {
    statusPill.textContent = `${placedCount} / ${NODE_IDS.length} nodos colocados`;
  }

  /* ---------- Arrastrar y soltar con Pointer Events ---------- */
  function attachDrag(chip) {
    chip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = chip.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      chip.setPointerCapture(e.pointerId);
      chip.classList.add('dragging');
      chip.style.width = rect.width + 'px';
      document.body.appendChild(chip);
      chip.style.position = 'fixed';
      chip.style.left = rect.left + 'px';
      chip.style.top = rect.top + 'px';
      chip.style.zIndex = '999';

      function onMove(ev) {
        chip.style.left = (ev.clientX - offsetX) + 'px';
        chip.style.top = (ev.clientY - offsetY) + 'px';
      }

      function onUp(ev) {
        chip.removeEventListener('pointermove', onMove);
        chip.removeEventListener('pointerup', onUp);
        chip.classList.remove('dragging');

        chip.style.visibility = 'hidden';
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        chip.style.visibility = 'visible';
        const slot = under ? under.closest('.slot') : null;

        if (slot && !slot.classList.contains('filled')) {
          if (slot.dataset.node === chip.dataset.node) {
            slot.textContent = chip.textContent;
            slot.classList.add('filled', 'correct-drop');
            chip.remove();
            placedCount++;
            updateStatusPill();
            if (placedCount === NODE_IDS.length) mostrarQuiz();
            return;
          } else {
            slot.classList.add('shake');
            setTimeout(() => slot.classList.remove('shake'), 400);
          }
        }
        devolverAlBanco(chip);
      }

      chip.addEventListener('pointermove', onMove);
      chip.addEventListener('pointerup', onUp);
    });

    // Soporte de teclado accesible: Enter coloca la ficha en el primer
    // slot vacío correcto disponible (ayuda auxiliar, no reemplaza el drag).
    chip.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const slot = stage.querySelector(`.slot[data-node="${chip.dataset.node}"]`);
      if (slot && !slot.classList.contains('filled')) {
        slot.textContent = chip.textContent;
        slot.classList.add('filled', 'correct-drop');
        chip.remove();
        placedCount++;
        updateStatusPill();
        if (placedCount === NODE_IDS.length) mostrarQuiz();
      }
    });
  }

  function devolverAlBanco(chip) {
    chip.style.position = '';
    chip.style.left = '';
    chip.style.top = '';
    chip.style.width = '';
    chip.style.zIndex = '';
    bank.appendChild(chip);
  }

  /* ---------- Cuestionario ---------- */
  let respuestasCorrectas = 0;
  let respondidas = 0;

  function mostrarQuiz() {
    respuestasCorrectas = 0;
    respondidas = 0;
    questionsEl.innerHTML = '';
    quiz.classList.add('active');
    finalBanner.classList.remove('active');

    PREGUNTAS.forEach((p, i) => {
      const opciones = shuffle(p.opciones);
      const wrap = document.createElement('div');
      wrap.className = 'quiz-question';
      wrap.innerHTML = `
        <p class="quiz-question-text">${i + 1}. ${p.texto}</p>
        <div class="quiz-options">
          ${opciones.map(op => `
            <label class="quiz-option">
              <input type="radio" name="q${i}" value="${op}">
              <span>${op}</span>
            </label>`).join('')}
        </div>
        <p class="quiz-feedback" id="feedback${i}"></p>
      `;
      questionsEl.appendChild(wrap);

      wrap.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => onResponder(i, p, input.value, wrap));
      });
    });

    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onResponder(index, pregunta, valor, wrap) {
    wrap.querySelectorAll('input[type="radio"]').forEach(inp => (inp.disabled = true));
    const feedback = wrap.querySelector(`#feedback${index}`);
    const esCorrecta = valor === pregunta.correcta;
    if (esCorrecta) {
      respuestasCorrectas++;
      feedback.textContent = '✔ ¡Correcto!';
      feedback.classList.add('ok');
    } else {
      feedback.textContent = `✗ La respuesta correcta era "${pregunta.correcta}".`;
      feedback.classList.add('bad');
    }
    respondidas++;
    if (respondidas === PREGUNTAS.length) finalizarModulo();
  }

  function finalizarModulo() {
    finalScoreEl.textContent = respuestasCorrectas;
    finalBanner.classList.add('active');

    const jugador = getJugadorActual();
    if (jugador) {
      const pct = Math.round((respuestasCorrectas / PREGUNTAS.length) * 100);
      actualizarJugador(jugador, 'modulo1', pct);
    }
    finalBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- Eventos ---------- */
  resetBtn.addEventListener('click', construirTablero);

  /* ---------- Arranque ---------- */
  initPlayerSession(() => construirTablero());
})();
