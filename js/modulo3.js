/* ===========================================================
   Módulo 3 · Escape Room
   Árbol, nodo marcado (★) y código de 3 dígitos distintos en
   cada partida (altura del árbol, profundidad del nodo ★ y
   número de hojas). Botón "Otra sala" genera un reto nuevo.
   =========================================================== */

(function(){
  const stage = document.getElementById('stage');
  const svg   = document.getElementById('lines');
  const clue1 = document.getElementById('clue1');
  const clue2 = document.getElementById('clue2');
  const clue3 = document.getElementById('clue3');
  const status1 = document.getElementById('status1');
  const status2 = document.getElementById('status2');
  const status3 = document.getElementById('status3');
  const checkBtn = document.getElementById('checkBtn');
  const openBtn  = document.getElementById('openBtn');
  const door = document.getElementById('door');
  const doorTitle = document.getElementById('doorTitle');
  const codeDisplay = document.getElementById('codeDisplay');
  const attemptsEl = document.getElementById('attempts');
  const finalBanner = document.getElementById('finalBanner');
  const finalBannerDetail = document.getElementById('finalBannerDetail');
  const newRoomBtn = document.getElementById('newRoomBtn');

  let tree, target, height, depth, leavesCount, code;
  let verified = [false, false, false];
  let attempts = 0;

  function pickTreeForRound(){
    const r = Math.random();
    if(r < 0.2) return randomTree('easy');
    if(r < 0.75) return randomTree('medium');
    return randomTree('hard');
  }

  function startRound(){
    tree = pickTreeForRound();
    const ids = Object.keys(tree.nodes).filter(id => id !== tree.root);
    target = pick(ids);
    height = treeHeight(tree);
    depth = tree.nodes[target].depth;
    leavesCount = leaves(tree).length;
    code = `${height}${depth}${leavesCount}`;
    verified = [false, false, false];
    attempts = 0;

    // Reset UI
    [clue1, clue2, clue3].forEach(inp => { inp.value = ''; inp.disabled = false; });
    [status1, status2, status3].forEach(s => { s.textContent = ''; s.className = 'clue-status'; });
    attemptsEl.textContent = 'Intentos: 0';
    codeDisplay.textContent = '_ _ _';
    door.classList.remove('open', 'shake');
    doorTitle.textContent = '🔒 Puerta cerrada';
    finalBanner.classList.remove('show');

    renderTree();
  }

  function renderTree(){
    drawTreeLines(svg, tree);
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    Object.keys(tree.nodes).forEach(id => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node filled';
      if(id === tree.root) el.classList.add('root-node');
      if(id === target) el.classList.add('target');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = id;
      stage.appendChild(el);
    });
  }

  function updateCodeDisplay(){
    const digits = [height, depth, leavesCount];
    codeDisplay.textContent = digits.map((d, i) => verified[i] ? d : '_').join(' ');
  }

  function verify(){
    const vals = [
      { input: clue1, status: status1, answer: height },
      { input: clue2, status: status2, answer: depth },
      { input: clue3, status: status3, answer: leavesCount }
    ];
    vals.forEach((v, i) => {
      const raw = v.input.value.trim();
      if(raw === ''){
        v.status.textContent = '';
        v.status.className = 'clue-status';
        verified[i] = false;
        return;
      }
      const ok = Number(raw) === v.answer;
      verified[i] = ok;
      v.status.textContent = ok ? '✓' : '✗';
      v.status.className = 'clue-status ' + (ok ? 'ok' : 'bad');
    });
    updateCodeDisplay();
    if(verified.every(Boolean)){
      showToast('¡Las 3 pistas son correctas! Ya puedes abrir la puerta.', 'ok');
    } else {
      showToast('Revisa las pistas marcadas con ✗.', 'bad');
    }
  }

  function tryOpen(){
    attempts++;
    attemptsEl.textContent = `Intentos: ${attempts}`;
    if(verified.every(Boolean)){
      door.classList.add('open');
      doorTitle.textContent = '🔓 Puerta abierta';
      finalBannerDetail.textContent =
        `Altura = ${height} · Profundidad(★) = ${depth} · Hojas = ${leavesCount} → código ${code}.`;
      finalBanner.classList.add('show');
      confettiBurst(80);
    } else {
      door.classList.add('shake');
      setTimeout(() => door.classList.remove('shake'), 400);
      showToast('Código incorrecto. Verifica tus 3 pistas primero.', 'bad');
    }
  }

  checkBtn.addEventListener('click', verify);
  openBtn.addEventListener('click', tryOpen);
  newRoomBtn.addEventListener('click', startRound);

  startRound();
})();
