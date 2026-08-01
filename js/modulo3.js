/* ==========================================================================
   Módulo 3 · Escape Room
   El jugador calcula altura, profundidad de D y número de hojas de TREE_B.
   Si las tres respuestas son correctas se genera el código y se puede abrir
   la puerta.
   ========================================================================== */

(function(){
  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const checkBtn = document.getElementById('checkBtn');
  const openBtn = document.getElementById('openBtn');
  const door = document.getElementById('door');
  const codeDisplay = document.getElementById('codeDisplay');
  const attemptsEl = document.getElementById('attempts');
  const finalBanner = document.getElementById('finalBanner');

  const inputs = [
    document.getElementById('clue1'),
    document.getElementById('clue2'),
    document.getElementById('clue3'),
  ];
  const statuses = [
    document.getElementById('status1'),
    document.getElementById('status2'),
    document.getElementById('status3'),
  ];

  const correctValues = [
    heightOf(TREE_B),                 // altura del árbol
    depthOf(TREE_B, 'D'),             // profundidad de D
    leavesOf(TREE_B).length,          // número de hojas
  ];

  let attempts = 0;
  let code = null;
  openBtn.disabled = true;

  function buildStage(){
    drawTreeLines(svg, TREE_B);
    Object.entries(TREE_B.nodes).forEach(([id, n]) => {
      const el = document.createElement('div');
      el.className = 'tree-node filled' + (id === TREE_B.root ? ' root-node' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = id;
      stage.appendChild(el);
    });
  }

  function verify(){
    let allOk = true;
    inputs.forEach((inp, i) => {
      const val = parseInt(inp.value, 10);
      const ok = val === correctValues[i];
      statuses[i].textContent = inp.value === '' ? '' : (ok ? '✔ correcto' : '✘ revisa de nuevo');
      statuses[i].className = 'clue-status ' + (ok ? 'ok' : 'bad');
      if(!ok) allOk = false;
    });

    if(allOk){
      code = correctValues.join('');
      codeDisplay.textContent = code.split('').join(' ');
      openBtn.disabled = false;
      attemptsEl.textContent = 'Código generado. Intentos: ' + attempts;
    } else {
      attempts++;
      code = null;
      openBtn.disabled = true;
      codeDisplay.textContent = '_ _ _';
      codeDisplay.classList.remove('shake');
      void codeDisplay.offsetWidth; // reinicia la animación
      codeDisplay.classList.add('shake');
      attemptsEl.textContent = 'Intentos: ' + attempts;
    }
  }

  function openDoor(){
    if(!code) return;
    door.classList.add('unlocked');
    door.querySelector('h3').textContent = '🔓 Puerta abierta';
    openBtn.disabled = true;
    finalBanner.classList.add('visible');
    finalBanner.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  checkBtn.addEventListener('click', verify);
  openBtn.addEventListener('click', openDoor);

  buildStage();
})();
