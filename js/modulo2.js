/* ===========================================================
   Módulo 2 · Búsqueda del Tesoro
   Árbol, tesoro e instrucciones de recorrido aleatorios en cada
   partida. Las frases de instrucción varían para que no se
   sienta repetitivo aunque el patrón (izq/der) se repita.
   =========================================================== */

(function(){
  const stage = document.getElementById('stage');
  const svg   = document.getElementById('lines');
  const instructionText = document.getElementById('instructionText');
  const scoreEl = document.getElementById('scoreEl');
  const stepEl  = document.getElementById('stepEl');
  const totalStepsEl = document.getElementById('totalStepsEl');
  const posEl   = document.getElementById('posEl');
  const finalBanner = document.getElementById('finalBanner');
  const treasureNodeEl = document.getElementById('treasureNode');
  const finalScoreEl = document.getElementById('finalScore');
  const playAgainBtn = document.getElementById('playAgainBtn');

  const START_PHRASES = [
    'Empieza en la raíz y ve al {dir}.',
    'Desde la raíz, muévete al {dir}.',
    'Parte de la raíz y dirígete al {dir}.',
    'La aventura inicia en la raíz: ve al {dir}.'
  ];
  const STEP_PHRASES = [
    'Desde tu posición actual, ve al {dir}.',
    'Avanza al {dir} del nodo actual.',
    'Muévete al {dir} desde donde estás.',
    'Continúa hacia el {dir}.',
    'Un paso más: dirígete al {dir}.'
  ];

  let tree, treasure, path, instructions, currentIndex, score;

  function pickTreasure(){
    const leafList = leaves(tree);
    // Prioriza hojas profundas para más desafío, con algo de variedad.
    const sorted = leafList.slice().sort((a, b) => tree.nodes[b].depth - tree.nodes[a].depth);
    const topPool = sorted.filter(id => tree.nodes[id].depth >= Math.max(1, tree.maxDepth - 1));
    return pick(topPool.length ? topPool : leafList);
  }

  function buildPath(){
    const p = [treasure];
    let cur = treasure;
    while(tree.nodes[cur].parent){ cur = tree.nodes[cur].parent; p.push(cur); }
    return p.reverse(); // root ... treasure
  }

  function buildInstructions(){
    const list = [];
    for(let i = 1; i < path.length; i++){
      const fromId = path[i - 1], toId = path[i];
      const dir = tree.nodes[fromId].left === toId ? 'hijo izquierdo' : 'hijo derecho';
      const phrase = i === 1 ? pick(START_PHRASES) : pick(STEP_PHRASES);
      list.push(phrase.replace('{dir}', dir));
    }
    return list;
  }

  function startRound(){
    tree = randomTree(Math.random() < 0.5 ? 'medium' : 'hard');
    treasure = pickTreasure();
    path = buildPath();
    instructions = buildInstructions();
    currentIndex = 0;
    score = 0;

    finalBanner.classList.remove('show');
    scoreEl.textContent = '0';
    stepEl.textContent = '0';
    totalStepsEl.textContent = String(path.length - 1);
    posEl.textContent = tree.root;
    instructionText.textContent = instructions[0];

    renderTree();
  }

  function renderTree(){
    drawTreeLines(svg, tree, { litEdge: (id) => {
      const idx = path.indexOf(id);
      return idx > -1 && idx <= currentIndex && idx > 0;
    }});
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    Object.keys(tree.nodes).forEach(id => {
      const n = tree.nodes[id];
      const el = document.createElement('div');
      el.className = 'tree-node filled clickable';
      if(id === tree.root) el.classList.add('root-node');
      if(id === treasure) el.classList.add('treasure');
      if(id === path[currentIndex]) el.classList.add('current');
      if(path.slice(0, currentIndex).includes(id)) el.classList.add('visited');
      el.dataset.id = id;
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = id;
      el.addEventListener('click', () => handleClick(id));
      stage.appendChild(el);
    });
  }

  function handleClick(id){
    if(currentIndex >= path.length - 1) return; // ya llegó
    const expected = path[currentIndex + 1];
    if(id === expected){
      currentIndex++;
      score += 10;
      scoreEl.textContent = String(score);
      stepEl.textContent = String(currentIndex);
      posEl.textContent = id;
      renderTree();
      if(currentIndex === path.length - 1){
        finishRound();
      } else {
        instructionText.textContent = instructions[currentIndex];
        showToast('¡Bien! Sigue avanzando.', 'ok');
      }
    } else {
      score = Math.max(0, score - 5);
      scoreEl.textContent = String(score);
      const el = stage.querySelector(`.tree-node[data-id="${id}"]`);
      if(el){ el.classList.add('wrong-flash'); setTimeout(() => el.classList.remove('wrong-flash'), 400); }
      showToast('Ese no es el camino. Revisa la instrucción.', 'bad');
    }
  }

  function finishRound(){
    treasureNodeEl.textContent = treasure;
    finalScoreEl.textContent = String(score);
    instructionText.textContent = '¡Llegaste al tesoro! 🏆';
    finalBanner.classList.add('show');
    confettiBurst(70);
  }

  playAgainBtn.addEventListener('click', startRound);

  startRound();
})();
