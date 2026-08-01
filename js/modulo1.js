/* ==========================================================================
   Módulo 1 · Rescata el Árbol
   Arrastrar chips (nodos) hasta las posiciones correctas del árbol (TREE_A)
   y luego responder un cuestionario sobre sus propiedades.
   ========================================================================== */

(function(){
  const stage   = document.getElementById('stage');
  const svg     = document.getElementById('lines');
  const bank    = document.getElementById('bank');
  const statusPill = document.getElementById('statusPill');
  const resetBtn = document.getElementById('resetBtn');
  const quizEl  = document.getElementById('quiz');
  const questionsEl = document.getElementById('questions');
  const finalBanner = document.getElementById('finalBanner');
  const finalScoreEl = document.getElementById('finalScore');

  const nodeIds = Object.keys(TREE_A.nodes);
  let placedCount = 0;

  /* ---------------------- construir slots (drop targets) ---------------------- */
  function buildSlots(){
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    drawTreeLines(svg, TREE_A);
    nodeIds.forEach(id => {
      const n = TREE_A.nodes[id];
      const slot = document.createElement('div');
      slot.className = 'tree-node';
      slot.dataset.slotId = id;
      slot.style.left = n.x + '%';
      slot.style.top = n.y + '%';
      slot.textContent = '?';
      stage.appendChild(slot);
    });
  }

  /* ---------------------- construir banco de chips (desordenado) ---------------------- */
  function shuffled(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildBank(){
    bank.innerHTML = '';
    shuffled(nodeIds).forEach(id => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.dataset.letter = id;
      chip.textContent = id;
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', 'Nodo ' + id + ', arrastrar a su posición');
      attachDrag(chip);
      bank.appendChild(chip);
    });
  }

  function updateStatus(){
    statusPill.textContent = placedCount + ' / ' + nodeIds.length + ' nodos colocados';
    if(placedCount === nodeIds.length){
      statusPill.classList.add('ok');
      statusPill.textContent = '¡Árbol completo!';
      buildQuiz();
      quizEl.classList.add('visible');
      quizEl.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }

  /* --------------------------- drag & drop (pointer events) --------------------------- */
  function attachDrag(chip){
    chip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = chip.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      chip.setPointerCapture(e.pointerId);
      chip.classList.add('floating');
      chip.style.position = 'fixed';
      chip.style.width = rect.width + 'px';
      chip.style.height = rect.height + 'px';
      moveTo(e.clientX - offsetX, e.clientY - offsetY);

      function moveTo(x, y){
        chip.style.left = x + 'px';
        chip.style.top = y + 'px';
      }

      function onMove(ev){
        moveTo(ev.clientX - offsetX, ev.clientY - offsetY);
      }

      function onUp(ev){
        chip.removeEventListener('pointermove', onMove);
        chip.removeEventListener('pointerup', onUp);
        chip.classList.remove('floating');
        chip.style.position = '';
        chip.style.width = '';
        chip.style.height = '';
        chip.style.left = '';
        chip.style.top = '';

        const target = findSlotUnder(ev.clientX, ev.clientY);
        if(target){
          handleDrop(chip, target);
        }
      }

      chip.addEventListener('pointermove', onMove);
      chip.addEventListener('pointerup', onUp);
    });

    /* accesibilidad: Enter/Espacio coloca el chip en el primer slot vacío correcto (ayuda por teclado) */
    chip.addEventListener('keydown', (e) => {
      if(e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const correctSlot = stage.querySelector('.tree-node[data-slot-id="' + chip.dataset.letter + '"]:not(.correct)');
      if(correctSlot) handleDrop(chip, correctSlot);
    });
  }

  function findSlotUnder(x, y){
    const els = document.elementsFromPoint(x, y);
    return els.find(el => el.classList && el.classList.contains('tree-node') && !el.classList.contains('correct'));
  }

  function handleDrop(chip, slot){
    const isCorrect = slot.dataset.slotId === chip.dataset.letter;
    if(isCorrect){
      slot.textContent = chip.dataset.letter;
      slot.classList.add('filled', 'correct');
      if(slot.dataset.slotId === TREE_A.root) slot.classList.add('root-node');
      chip.remove();
      placedCount++;
      updateStatus();
    } else {
      slot.classList.add('wrong');
      setTimeout(() => slot.classList.remove('wrong'), 300);
      // el chip vuelve al banco
      bank.appendChild(chip);
    }
  }

  resetBtn.addEventListener('click', () => {
    placedCount = 0;
    statusPill.classList.remove('ok');
    quizEl.classList.remove('visible');
    finalBanner.classList.remove('visible');
    buildSlots();
    buildBank();
    updateStatus();
  });

  /* --------------------------------- cuestionario --------------------------------- */
  function buildQuiz(){
    const lr = leftRightChildren(TREE_A, 'B');
    const parentOfF = TREE_A.nodes['F'].parent;
    const siblingsD = siblingsOf(TREE_A, 'D');

    const questions = [
      {
        text: '¿Cuál es la raíz del árbol?',
        options: shuffled(['A','B','C','D']),
        answer: 'A'
      },
      {
        text: '¿Cuál es la altura del árbol?',
        options: shuffled(['0','1','2','3']),
        answer: String(heightOf(TREE_A))
      },
      {
        text: '¿Cuál es la profundidad del nodo D?',
        options: shuffled(['0','1','2','3']),
        answer: String(depthOf(TREE_A, 'D'))
      },
      {
        text: '¿Quién es el padre del nodo F?',
        options: shuffled(['A','B','C','G']),
        answer: parentOfF
      },
      {
        text: '¿Cuál es el hermano del nodo D?',
        options: shuffled(['B','C','E','G']),
        answer: siblingsD[0]
      }
    ];

    questionsEl.innerHTML = '';
    let answeredCount = 0;
    let score = 0;

    questions.forEach((q, idx) => {
      const box = document.createElement('div');
      box.className = 'question';
      const p = document.createElement('p');
      p.className = 'q-text';
      p.textContent = (idx+1) + '. ' + q.text;
      const opts = document.createElement('div');
      opts.className = 'options';
      const feedback = document.createElement('div');
      feedback.className = 'q-feedback';

      q.options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'option-btn';
        b.type = 'button';
        b.textContent = opt;
        b.addEventListener('click', () => {
          const correct = opt === q.answer;
          opts.querySelectorAll('.option-btn').forEach(x => x.disabled = true);
          b.classList.add(correct ? 'correct' : 'wrong');
          if(!correct){
            opts.querySelectorAll('.option-btn').forEach(x => { if(x.textContent === q.answer) x.classList.add('correct'); });
          } else {
            score++;
          }
          feedback.textContent = correct ? '¡Correcto!' : ('No — la respuesta correcta es ' + q.answer + '.');
          feedback.className = 'q-feedback ' + (correct ? 'ok' : 'bad');
          answeredCount++;
          if(answeredCount === questions.length){
            finalScoreEl.textContent = score;
            finalBanner.classList.add('visible');
          }
        });
        opts.appendChild(b);
      });

      box.appendChild(p);
      box.appendChild(opts);
      box.appendChild(feedback);
      questionsEl.appendChild(box);
    });
  }

  /* --------------------------------- init --------------------------------- */
  buildSlots();
  buildBank();
  updateStatus();
})();
