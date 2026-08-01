/* ===========================================================
   Módulo 1 · Rescata el Árbol
   Cada partida usa un árbol distinto, pistas de relaciones
   distintas y un cuestionario aleatorio (7 preguntas de un
   banco de 12+ tipos). Nunca se repite igual dos veces seguidas.
   =========================================================== */

(function(){
  const stage      = document.getElementById('stage');
  const svg        = document.getElementById('lines');
  const bank       = document.getElementById('bank');
  const statusPill = document.getElementById('statusPill');
  const resetBtn   = document.getElementById('resetBtn');
  const quizWrap   = document.getElementById('quiz');
  const questionsEl= document.getElementById('questions');
  const finalBanner= document.getElementById('finalBanner');
  const finalScoreEl = document.getElementById('finalScore');

  let tree, ids, total, placed, score, answered;

  // Panel de pistas (se inserta una sola vez)
  let cluePanel = document.querySelector('.clue-panel');
  if(!cluePanel){
    cluePanel = document.createElement('div');
    cluePanel.className = 'clue-panel';
    bank.parentNode.insertBefore(cluePanel, bank);
  }

  function pickTreeForRound(){
    // Mezcla de dificultad: a veces fácil, casi siempre media, a veces difícil.
    const r = Math.random();
    if(r < 0.25) return randomTree('easy');
    if(r < 0.85) return randomTree('medium');
    return randomTree('hard');
  }

  function relationClue(id){
    const n = tree.nodes[id];
    const p = tree.nodes[n.parent];
    const side = p.left === id ? 'hijo izquierdo' : 'hijo derecho';
    return `<b>${id}</b> es el ${side} de <b>${n.parent}</b>.`;
  }

  function buildClues(){
    const clues = [`<b>${tree.root}</b> es la raíz del árbol.`];
    ids.filter(id => id !== tree.root).forEach(id => clues.push(relationClue(id)));
    return shuffle(clues);
  }

  function startRound(){
    tree = pickTreeForRound();
    ids = Object.keys(tree.nodes);
    total = ids.length;
    placed = 0;
    score = 0;
    answered = 0;

    // Reset UI
    quizWrap.classList.remove('show');
    finalBanner.classList.remove('show');
    questionsEl.innerHTML = '';
    statusPill.classList.remove('done');
    statusPill.textContent = `0 / ${total} nodos colocados`;

    // Pistas
    cluePanel.innerHTML = `<h3>🔎 Pistas para reconstruir el árbol</h3><ul>${
      buildClues().map(c => `<li>${c}</li>`).join('')
    }</ul>`;

    // Dibuja el esqueleto (líneas + slots vacíos)
    drawTreeLines(svg, tree);
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    ids.forEach(id => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node slot';
      el.dataset.id = id;
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      stage.appendChild(el);
    });

    // Banco de fichas (chips) desordenado
    bank.innerHTML = '';
    shuffle(ids).forEach(id => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.dataset.label = id;
      chip.textContent = id;
      bank.appendChild(chip);
      attachDrag(chip);
    });
  }

  /* ---------- Drag & drop con Pointer Events (mouse + touch) ---------- */
  function attachDrag(chip){
    chip.addEventListener('pointerdown', (ev) => {
      if(chip.classList.contains('placed')) return;
      ev.preventDefault();
      const rect = chip.getBoundingClientRect();
      const ghost = chip.cloneNode(true);
      ghost.classList.add('dragging');
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      document.body.appendChild(ghost);
      moveGhost(ghost, ev.clientX, ev.clientY);
      chip.style.opacity = '.25';

      function onMove(e){ moveGhost(ghost, e.clientX, e.clientY); }
      function onUp(e){
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        ghost.remove();
        chip.style.opacity = '';
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const slot = target ? target.closest('.tree-node.slot') : null;
        handleDrop(chip, slot);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }
  function moveGhost(ghost, x, y){
    ghost.style.left = (x - ghost.offsetWidth / 2) + 'px';
    ghost.style.top  = (y - ghost.offsetHeight / 2) + 'px';
  }

  function handleDrop(chip, slot){
    if(!slot || slot.classList.contains('filled')){
      shake(chip); return;
    }
    const label = chip.dataset.label;
    if(slot.dataset.id === label){
      slot.classList.add('filled');
      slot.textContent = label;
      if(label === tree.root) slot.classList.add('root-node');
      chip.classList.add('placed');
      placed++;
      statusPill.textContent = `${placed} / ${total} nodos colocados`;
      showToast(`¡Correcto! ${label} en su lugar.`, 'ok');
      if(placed === total){
        statusPill.classList.add('done');
        statusPill.textContent = `¡Árbol completo! (${total}/${total})`;
        launchQuiz();
      }
    } else {
      shake(chip);
      showToast('Ese nodo no va ahí. Revisa las pistas.', 'bad');
    }
  }
  function shake(chip){
    chip.classList.add('wrong');
    setTimeout(() => chip.classList.remove('wrong'), 350);
  }

  /* ---------- Cuestionario ---------- */
  let totalQuestions = 7;
  function launchQuiz(){
    const questions = generateQuestions(tree, 7);
    totalQuestions = questions.length;
    questionsEl.innerHTML = '';
    questions.forEach((q, idx) => renderQuestion(q, idx));
    quizWrap.classList.add('show');
    quizWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderQuestion(q, idx){
    const card = document.createElement('div');
    card.className = 'q-card';
    const normalizedAnswer = String(q.answer).trim().toLowerCase();

    let inner = `<div class="q-meta">${q.meta} · Pregunta ${idx + 1}</div><div class="q-prompt">${q.prompt}</div>`;

    if(q.kind === 'mc'){
      inner += `<div class="q-options">${
        q.options.map(opt => `<button class="q-opt" data-val="${opt}">${opt}</button>`).join('')
      }</div><div class="q-feedback"></div>`;
      card.innerHTML = inner;
      const feedback = card.querySelector('.q-feedback');
      card.querySelectorAll('.q-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if(answered > idx) return; // ya respondida
          const val = btn.dataset.val.trim().toLowerCase();
          const opts = card.querySelectorAll('.q-opt');
          opts.forEach(o => o.classList.add('disabled'));
          if(val === normalizedAnswer){
            btn.classList.add('correct');
            feedback.textContent = '✓ ¡Correcto!';
            feedback.className = 'q-feedback ok';
            score++;
          } else {
            btn.classList.add('incorrect');
            opts.forEach(o => { if(o.dataset.val.trim().toLowerCase() === normalizedAnswer) o.classList.add('correct'); });
            feedback.textContent = `✗ Incorrecto. Respuesta: ${q.answer}`;
            feedback.className = 'q-feedback bad';
          }
          registerAnswered();
        });
      });
    } else {
      inner += `<div class="q-input-row">
        <input type="text" placeholder="Tu respuesta" />
        <button class="q-check-btn">Verificar</button>
      </div><div class="q-feedback"></div>`;
      card.innerHTML = inner;
      const input = card.querySelector('input');
      const btn = card.querySelector('.q-check-btn');
      const feedback = card.querySelector('.q-feedback');
      function check(){
        if(btn.disabled) return;
        const val = input.value.trim().toLowerCase();
        input.disabled = true; btn.disabled = true;
        if(val === normalizedAnswer){
          feedback.textContent = '✓ ¡Correcto!';
          feedback.className = 'q-feedback ok';
          score++;
        } else {
          feedback.textContent = `✗ Incorrecto. Respuesta: ${q.answer}`;
          feedback.className = 'q-feedback bad';
        }
        registerAnswered();
      }
      btn.addEventListener('click', check);
      input.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });
    }
    questionsEl.appendChild(card);
  }

  let answeredCount = 0;
  function registerAnswered(){
    answeredCount++;
    answered = answeredCount;
    if(answeredCount >= totalQuestions){
      finishQuiz();
    }
  }
  function finishQuiz(){
    finalScoreEl.textContent = score;
    finalBanner.querySelector('strong').innerHTML = `Puntaje final: <span id="finalScore">${score}</span> / ${totalQuestions}`;
    finalBanner.classList.add('show');
    if(score >= Math.ceil(totalQuestions * 0.7)) confettiBurst(70);
  }

  resetBtn.addEventListener('click', () => {
    answeredCount = 0;
    startRound();
  });

  startRound();
})();
